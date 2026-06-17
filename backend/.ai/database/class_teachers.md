# class_teachers

## Purpose

Join table for assigning additional teachers to classes.

## Columns

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `class_teacher_id` | bigint | PK | Join row identifier |
| `class_id` | bigint | not null, FK | References `classes` |
| `teacher_id` | bigint | not null, FK | References `users` |
| `joined_at` | timestamp |  | Assignment time |
| `deleted_at` | timestamp |  | Soft delete marker |

## Relationships

- `class_id -> classes.class_id`
- `teacher_id -> users.user_id`

## Notes

- Supports many teachers per class.
- Uses soft delete via `deleted_at`.
