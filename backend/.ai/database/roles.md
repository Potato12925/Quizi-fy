# roles

## Purpose

Defines RBAC roles available in the system.

## Columns

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `role_id` | bigint | PK | Role identifier |
| `role_code` | varchar | not null, unique | Stable machine-readable role |
| `role_name` | varchar | not null | Human-readable name |
| `description` | text |  | Role details |
| `created_at` | timestamp |  | Creation time |

## Outgoing relationships

- `user_roles.role_id -> roles.role_id`

## Notes

- Role assignment is handled through `user_roles`.
