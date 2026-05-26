# Table: `practice_sets`

## Purpose

Documentation for `practice_sets` table.

## Columns

| Column | Definition |
|---|---|
| `practice_set_id` | `bigint [pk, increment]` |
| `student_id` | `bigint [not null]` |
| `subject_id` | `bigint [not null]` |
| `topic_id` | `bigint` |
| `difficulty` | `difficulty_level` |
| `num_questions_requested` | `int [not null]` |
| `num_questions_actual` | `int` |
| `time_limit_minutes` | `int` |
| `prioritize_unanswered` | `boolean [default: false]` |
| `created_at` | `datetime` |

## Relationships

- practice_sets.student_id -> users.user_id
- practice_sets.subject_id -> subjects.subject_id
- practice_sets.topic_id -> topics.topic_id

## Recommended Supabase Queries

```sql
select * from practice_sets limit 20;
```

## Agent Notes

- Always select only required columns.
- Avoid `select *` in production flows.
- Use pagination for large datasets.
