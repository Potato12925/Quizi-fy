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
| `created_at` | `timestamp` |
| `updated_at` | `timestamp` |
| `deleted_at` | `timestamp` |

## Relationships

- class_subjects.subject_id -> subjects.subject_id
- documents.subject_id -> subjects.subject_id
- practice_sets.subject_id -> subjects.subject_id

## Recommended Supabase Queries

```sql
select * from subjects limit 20;
```

## Agent Notes

- Always select only required columns.
- Avoid `select *` in production flows.
- Use pagination for large datasets.

