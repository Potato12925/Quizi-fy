# Table: `user_roles`

## Purpose

Documentation for `user_roles` table.

## Columns

| Column | Definition |
|---|---|
| `user_role_id` | `bigint [pk, increment]` |
| `user_id` | `bigint [not null]` |
| `role_id` | `bigint [not null]` |

## Relationships

- user_roles.user_id -> users.user_id
- user_roles.role_id -> roles.role_id

## Recommended Supabase Queries

```sql
select * from user_roles limit 20;
```

## Agent Notes

- Always select only required columns.
- Avoid `select *` in production flows.
- Use pagination for large datasets.