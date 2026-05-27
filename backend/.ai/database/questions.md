# Table: `questions`

## Purpose

Documentation for `questions` table.

## Columns

| Column | Definition |
|---|---|
| `question_id` | `bigint [pk, increment]` |
| `teacher_id` | `bigint [not null]` |
| `document_topic_id` | `bigint [not null]` |
| `ai_request_id` | `bigint` |
| `content` | `text [not null]` |
| `difficulty` | `difficulty_level [not null]` |
| `source` | `question_source [not null]` |
| `status` | `question_status [default: 'draft']` |
| `explanation` | `text` |
| `created_at` | `timestamp` |
| `updated_at` | `timestamp` |
| `deleted_at` | `timestamp` |

## Indexes

- `(document_topic_id)`
- `(document_topic_id, difficulty, status)`
- `(status)`
- `(teacher_id, created_at)`

## Relationships

- questions.teacher_id -> users.user_id
- questions.document_topic_id -> document_topics.document_topic_id
- questions.ai_request_id -> ai_requests.request_id
- question_options.question_id -> questions.question_id
- question_history.question_id -> questions.question_id
- practice_set_questions.question_id -> questions.question_id
- student_answers.question_id -> questions.question_id

## Recommended Supabase Queries

```sql
select * from questions limit 20;
```

## Agent Notes

- Always select only required columns.
- Avoid `select *` in production flows.
- Use pagination for large datasets.

