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
| `created_at` | `timestamp` |
| `updated_at` | `timestamp` |
| `deleted_at` | `timestamp` |

## Indexes

- `(username)`
- `(is_active)`

## Relationships

- user_roles.user_id -> users.user_id
- classes.owner_id -> users.user_id
- class_subjects.assigned_teacher_id -> users.user_id
- class_students.student_id -> users.user_id
- class_students.invited_by -> users.user_id
- class_teachers.teacher_id -> users.user_id
- class_teachers.added_by -> users.user_id
- documents.teacher_id -> users.user_id
- questions.teacher_id -> users.user_id
- question_history.changed_by -> users.user_id
- practice_sets.student_id -> users.user_id
- notifications.user_id -> users.user_id

## Recommended Supabase Queries

```sql
select * from users limit 20;
```

## Agent Notes

- Always select only required columns.
- Avoid `select *` in production flows.
- Use pagination for large datasets.

