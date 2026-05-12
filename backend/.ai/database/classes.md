# Table: `classes`

## Purpose

Documentation for `classes` table.

## Columns

| Column | Definition |
|---|---|
| `class_id` | `bigint [pk, increment]` |
| `class_code` | `varchar(50) [unique, not null]` |
| `class_name` | `varchar(255) [not null]` |
| `owner_id` | `bigint [not null]` |
| `status` | `active_status [default: 'active']` |

## Relationships

- classes.owner_id -> users.user_id

## Recommended Supabase Queries

```sql
select * from classes limit 20;
```

## Agent Notes

- Always select only required columns.
- Avoid `select *` in production flows.
- Use pagination for large datasets.