# Table: `practice_set_questions`

## Purpose

Documentation for `practice_set_questions` table.

## Columns

| Column | Definition |
|---|---|
| `practice_set_question_id` | `bigint [pk, increment]` |
| `practice_set_id` | `bigint [not null]` |
| `question_id` | `bigint [not null]` |
| `order_num` | `int [not null]` |

## Relationships

- practice_set_questions.practice_set_id -> practice_sets.practice_set_id
- practice_set_questions.question_id -> questions.question_id

## Recommended Supabase Queries

```sql
select * from practice_set_questions limit 20;
```

## Agent Notes

- Always select only required columns.
- Avoid `select *` in production flows.
- Use pagination for large datasets.
