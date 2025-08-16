-- Enable the pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create shared knowledge base (accessible by all advisors)
CREATE TABLE IF NOT EXISTS shared_knowledge (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create advisor-specific conversation threads
CREATE TABLE IF NOT EXISTS advisor_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  advisor_id TEXT NOT NULL, -- e.g., 'north', 'strategist', 'ops', 'content'
  slack_thread_id TEXT NOT NULL,
  openai_thread_id TEXT NOT NULL,
  conversation_context JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(advisor_id, slack_thread_id)
);

-- Create advisor-specific short-term memory
CREATE TABLE IF NOT EXISTS advisor_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  advisor_id TEXT NOT NULL,
  memory_key TEXT NOT NULL, -- e.g., 'user_preferences', 'current_context', 'recent_topics'
  memory_value JSONB NOT NULL,
  expires_at TIMESTAMP, -- NULL means permanent memory
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(advisor_id, memory_key)
);

-- Create advisor profiles
CREATE TABLE IF NOT EXISTS advisor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  advisor_id TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  capabilities JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS shared_knowledge_embedding_idx ON shared_knowledge USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS shared_knowledge_metadata_idx ON shared_knowledge USING GIN (metadata);
CREATE INDEX IF NOT EXISTS advisor_threads_advisor_idx ON advisor_threads (advisor_id);
CREATE INDEX IF NOT EXISTS advisor_threads_slack_idx ON advisor_threads (slack_thread_id);
CREATE INDEX IF NOT EXISTS advisor_memory_advisor_idx ON advisor_memory (advisor_id);
CREATE INDEX IF NOT EXISTS advisor_memory_expires_idx ON advisor_memory (expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS advisor_profiles_active_idx ON advisor_profiles (is_active);

-- Insert default advisor profiles
INSERT INTO advisor_profiles (advisor_id, display_name, description, system_prompt, capabilities) VALUES
('north', 'North', 'General AI advisor for Evernorth', 'You are North, an AI advisor for Evernorth. You help with general questions and can access shared knowledge.', '{"general_advice": true, "company_info": true, "process_help": true}'),
('strategist', 'Strategist', 'Strategic planning and business strategy advisor', 'You are the Strategist, an AI advisor focused on business strategy, planning, and strategic thinking for Evernorth.', '{"strategy": true, "planning": true, "business_analysis": true}'),
('ops', 'Ops', 'Operations and process optimization advisor', 'You are Ops, an AI advisor focused on operations, process optimization, and efficiency improvements for Evernorth.', '{"operations": true, "processes": true, "efficiency": true}'),
('content', 'Content', 'Content creation and communication advisor', 'You are Content, an AI advisor focused on content creation, communication strategies, and messaging for Evernorth.', '{"content": true, "communication": true, "messaging": true}')
ON CONFLICT (advisor_id) DO NOTHING;
