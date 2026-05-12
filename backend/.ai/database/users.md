# Table: `users`

## Purpose

Documentation for `users` table.

## Columns

| Column | Definition |
|---|---|
| `user_id` | `bigint [pk, increment]` |
| `google_id` | `varchar(100) [unique, not null]` |
| `email` | `varchar(255) [unique, not null]` |
| `full_name` | `varchar(255) [not null]` |
| `is_active` | `boolean [default: true]` |

## Relationships

- No direct relationship found

## Recommended Supabase Queries

```sql
select * from users limit 20;
```

## Agent Notes

- Always select only required columns.
- Avoid `select *` in production flows.
- Use pagination for large datasets.