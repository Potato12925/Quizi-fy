# Table: `subjects`

## Purpose

Documentation for `subjects` table.

## Columns

| Column | Definition |
|---|---|
| `subject_id` | `bigint [pk, increment]` |
| `subject_code` | `varchar(50) [unique, not null]` |
| `subject_name` | `varchar(255) [not null]` |
| `description` | `text` |
| `status` | `active_status [default: 'active']` |
| `created_at` | `datetime` |
| `updated_at` | `datetime` |
| `deleted_at` | `datetime` |

## Relationships

- No direct relationship found

## Recommended Supabase Queries

```sql
select * from subjects limit 20;
```

## Agent Notes

- Always select only required columns.
- Avoid `select *` in production flows.
- Use pagination for large datasets.
