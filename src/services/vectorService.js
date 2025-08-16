const { createClient } = require('@supabase/supabase-js');

class VectorService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  // Store a new conversation or piece of knowledge
  async storeKnowledge(content, metadata = {}) {
    try {
      const { data, error } = await this.supabase
        .from('knowledge_base')
        .insert([
          {
            content: content,
            metadata: metadata,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error storing knowledge:', error);
      throw error;
    }
  }

  // Search for relevant knowledge based on a question
  async searchKnowledge(question, limit = 5) {
    try {
      // For now, we'll do a simple text search
      // Later, this will use Supabase's vector similarity search
      const { data, error } = await this.supabase
        .from('knowledge_base')
        .select('*')
        .ilike('content', `%${question}%`)
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching knowledge:', error);
      return [];
    }
  }

  // Store conversation history
  async storeConversation(userId, channelId, question, response, metadata = {}) {
    try {
      const { data, error } = await this.supabase
        .from('conversation_history')
        .insert([
          {
            user_id: userId,
            channel_id: channelId,
            question: question,
            response: response,
            metadata: metadata,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error storing conversation:', error);
      throw error;
    }
  }

  // Get conversation history for context
  async getConversationHistory(userId, channelId, limit = 3) {
    try {
      const { data, error } = await this.supabase
        .from('conversation_history')
        .select('*')
        .eq('user_id', userId)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting conversation history:', error);
      return [];
    }
  }
}

module.exports = VectorService;
