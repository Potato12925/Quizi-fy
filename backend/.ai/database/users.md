# Table: `users`

## Purpose

Documentation for `users` table.

## Columns

| Column | Definition |
|---|---|
| `user_id` | `bigint [pk, increment]` |
| `username` | `varchar(100) [unique, not null]` |
| `password_hash` | `varchar(255) [not null]` |
| `full_name` | `varchar(255) [not null]` |
| `is_active` | `boolean [default: true]` |
| `must_change_password` | `boolean [default: true]` |
| `created_at` | `datetime` |
| `updated_at` | `datetime` |
| `deleted_at` | `datetime` |

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
