# Table: `question_history`

## Purpose

Documentation for `question_history` table.

## Columns

| Column | Definition |
|---|---|
| `history_id` | `bigint [pk, increment]` |
| `question_id` | `bigint [not null]` |
| `changed_by` | `bigint [not null]` |

## Relationships

- question_history.question_id -> questions.question_id
- question_history.changed_by -> users.user_id

## Recommended Supabase Queries

```sql
select * from question_history limit 20;
```

## Agent Notes

- Always select only required columns.
- Avoid `select *` in production flows.
- Use pagination for large datasets.