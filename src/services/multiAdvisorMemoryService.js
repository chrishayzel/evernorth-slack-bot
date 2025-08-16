import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class MultiAdvisorMemoryService {
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

  // Store new knowledge in shared knowledge base
  async storeSharedKnowledge(content, metadata = {}) {
    try {
      console.log('🧠 Storing new shared knowledge:', content.substring(0, 100) + '...');
      
      const embedding = await this.generateEmbedding(content);
      
      const { data, error } = await this.supabase
        .from('shared_knowledge')
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
        console.error('Error storing shared knowledge:', error);
        throw error;
      }

      console.log('✅ Shared knowledge stored successfully');
      return data;
    } catch (error) {
      console.error('Failed to store shared knowledge:', error);
      throw error;
    }
  }

  // Retrieve relevant knowledge from shared knowledge base
  async retrieveSharedKnowledge(query, threshold = 0.7, count = 3) {
    try {
      console.log('🔍 Retrieving shared knowledge for:', query);
      
      const queryEmbedding = await this.generateEmbedding(query);
      
      const { data, error } = await this.supabase.rpc('match_shared_knowledge', {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: count
      });

      if (error) {
        console.error('Error retrieving shared knowledge:', error);
        return [];
      }

      console.log(`📚 Found ${data.length} relevant shared documents`);
      return data;
    } catch (error) {
      console.error('Failed to retrieve shared knowledge:', error);
      return [];
    }
  }

  // Get or create advisor-specific thread mapping
  async getAdvisorThreadMapping(advisorId, slackThreadId) {
    try {
      // Try to find existing mapping
      let { data: existingThread } = await this.supabase
        .from('advisor_threads')
        .select('*')
        .eq('advisor_id', advisorId)
        .eq('slack_thread_id', slackThreadId)
        .single();

      if (existingThread) {
        console.log(`🔄 Found existing thread mapping for ${advisorId}`);
        return existingThread.openai_thread_id;
      }

      // Create new OpenAI thread
      console.log(`🆕 Creating new OpenAI thread for ${advisorId}`);
      const newThread = await this.openai.beta.threads.create();
      
      // Store the mapping
      const { error } = await this.supabase
        .from('advisor_threads')
        .insert({
          advisor_id: advisorId,
          slack_thread_id: slackThreadId,
          openai_thread_id: newThread.id,
          conversation_context: {}
        });

      if (error) {
        console.error('Error storing advisor thread mapping:', error);
        throw error;
      }

      console.log(`✅ New thread mapping created for ${advisorId}`);
      return newThread.id;
    } catch (error) {
      console.error('Failed to get advisor thread mapping:', error);
      throw error;
    }
  }

  // Store conversation in OpenAI thread
  async storeConversation(openaiThreadId, userMessage, assistantResponse) {
    try {
      // Add user message
      await this.openai.beta.threads.messages.create(openaiThreadId, {
        role: 'user',
        content: userMessage
      });

      // Add assistant response
      await this.openai.beta.threads.messages.create(openaiThreadId, {
        role: 'assistant',
        content: assistantResponse
      });

      console.log('💬 Conversation stored in thread');
    } catch (error) {
      console.error('Failed to store conversation:', error);
      // Don't throw - conversation storage failure shouldn't break the bot
    }
  }

  // Get conversation history for an advisor
  async getConversationHistory(openaiThreadId, limit = 10) {
    try {
      const { data: messages } = await this.openai.beta.threads.messages.list(
        openaiThreadId,
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

  // Store advisor-specific short-term memory
  async storeAdvisorMemory(advisorId, memoryKey, memoryValue, expiresAt = null) {
    try {
      console.log(`🧠 Storing memory for ${advisorId}: ${memoryKey}`);
      
      const { data, error } = await this.supabase
        .from('advisor_memory')
        .upsert({
          advisor_id: advisorId,
          memory_key: memoryKey,
          memory_value: memoryValue,
          expires_at: expiresAt,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'advisor_id,memory_key'
        })
        .select()
        .single();

      if (error) {
        console.error('Error storing advisor memory:', error);
        throw error;
      }

      console.log(`✅ Memory stored for ${advisorId}: ${memoryKey}`);
      return data;
    } catch (error) {
      console.error('Failed to store advisor memory:', error);
      throw error;
    }
  }

  // Retrieve advisor-specific short-term memory
  async getAdvisorMemory(advisorId, memoryKey) {
    try {
      const { data, error } = await this.supabase
        .from('advisor_memory')
        .select('*')
        .eq('advisor_id', advisorId)
        .eq('memory_key', memoryKey)
        .is('expires_at', null) // Only get non-expired memory
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No memory found
          return null;
        }
        console.error('Error retrieving advisor memory:', error);
        throw error;
      }

      return data.memory_value;
    } catch (error) {
      console.error('Failed to retrieve advisor memory:', error);
      return null;
    }
  }

  // Get advisor profile
  async getAdvisorProfile(advisorId) {
    try {
      const { data, error } = await this.supabase.rpc('get_advisor_profile', {
        advisor_id_param: advisorId
      });

      if (error) {
        console.error('Error getting advisor profile:', error);
        return null;
      }

      if (data && data.length > 0) {
        return data[0];
      }

      return null;
    } catch (error) {
      console.error('Failed to get advisor profile:', error);
      return null;
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

  // Clean up expired memory
  async cleanupExpiredMemory() {
    try {
      const { error } = await this.supabase
        .from('advisor_memory')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        console.error('Error cleaning up expired memory:', error);
      } else {
        console.log('🧹 Cleaned up expired memory');
      }
    } catch (error) {
      console.error('Failed to cleanup expired memory:', error);
    }
  }
}
