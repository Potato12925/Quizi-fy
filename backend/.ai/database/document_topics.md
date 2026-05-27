# Table: `document_topics`

## Purpose

Join table between documents and topics. This is the path used to infer subject from a document.

## Columns

| Column | Definition |
|---|---|
| `document_topic_id` | `bigint [pk, increment]` |
| `document_id` | `bigint [not null]` |
| `topic_id` | `bigint [not null]` |
| `created_at` | `timestamp` |

## Indexes

- `(document_id, topic_id) [unique]`
- `(document_id)`
- `(topic_id)`

## Relationships

- document_topics.document_id -> documents.document_id
- document_topics.topic_id -> topics.topic_id
- ai_requests.document_topic_id -> document_topics.document_topic_id
- questions.document_topic_id -> document_topics.document_topic_id
- practice_sets.document_topic_id -> document_topics.document_topic_id

## Recommended Supabase Queries

```sql
select document_topic_id, document_id, topic_id from document_topics limit 20;
```
