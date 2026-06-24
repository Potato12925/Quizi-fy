CREATE TABLE IF NOT EXISTS document_chunks (
    chunk_id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES documents(document_id),
    chunk_index INT NOT NULL,
    chunk_title TEXT,
    chunk_text TEXT NOT NULL,
    chunk_hash VARCHAR(255),
    start_char INT,
    end_char INT,
    page_from INT,
    page_to INT,
    token_count INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_document_chunks_document ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_chunk_hash ON document_chunks(chunk_hash);
CREATE UNIQUE INDEX IF NOT EXISTS uq_document_chunks_document_chunk_index_active
ON document_chunks(document_id, chunk_index)
WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS question_sources (
    question_source_id BIGSERIAL PRIMARY KEY,
    question_id BIGINT NOT NULL REFERENCES questions(question_id),
    chunk_id BIGINT NOT NULL REFERENCES document_chunks(chunk_id),
    relevance_score NUMERIC,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_question_source_question_chunk UNIQUE(question_id, chunk_id)
);

CREATE INDEX IF NOT EXISTS idx_question_sources_question ON question_sources(question_id);
CREATE INDEX IF NOT EXISTS idx_question_sources_chunk ON question_sources(chunk_id);
