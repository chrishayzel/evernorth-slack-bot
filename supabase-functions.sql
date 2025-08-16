-- Function for vector similarity search in shared knowledge
CREATE OR REPLACE FUNCTION match_shared_knowledge(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    shared_knowledge.id,
    shared_knowledge.content,
    shared_knowledge.metadata,
    1 - (shared_knowledge.embedding <=> query_embedding) AS similarity
  FROM shared_knowledge
  WHERE 1 - (shared_knowledge.embedding <=> query_embedding) > match_threshold
  ORDER BY shared_knowledge.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to get advisor profile
CREATE OR REPLACE FUNCTION get_advisor_profile(advisor_id_param text)
RETURNS TABLE (
  id uuid,
  advisor_id text,
  display_name text,
  description text,
  system_prompt text,
  capabilities jsonb,
  is_active boolean
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ap.id,
    ap.advisor_id,
    ap.display_name,
    ap.description,
    ap.system_prompt,
    ap.capabilities,
    ap.is_active
  FROM advisor_profiles ap
  WHERE ap.advisor_id = advisor_id_param
    AND ap.is_active = true;
END;
$$;
