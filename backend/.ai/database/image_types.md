# image_types

## Purpose

Stores image categories used throughout the system to classify uploaded images and support future extensibility.

## Columns

| Column          | Type      | Constraints      | Notes                                  |
| --------------- | --------- | ---------------- | -------------------------------------- |
| `image_type_id` | bigint    | PK               | Image type identifier                  |
| `type_code`     | varchar   | not null, unique | Stable code used by application logic  |
| `type_name`     | varchar   | not null         | Human-readable image type name         |
| `description`   | text      |                  | Optional description of the image type |
| `created_at`    | timestamp |                  | Creation time                          |

## Relationships

- `images.image_type_id -> image_types.image_type_id`

## Notes

- Used to categorize uploaded images.
- Prevents hard-coded image type values in application code.
- Supports future image use cases without schema changes.
- Example values:
  - `question_image`
  - `avatar`
  - `document_thumbnail`
  - `class_cover`
  - `subject_cover`
