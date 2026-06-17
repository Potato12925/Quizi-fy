# users

## Purpose

Stores application user accounts for all roles: admin, teacher, and student.

## Columns

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `user_id` | bigint | PK | User identifier |
| `username` | varchar | not null, unique | Login name |
| `password_hash` | varchar | not null | Hashed password |
| `full_name` | varchar | not null | Display name |
| `is_active` | boolean | default `true` | Account enabled flag |
| `must_change_password` | boolean | default `true` | Forces password rotation |
| `created_at` | timestamp |  | Creation time |
| `updated_at` | timestamp |  | Last update time |
| `deleted_at` | timestamp |  | Soft delete marker |

## Outgoing relationships

- `user_roles.user_id -> users.user_id`
- `classes.teacher_id -> users.user_id`
- `class_teachers.teacher_id -> users.user_id`
- `class_students.student_id -> users.user_id`
- `class_subjects.assigned_teacher_id -> users.user_id`
- `documents.teacher_id -> users.user_id`
- `questions.teacher_id -> users.user_id`
- `question_history.changed_by -> users.user_id`
- `practice_sets.student_id -> users.user_id`
- `notifications.user_id -> users.user_id`

## Incoming dependencies

- Core identity table referenced by RBAC, classroom, content generation, practice, and notifications.

## Notes

- This is a soft-delete table.
- Role membership is many-to-many through `user_roles`.
