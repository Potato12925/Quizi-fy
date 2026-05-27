# Table: `topics`

## Purpose

Documentation for `topics` table.

## Columns

| Column | Definition |
|---|---|
| `topic_id` | `bigint [pk, increment]` |
| `subject_id` | `bigint [not null]` |
| `topic_name` | `varchar(255) [not null]` |
| `description` | `text` |
| `created_at` | `datetime` |
| `updated_at` | `datetime` |

## Relationships

- topics.subject_id -> subjects.subject_id

## Recommended Supabase Queries

```sql
select * from topics limit 20;
```

## Agent Notes

- Always select only required columns.
- Avoid `select *` in production flows.
- Use pagination for large datasets.
