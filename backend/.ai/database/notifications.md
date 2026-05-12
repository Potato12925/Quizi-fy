# Table: `notifications`

## Purpose

Documentation for `notifications` table.

## Columns

| Column | Definition |
|---|---|
| `notification_id` | `bigint [pk, increment]` |
| `user_id` | `bigint [not null]` |
| `is_read` | `boolean [default: false]` |

## Relationships

- notifications.user_id -> users.user_id

## Recommended Supabase Queries

```sql
select * from notifications limit 20;
```

## Agent Notes

- Always select only required columns.
- Avoid `select *` in production flows.
- Use pagination for large datasets.