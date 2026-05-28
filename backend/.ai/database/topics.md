# Table: `topics`

## Purpose

Subject-scoped topic catalog used for document mapping and question generation.

## Columns

| Column | Definition |
|---|---|
| `topic_id` | `bigint [pk, increment]` |
| `subject_id` | `bigint [not null]` |
| `topic_name` | `varchar(255) [not null]` |
| `description` | `text` |
| `created_at` | `timestamp` |
| `updated_at` | `timestamp` |
| `deleted_at` | `timestamp` |

## Indexes

- `(subject_id, topic_name) [unique]`
- `(subject_id)`

## Relationships

- topics.subject_id -> subjects.subject_id
- document_topics.topic_id -> topics.topic_id

## Recommended Supabase Queries

```sql
select topic_id, subject_id, topic_name from topics limit 20;
```
