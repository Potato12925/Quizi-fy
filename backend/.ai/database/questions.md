# Table: `questions`

## Purpose

Documentation for `questions` table.

## Columns

| Column | Definition |
|---|---|
| `question_id` | `bigint [pk, increment]` |
| `teacher_id` | `bigint [not null]` |
| `subject_id` | `bigint [not null]` |
| `topic_id` | `bigint [not null]` |
| `content` | `text [not null]` |
| `difficulty` | `difficulty_level [not null]` |
| `source` | `question_source [not null]` |
| `status` | `question_status [default: 'draft']` |

## Relationships

- questions.teacher_id -> users.user_id
- questions.subject_id -> subjects.subject_id
- questions.topic_id -> topics.topic_id
- questions.document_id -> documents.document_id
- questions.ai_request_id -> ai_requests.request_id
- questions.approved_by -> users.user_id

## Recommended Supabase Queries

```sql
select * from questions limit 20;
```

## Agent Notes

- Always select only required columns.
- Avoid `select *` in production flows.
- Use pagination for large datasets.