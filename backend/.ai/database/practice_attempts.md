# Table: `practice_attempts`

## Purpose

Documentation for `practice_attempts` table.

## Columns

| Column | Definition |
|---|---|
| `attempt_id` | `bigint [pk, increment]` |
| `practice_set_id` | `bigint [not null]` |
| `total_correct` | `int [default: 0]` |
| `total_wrong` | `int [default: 0]` |
| `status` | `practice_attempt_status [default: 'in_progress']` |

## Relationships

- practice_attempts.practice_set_id -> practice_sets.practice_set_id

## Recommended Supabase Queries

```sql
select * from practice_attempts limit 20;
```

## Agent Notes

- Always select only required columns.
- Avoid `select *` in production flows.
- Use pagination for large datasets.