# Table: `ai_requests`

## Purpose

Tracks AI generation jobs per document-topic relation.

## Columns

| Column | Definition |
|---|---|
| `request_id` | `bigint [pk, increment]` |
| `document_topic_id` | `bigint [not null]` |
| `num_questions` | `int [not null]` |
| `difficulty` | `difficulty_level [not null]` |
| `content_scope` | `text` |
| `status` | `ai_request_status [default: 'pending']` |
| `generated_question_count` | `int [default: 0]` |
| `retry_count` | `int [default: 0]` |
| `error_message` | `text` |
| `created_at` | `timestamp` |
| `updated_at` | `timestamp` |

## Indexes

- `(document_topic_id)`
- `(status, created_at)`

## Relationships

- ai_requests.document_topic_id -> document_topics.document_topic_id
- questions.ai_request_id -> ai_requests.request_id

## Recommended Supabase Queries

```sql
select request_id, document_topic_id, status from ai_requests limit 20;
```
