# Table: `topics`

## Purpose

Documentation for `topics` table.

## Columns

| Column | Definition |
|---|---|
| `topic_id` | `bigint [pk, increment]` |
| `topic_name` | `varchar(255) [unique, not null]` |
| `description` | `text` |
| `created_at` | `timestamp` |
| `updated_at` | `timestamp` |

## Relationships

- document_topics.topic_id -> topics.topic_id

## Recommended Supabase Queries

```sql
select * from topics limit 20;
```

## Agent Notes

- Always select only required columns.
- Avoid `select *` in production flows.
- Use pagination for large datasets.

