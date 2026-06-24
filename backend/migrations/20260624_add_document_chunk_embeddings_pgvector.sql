CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE document_chunks
ADD COLUMN IF NOT EXISTS embedding vector(1536);

CREATE OR REPLACE FUNCTION match_document_chunks(
    p_document_id BIGINT,
    p_query_embedding vector(1536),
    p_limit INT
)
RETURNS TABLE (
    chunk_id BIGINT,
    document_id BIGINT,
    chunk_index INT,
    chunk_title TEXT,
    chunk_text TEXT,
    chunk_hash VARCHAR,
    start_char INT,
    end_char INT,
    page_from INT,
    page_to INT,
    token_count INT,
    created_at TIMESTAMP,
    deleted_at TIMESTAMP,
    similarity_score DOUBLE PRECISION
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        dc.chunk_id,
        dc.document_id,
        dc.chunk_index,
        dc.chunk_title,
        dc.chunk_text,
        dc.chunk_hash,
        dc.start_char,
        dc.end_char,
        dc.page_from,
        dc.page_to,
        dc.token_count,
        dc.created_at,
        dc.deleted_at,
        1 - (dc.embedding <=> p_query_embedding) AS similarity_score
    FROM document_chunks dc
    WHERE dc.document_id = p_document_id
      AND dc.deleted_at IS NULL
      AND dc.embedding IS NOT NULL
    ORDER BY dc.embedding <=> p_query_embedding, dc.chunk_index ASC
    LIMIT GREATEST(COALESCE(p_limit, 12), 1);
$$;
