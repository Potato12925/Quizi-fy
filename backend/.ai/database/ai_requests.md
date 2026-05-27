# Table: `ai_requests`

## Purpose

Documentation for `ai_requests` table.

## Columns

| Column | Definition |
|---|---|
| `request_id` | `bigint [pk, increment]` |
| `teacher_id` | `bigint [not null]` |
| `document_id` | `bigint [not null]` |
| `num_questions` | `int [not null]` |
| `difficulty` | `difficulty_level [not null]` |
| `content_scope` | `text` |
| `status` | `ai_request_status [default: 'pending']` |
| `generated_question_count` | `int [default: 0]` |
| `retry_count` | `int [default: 0]` |
| `error_message` | `text` |
| `created_at` | `datetime` |
| `updated_at` | `datetime` |

## Relationships

- ai_requests.teacher_id -> users.user_id
- ai_requests.document_id -> documents.document_id

## Recommended Supabase Queries

```sql
select * from ai_requests limit 20;
```

## Agent Notes

- Always select only required columns.
- Avoid `select *` in production flows.
- Use pagination for large datasets.
