# Table: `document_topics`

## Purpose

Documentation for `document_topics` table.

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
- questions.document_topic_id -> document_topics.document_topic_id
- practice_sets.document_topic_id -> document_topics.document_topic_id

## Recommended Supabase Queries

```sql
select * from document_topics limit 20;
```

## Agent Notes

- Always select only required columns.
- Avoid `select *` in production flows.
- Use pagination for large datasets.

