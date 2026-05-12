# Table: `roles`

## Purpose

Documentation for `roles` table.

## Columns

| Column | Definition |
|---|---|
| `role_id` | `bigint [pk, increment]` |
| `role_code` | `varchar(50) [unique, not null]` |
| `role_name` | `varchar(100) [not null]` |

## Relationships

- No direct relationship found

## Recommended Supabase Queries

```sql
select * from roles limit 20;
```

## Agent Notes

- Always select only required columns.
- Avoid `select *` in production flows.
- Use pagination for large datasets.