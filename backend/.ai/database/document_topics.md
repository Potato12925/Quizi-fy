# document_topics

## Purpose

Join table linking a document to a topic. This is the core scope unit for AI generation.

## Columns

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `document_topic_id` | bigint | PK | Scoped document-topic identifier |
| `document_id` | bigint | not null, FK | References `documents` |
| `topic_id` | bigint | not null, FK | References `topics` |
| `created_at` | timestamp |  | Link creation time |

## Relationships

- `document_id -> documents.document_id`
- `topic_id -> topics.topic_id`
- `ai_requests.document_topic_id -> document_topics.document_topic_id`
- `questions.document_topic_id -> document_topics.document_topic_id`
- `practice_sets.document_topic_id -> document_topics.document_topic_id`

## Notes

- This table is the main content scope boundary reused by AI requests, generated questions, and practice sets.
