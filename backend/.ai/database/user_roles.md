# user_roles

## Purpose

Join table mapping users to roles.

## Columns

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `user_role_id` | bigint | PK | Join row identifier |
| `user_id` | bigint | not null, FK | References `users` |
| `role_id` | bigint | not null, FK | References `roles` |
| `assigned_at` | timestamp |  | Assignment time |

## Relationships

- `user_id -> users.user_id`
- `role_id -> roles.role_id`

## Notes

- Represents a many-to-many relation between `users` and `roles`.
