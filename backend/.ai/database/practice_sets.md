# Table: `practice_sets`

## Purpose

Documentation for `practice_sets` table.

## Columns

| Column | Definition |
|---|---|
| `practice_set_id` | `bigint [pk, increment]` |
| `student_id` | `bigint [not null]` |
| `subject_id` | `bigint [not null]` |
| `document_topic_id` | `bigint` |
| `difficulty` | `difficulty_level` |
| `num_questions_requested` | `int [not null]` |
| `num_questions_actual` | `int` |
| `time_limit_minutes` | `int` |
| `prioritize_unanswered` | `boolean [default: false]` |
| `created_at` | `timestamp` |

## Indexes

- `(student_id, created_at)`
- `(document_topic_id)`

## Relationships

- practice_sets.student_id -> users.user_id
- practice_sets.subject_id -> subjects.subject_id
- practice_sets.document_topic_id -> document_topics.document_topic_id
- practice_set_questions.practice_set_id -> practice_sets.practice_set_id
- practice_attempts.practice_set_id -> practice_sets.practice_set_id

## Recommended Supabase Queries

```sql
select * from practice_sets limit 20;
```

## Agent Notes

- Always select only required columns.
- Avoid `select *` in production flows.
- Use pagination for large datasets.

