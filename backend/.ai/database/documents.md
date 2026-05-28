# Table: `documents`

## Purpose

Uploaded source files owned by teachers. Subject is inferred via document_topics -> topics.

## Columns

| Column | Definition |
|---|---|
| `document_id` | `bigint [pk, increment]` |
| `teacher_id` | `bigint [not null]` |
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
- `(status)`

## Relationships

- documents.teacher_id -> users.user_id
- document_topics.document_id -> documents.document_id

## Recommended Supabase Queries

```sql
select document_id, teacher_id, title, status from documents limit 20;
```
