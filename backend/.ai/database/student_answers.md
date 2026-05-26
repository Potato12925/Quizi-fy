# Table: `student_answers`

## Purpose

Documentation for `student_answers` table.

## Columns

| Column | Definition |
|---|---|
| `answer_id` | `bigint [pk, increment]` |
| `attempt_id` | `bigint [not null]` |
| `question_id` | `bigint [not null]` |
| `selected_option_id` | `bigint` |
| `is_correct` | `boolean` |
| `answered_at` | `datetime` |

## Relationships

- student_answers.attempt_id -> practice_attempts.attempt_id
- student_answers.question_id -> questions.question_id
- student_answers.selected_option_id -> question_options.option_id

## Recommended Supabase Queries

```sql
select * from student_answers limit 20;
```

## Agent Notes

- Always select only required columns.
- Avoid `select *` in production flows.
- Use pagination for large datasets.
