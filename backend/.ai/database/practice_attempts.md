# practice_attempts

## Purpose

Stores an execution attempt for a practice set.

## Columns

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `attempt_id` | bigint | PK | Attempt identifier |
| `practice_set_id` | bigint | not null, FK | Parent practice set |
| `started_at` | timestamp |  | Start time |
| `submitted_at` | timestamp |  | Submit time |
| `score` | numeric |  | Final score |
| `total_correct` | int |  | Number of correct answers |
| `total_wrong` | int |  | Number of wrong answers |
| `status` | `practice_attempt_status` |  | Attempt lifecycle status |

## Relationships

- `practice_set_id -> practice_sets.practice_set_id`
- `student_answers.attempt_id -> practice_attempts.attempt_id`

## Notes

- One practice set can have multiple attempts unless restricted in application logic.
