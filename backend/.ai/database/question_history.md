# question_history

## Purpose

Stores audit history for question changes.

## Columns

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `history_id` | bigint | PK | History record identifier |
| `question_id` | bigint | not null, FK | Changed question |
| `changed_by` | bigint | not null, FK | User who made the change |
| `old_data` | jsonb |  | Snapshot before change |
| `new_data` | jsonb |  | Snapshot after change |
| `change_type` | varchar |  | Change category |
| `changed_at` | timestamp |  | Change time |

## Relationships

- `question_id -> questions.question_id`
- `changed_by -> users.user_id`

## Notes

- This table provides question-level auditability.
