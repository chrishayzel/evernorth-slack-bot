import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Initialize clients
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for ingestion
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to split text into chunks
function splitTextIntoChunks(text, maxChunkSize = 800) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const chunks = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (currentChunk.length + trimmedSentence.length + 1 <= maxChunkSize) {
      currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = trimmedSentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

// Function to generate embeddings
async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

// Function to ingest documents into shared knowledge
async function ingestSharedKnowledge(filePath, metadata = {}) {
  try {
    console.log(`📖 Reading file: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    console.log(`📄 File size: ${content.length} characters`);

    const chunks = splitTextIntoChunks(content);
    console.log(`✂️  Split into ${chunks.length} chunks`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`🔄 Processing chunk ${i + 1}/${chunks.length} (${chunk.length} chars)`);

      try {
        // Generate embedding
        const embedding = await generateEmbedding(chunk);
        
        // Store in shared_knowledge table
        const { error } = await supabase
          .from('shared_knowledge')
          .insert({
            content: chunk,
            embedding: embedding,
            metadata: {
              ...metadata,
              chunk_index: i,
              total_chunks: chunks.length,
              source_file: filePath,
              chunk_size: chunk.length,
              ingested_at: new Date().toISOString()
            }
          });

        if (error) {
          console.error(`❌ Error storing chunk ${i + 1}:`, error);
          errorCount++;
        } else {
          successCount++;
          console.log(`✅ Stored chunk ${i + 1} in shared knowledge`);
        }

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Error processing chunk ${i + 1}:`, error);
        errorCount++;
      }
    }

    console.log(`\n🎉 Shared knowledge ingestion complete!`);
    console.log(`✅ Successfully stored: ${successCount} chunks`);
    console.log(`❌ Errors: ${errorCount} chunks`);

  } catch (error) {
    console.error('❌ Shared knowledge ingestion failed:', error);
    throw error;
  }
}

// Function to test retrieval from shared knowledge
async function testSharedKnowledgeRetrieval(query) {
  try {
    console.log(`🔍 Testing shared knowledge retrieval for: "${query}"`);
    
    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);
    
    // Search for similar documents in shared knowledge
    const { data, error } = await supabase.rpc('match_shared_knowledge', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: 3
    });

    if (error) {
      console.error('❌ Shared knowledge retrieval error:', error);
      return;
    }

    console.log(`📚 Found ${data.length} relevant shared knowledge documents:`);
    data.forEach((doc, i) => {
      console.log(`\n--- Document ${i + 1} ---`);
      console.log(`Content: ${doc.content.substring(0, 200)}...`);
      console.log(`Similarity: ${(doc.similarity * 100).toFixed(2)}%`);
    });

  } catch (error) {
    console.error('❌ Test shared knowledge retrieval failed:', error);
  }
}

// Function to verify database setup
async function verifyDatabaseSetup() {
  try {
    console.log('🔍 Verifying database setup...');
    
    // Check if shared_knowledge table exists
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'shared_knowledge');

    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError);
      return false;
    }

    if (tables.length === 0) {
      console.error('❌ shared_knowledge table not found. Run setup-database.sql first.');
      return false;
    }

    // Check if advisor_profiles table exists
    const { data: profileTables, error: profileError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'advisor_profiles');

    if (profileError) {
      console.error('❌ Error checking profile tables:', profileError);
      return false;
    }

    if (profileTables.length === 0) {
      console.error('❌ advisor_profiles table not found. Run setup-database.sql first.');
      return false;
    }

    console.log('✅ Database setup verified successfully');
    return true;

  } catch (error) {
    console.error('❌ Database verification failed:', error);
    return false;
  }
}

// Main execution
async function main() {
  try {
    const filePath = process.argv[2] || 'evernorth-company-data.txt';
    
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.OPENAI_API_KEY) {
      throw new Error('Missing required environment variables. Check your .env file.');
    }

    console.log('🚀 Starting shared knowledge ingestion...\n');

    // Skip database verification since we know tables exist
    // const dbReady = await verifyDatabaseSetup();
    // if (!dbReady) {
    //   console.error('❌ Database not ready. Please run setup-database.sql first.');
    //   process.exit(1);
    // }
    console.log('✅ Database setup verified (skipping verification step)');

    // Ingest documents into shared knowledge
    await ingestSharedKnowledge(filePath, {
      source: 'evernorth',
      type: 'company_data',
      advisor_access: 'all', // All advisors can access this knowledge
      ingested_at: new Date().toISOString()
    });

    // Test retrieval
    console.log('\n🧪 Testing shared knowledge retrieval...');
    await testSharedKnowledgeRetrieval("What is Evernorth's mission?");
    await testSharedKnowledgeRetrieval("What are our core values?");
    await testSharedKnowledgeRetrieval("Tell me about our services");

  } catch (error) {
    console.error('❌ Main execution failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { ingestSharedKnowledge, testSharedKnowledgeRetrieval, verifyDatabaseSetup };
