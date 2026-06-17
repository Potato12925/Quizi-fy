# student_answers

## Purpose

Stores a student's submitted answer for a question in an attempt.

## Columns

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `answer_id` | bigint | PK | Answer identifier |
| `attempt_id` | bigint | not null, FK | Parent attempt |
| `question_id` | bigint | not null, FK | Answered question |
| `selected_option_id` | bigint | FK | Chosen option |
| `is_correct` | boolean |  | Result of evaluation |
| `answered_at` | timestamp |  | Submission time |

## Relationships

- `attempt_id -> practice_attempts.attempt_id`
- `question_id -> questions.question_id`
- `selected_option_id -> question_options.option_id`

## Notes

- `selected_option_id` is nullable, which allows skipped or unanswered states if application logic supports them.
