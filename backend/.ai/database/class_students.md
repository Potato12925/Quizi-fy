# Table: `class_students`

## Purpose

Documentation for `class_students` table.

## Columns

| Column | Definition |
|---|---|
| `class_student_id` | `bigint [pk, increment]` |
| `class_id` | `bigint [not null]` |
| `student_id` | `bigint [not null]` |
| `invited_by` | `bigint [not null]` |
| `joined_at` | `datetime` |
| `deleted_at` | `datetime` |

## Relationships

- class_students.class_id -> classes.class_id
- class_students.student_id -> users.user_id
- class_students.invited_by -> users.user_id

## Recommended Supabase Queries

```sql
select * from class_students limit 20;
```

## Agent Notes

- Always select only required columns.
- Avoid `select *` in production flows.
- Use pagination for large datasets.
