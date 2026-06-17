# topics

## Purpose

Stores topic units under a specific class-subject context.

## Columns

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `topic_id` | bigint | PK | Topic identifier |
| `topic_name` | varchar | not null | Topic name |
| `description` | text |  | Topic details |
| `class_subject_id` | bigint | FK | References `class_subjects` |
| `created_at` | timestamp |  | Creation time |
| `updated_at` | timestamp |  | Last update time |
| `deleted_at` | timestamp |  | Soft delete marker |

## Relationships

- `class_subject_id -> class_subjects.class_subject_id`
- `document_topics.topic_id -> topics.topic_id`

## Notes

- A topic may exist without a mandatory class-subject constraint in the diagram because `class_subject_id` is nullable.
- Uses soft delete via `deleted_at`.
