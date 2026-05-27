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
| `description` | `text` |
| `file_url` | `text [not null]` |
| `file_hash` | `varchar(255)` |
| `file_type` | `varchar(20) [not null]` |
| `file_size` | `bigint [not null]` |
| `status` | `active_status [default: 'active']` |
| `created_at` | `timestamp` |
| `updated_at` | `timestamp` |
| `deleted_at` | `timestamp` |

## Indexes

- `(teacher_id, created_at)`
- `(subject_id, status)`

## Relationships

- documents.teacher_id -> users.user_id
- documents.subject_id -> subjects.subject_id
- document_topics.document_id -> documents.document_id
- ai_requests.document_id -> documents.document_id

## Recommended Supabase Queries

```sql
select * from documents limit 20;
```

## Agent Notes

- Always select only required columns.
- Avoid `select *` in production flows.
- Use pagination for large datasets.

