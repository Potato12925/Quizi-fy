# classes

## Purpose

Stores class groups managed by teachers.

## Columns

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `class_id` | bigint | PK | Class identifier |
| `class_code` | varchar | not null, unique | Stable class code |
| `class_name` | varchar | not null | Class display name |
| `description` | text |  | Optional class description |
| `teacher_id` | bigint | not null, FK | Owner or primary teacher |
| `status` | `active_status` |  | Active or inactive |
| `created_at` | timestamp |  | Creation time |
| `updated_at` | timestamp |  | Last update time |
| `deleted_at` | timestamp |  | Soft delete marker |

## Relationships

- `teacher_id -> users.user_id`
- `class_teachers.class_id -> classes.class_id`
- `class_students.class_id -> classes.class_id`
- `class_subjects.class_id -> classes.class_id`

## Notes

- This is a soft-delete table.
- A class has one primary teacher through `teacher_id`, but can also have additional teachers through `class_teachers`.
