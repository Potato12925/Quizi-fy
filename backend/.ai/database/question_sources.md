# question_sources

## Purpose

Stores provenance links between generated questions and the document chunks used as source material.

## Columns

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `question_source_id` | bigint | PK | Provenance row identifier |
| `question_id` | bigint | not null, FK | Generated question |
| `chunk_id` | bigint | not null, FK | Source chunk used for generation |
| `relevance_score` | numeric |  | Retrieval score captured at generation time |
| `created_at` | timestamp | default `current_timestamp` | Creation time |

## Relationships

- `question_id -> questions.question_id`
- `chunk_id -> document_chunks.chunk_id`

## Indexes/Constraints

- `idx_question_sources_question`
- `idx_question_sources_chunk`
- `uq_question_source_question_chunk`

## Notes

- This table is append-only provenance.
- Reads of historical provenance should not require `document_chunks.deleted_at IS NULL`.
- A question may reference multiple chunks, and one chunk may support multiple questions.
