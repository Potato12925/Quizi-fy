# documents

## Purpose

Stores uploaded source documents used for AI question generation.

## Columns

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `document_id` | bigint | PK | Document identifier |
| `teacher_id` | bigint | not null, FK | Uploader or owner |
| `title` | varchar | not null | Document title |
| `description` | text |  | Optional description |
| `file_url` | text | not null | Storage URL |
| `file_hash` | varchar |  | Deduplication or integrity hash |
| `file_type` | varchar | not null | MIME-like or extension type |
| `file_size` | bigint | not null | File size in bytes |
| `status` | `active_status` |  | Active or inactive |
| `created_at` | timestamp |  | Creation time |
| `updated_at` | timestamp |  | Last update time |
| `deleted_at` | timestamp |  | Soft delete marker |

## Relationships

- `teacher_id -> users.user_id`
- `document_topics.document_id -> documents.document_id`
- `document_chunks.document_id -> documents.document_id`

## Notes

- This is a soft-delete table.
- Topic linkage is many-to-many through `document_topics`.
- RAG chunk records are versioned in `document_chunks`.
