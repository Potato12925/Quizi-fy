# class_subjects

## Purpose

Bridge table connecting classes and subjects, with an optional assigned teacher.

## Columns

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `class_subject_id` | bigint | PK | Join row identifier |
| `class_id` | bigint | not null, FK | References `classes` |
| `subject_id` | bigint | not null, FK | References `subjects` |
| `assigned_teacher_id` | bigint | FK | Teacher assigned to this subject inside the class |
| `status` | `active_status` |  | Active or inactive |
| `created_at` | timestamp |  | Creation time |
| `updated_at` | timestamp |  | Last update time |
| `deleted_at` | timestamp |  | Soft delete marker |

## Relationships

- `class_id -> classes.class_id`
- `subject_id -> subjects.subject_id`
- `assigned_teacher_id -> users.user_id`
- `topics.class_subject_id -> class_subjects.class_subject_id`

## Notes

- Central table for course delivery context.
- Topics are scoped below this level.
