import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class MemoryService {
  constructor() {
    this.supabase = supabase;
    this.openai = openai;
  }

  // Generate embedding for text
  async generateEmbedding(text) {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  // Store new knowledge in documents table
  async storeKnowledge(content, metadata = {}) {
    try {
      console.log('🧠 Storing new knowledge:', content.substring(0, 100) + '...');
      
      const embedding = await this.generateEmbedding(content);
      
      const { data, error } = await this.supabase
        .from('documents')
        .insert({
          content: content,
          embedding: embedding,
          metadata: {
            ...metadata,
            source: 'user_input',
            stored_at: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Error storing knowledge:', error);
        throw error;
      }

      console.log('✅ Knowledge stored successfully');
      return data;
    } catch (error) {
      console.error('Failed to store knowledge:', error);
      throw error;
    }
  }

  // Retrieve relevant knowledge based on query
  async retrieveKnowledge(query, threshold = 0.7, count = 3) {
    try {
      console.log('🔍 Retrieving knowledge for:', query);
      
      const queryEmbedding = await this.generateEmbedding(query);
      
      const { data, error } = await this.supabase.rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: count
      });

      if (error) {
        console.error('Error retrieving knowledge:', error);
        return [];
      }

      console.log(`📚 Found ${data.length} relevant documents`);
      return data;
    } catch (error) {
      console.error('Failed to retrieve knowledge:', error);
      return [];
    }
  }

  // Get or create thread mapping
  async getThreadMapping(slackThreadId, mode = 'advisor') {
    try {
      // Try to find existing mapping
      let { data: existingThread } = await this.supabase
        .from('threads')
        .select('*')
        .eq('slack_thread_id', slackThreadId)
        .single();

      if (existingThread) {
        console.log('🔄 Found existing thread mapping');
        return existingThread.assistant_thread_id;
      }

      // Create new OpenAI thread
      console.log('🆕 Creating new OpenAI thread');
      const newThread = await this.openai.beta.threads.create();
      
      // Store the mapping
      const { error } = await this.supabase
        .from('threads')
        .insert({
          slack_thread_id: slackThreadId,
          assistant_thread_id: newThread.id,
          mode: mode
        });

      if (error) {
        console.error('Error storing thread mapping:', error);
        throw error;
      }

      console.log('✅ New thread mapping created');
      return newThread.id;
    } catch (error) {
      console.error('Failed to get thread mapping:', error);
      throw error;
    }
  }

  // Store conversation in OpenAI thread
  async storeConversation(assistantThreadId, userMessage, assistantResponse) {
    try {
      // Add user message
      await this.openai.beta.threads.messages.create(assistantThreadId, {
        role: 'user',
        content: userMessage
      });

      // Add assistant response
      await this.openai.beta.threads.messages.create(assistantThreadId, {
        role: 'assistant',
        content: assistantResponse
      });

      console.log('💬 Conversation stored in thread');
    } catch (error) {
      console.error('Failed to store conversation:', error);
      // Don't throw - conversation storage failure shouldn't break the bot
    }
  }

  // Get conversation history
  async getConversationHistory(assistantThreadId, limit = 10) {
    try {
      const { data: messages } = await this.openai.beta.threads.messages.list(
        assistantThreadId,
        { limit: limit }
      );

      return messages.data.map(msg => ({
        role: msg.role,
        content: msg.content[0]?.text?.value || '',
        timestamp: msg.created_at
      }));
    } catch (error) {
      console.error('Failed to get conversation history:', error);
      return [];
    }
  }

  // Check if message is asking to remember something
  isMemoryRequest(message) {
    const memoryKeywords = [
      'remember that',
      'remember this',
      'store this',
      'save this',
      'note that',
      'keep in mind'
    ];
    
    const lowerMessage = message.toLowerCase();
    return memoryKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  // Extract knowledge from memory request
  extractKnowledgeFromRequest(message) {
    // Remove common memory request phrases
    let knowledge = message
      .replace(/@\w+/g, '') // Remove bot mentions
      .replace(/remember\s+that\s+/i, '')
      .replace(/remember\s+this\s+/i, '')
      .replace(/store\s+this\s+/i, '')
      .replace(/save\s+this\s+/i, '')
      .replace(/note\s+that\s+/i, '')
      .replace(/keep\s+in\s+mind\s+/i, '')
      .trim();

    return knowledge;
  }
}
