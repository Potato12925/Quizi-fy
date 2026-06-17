# class_students

## Purpose

Join table linking students to classes.

## Columns

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `class_student_id` | bigint | PK | Join row identifier |
| `class_id` | bigint | not null, FK | References `classes` |
| `student_id` | bigint | not null, FK | References `users` |
| `joined_at` | timestamp |  | Enrollment time |
| `deleted_at` | timestamp |  | Soft delete marker |

## Relationships

- `class_id -> classes.class_id`
- `student_id -> users.user_id`

## Notes

- Supports many students per class.
- Uses soft delete via `deleted_at`.
