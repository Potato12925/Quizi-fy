# Table: `class_subjects`

## Purpose

Documentation for `class_subjects` table.

## Columns

| Column | Definition |
|---|---|
| `class_subject_id` | `bigint [pk, increment]` |
| `class_id` | `bigint [not null]` |
| `subject_id` | `bigint [not null]` |
| `assigned_teacher_id` | `bigint` |
| `status` | `active_status [default: 'active']` |
| `created_at` | `timestamp` |
| `updated_at` | `timestamp` |
| `deleted_at` | `timestamp` |

## Indexes

- `(class_id, subject_id) [unique]`

## Relationships

- class_subjects.class_id -> classes.class_id
- class_subjects.subject_id -> subjects.subject_id
- class_subjects.assigned_teacher_id -> users.user_id

## Recommended Supabase Queries

```sql
select * from class_subjects limit 20;
```

## Agent Notes

- Always select only required columns.
- Avoid `select *` in production flows.
- Use pagination for large datasets.

