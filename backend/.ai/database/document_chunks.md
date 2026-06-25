# document_chunks

## Purpose

Stores reusable text chunks extracted from uploaded documents for RAG-based question generation.

## Columns

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `chunk_id` | bigint | PK | Chunk identifier |
| `document_id` | bigint | not null, FK | Source document |
| `chunk_index` | int | not null | Stable order within one active document version |
| `chunk_title` | text |  | Inferred section heading when available |
| `chunk_text` | text | not null | Chunk body used for retrieval and prompting |
| `embedding` | vector(1536) |  | pgvector embedding for semantic retrieval |
| `chunk_hash` | varchar |  | Optional content hash for traceability |
| `start_char` | int |  | Character offset in the extracted document text |
| `end_char` | int |  | Character end offset in the extracted document text |
| `page_from` | int |  | First related page when available |
| `page_to` | int |  | Last related page when available |
| `token_count` | int |  | Approximate token count |
| `created_at` | timestamp | default `current_timestamp` | Creation time |
| `deleted_at` | timestamp |  | Soft delete marker for outdated chunk versions |

## Relationships

- `document_id -> documents.document_id`
- `question_sources.chunk_id -> document_chunks.chunk_id`

## Indexes/Constraints

- `idx_document_chunks_document`
- `idx_document_chunks_chunk_hash`
- Partial unique index on `(document_id, chunk_index)` where `deleted_at IS NULL`

## Notes

- This is a soft-delete table.
- File replacement should soft-delete old active chunks and create a new active set.
- Historical provenance may still reference soft-deleted chunk rows from prior document versions.
- The first embedding model is `text-embedding-3-small`, so the initial schema uses `vector(1536)`.
- Future embedding model upgrades should only require a config change plus schema migration for the new vector dimension.
