# Table: `documents`

## Purpose

Documentation for `documents` table.

## Columns

| Column | Definition |
|---|---|
| `document_id` | `bigint [pk, increment]` |
| `teacher_id` | `bigint [not null]` |
| `subject_id` | `bigint [not null]` |
| `title` | `varchar(500) [not null]` |
| `file_url` | `text [not null]` |
| `file_type` | `varchar(20) [not null]` |
| `file_size` | `bigint [not null]` |
| `status` | `active_status [default: 'active']` |

## Relationships

- documents.teacher_id -> users.user_id
- documents.subject_id -> subjects.subject_id
- documents.topic_id -> topics.topic_id

## Recommended Supabase Queries

```sql
select * from documents limit 20;
```

## Agent Notes

- Always select only required columns.
- Avoid `select *` in production flows.
- Use pagination for large datasets.