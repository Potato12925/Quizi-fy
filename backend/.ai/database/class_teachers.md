# Table: `class_teachers`

## Purpose

Documentation for `class_teachers` table.

## Columns

| Column | Definition |
|---|---|
| `class_teacher_id` | `bigint [pk, increment]` |
| `class_id` | `bigint [not null]` |
| `teacher_id` | `bigint [not null]` |
| `added_by` | `bigint [not null]` |
| `joined_at` | `timestamp` |
| `deleted_at` | `timestamp` |

## Indexes

- `(class_id, teacher_id) [unique]`

## Relationships

- class_teachers.class_id -> classes.class_id
- class_teachers.teacher_id -> users.user_id
- class_teachers.added_by -> users.user_id

## Recommended Supabase Queries

```sql
select * from class_teachers limit 20;
```

## Agent Notes

- Always select only required columns.
- Avoid `select *` in production flows.
- Use pagination for large datasets.

