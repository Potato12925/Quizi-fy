# notifications

## Purpose

Stores in-app notifications sent to users.

## Columns

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `notification_id` | bigint | PK | Notification identifier |
| `user_id` | bigint | not null, FK | Target user |
| `title` | varchar |  | Notification title |
| `content` | text |  | Notification body |
| `is_read` | boolean |  | Read/unread flag |
| `created_at` | timestamp |  | Creation time |

## Relationships

- `user_id -> users.user_id`

## Notes

- Simple one-to-many relation from `users` to `notifications`.
