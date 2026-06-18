# images

## Purpose

Stores uploaded image metadata and file information for use across the system.

## Columns

| Column          | Type      | Constraints  | Notes                                     |
| --------------- | --------- | ------------ | ----------------------------------------- |
| `image_id`      | bigint    | PK           | Image identifier                          |
| `image_type_id` | bigint    | not null, FK | Image category reference                  |
| `uploaded_by`   | bigint    | FK           | User who uploaded the image               |
| `file_name`     | varchar   |              | Original file name                        |
| `file_url`      | text      | not null     | Storage URL of the image                  |
| `file_hash`     | varchar   |              | File content hash for duplicate detection |
| `file_size`     | bigint    |              | File size in bytes                        |
| `mime_type`     | varchar   |              | MIME type such as image/png or image/jpeg |
| `created_at`    | timestamp |              | Upload time                               |
| `deleted_at`    | timestamp |              | Soft delete marker                        |

## Relationships

- `image_type_id -> image_types.image_type_id`
- `uploaded_by -> users.user_id`
- `questions.image_id -> images.image_id`

## Notes

- This is a soft-delete table.
- Stores only image metadata; binary files are stored in external storage (Supabase Storage, S3, etc.).
- Images may be reused by multiple features in the future.
- Currently intended for question images.
- Future use cases may include avatars, class covers, subject covers, document thumbnails, and notification images.
