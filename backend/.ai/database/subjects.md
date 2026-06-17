# subjects

## Purpose

Stores academic subjects used across classes and practice sets.

## Columns

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `subject_id` | bigint | PK | Subject identifier |
| `subject_code` | varchar | not null, unique | Stable subject code |
| `subject_name` | varchar | not null | Subject name |
| `description` | text |  | Subject details |
| `status` | `active_status` |  | Active or inactive |
| `created_at` | timestamp |  | Creation time |
| `updated_at` | timestamp |  | Last update time |
| `deleted_at` | timestamp |  | Soft delete marker |

## Relationships

- `class_subjects.subject_id -> subjects.subject_id`
- `practice_sets.subject_id -> subjects.subject_id`

## Notes

- This is a soft-delete table.
