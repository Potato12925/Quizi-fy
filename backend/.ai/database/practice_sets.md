# practice_sets

## Purpose

Stores generated practice sessions assigned to a student.

## Columns

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `practice_set_id` | bigint | PK | Practice set identifier |
| `student_id` | bigint | not null, FK | Target student |
| `subject_id` | bigint | not null, FK | Practice subject |
| `document_topic_id` | bigint | FK | Optional scope filter |
| `difficulty` | `difficulty_level` |  | Requested difficulty |
| `num_questions_requested` | int | not null | Requested question count |
| `num_questions_actual` | int |  | Actual selected count |
| `time_limit_minutes` | int |  | Timer limit |
| `prioritize_unanswered` | boolean |  | Adaptive selection hint |
| `created_at` | timestamp |  | Creation time |

## Relationships

- `student_id -> users.user_id`
- `subject_id -> subjects.subject_id`
- `document_topic_id -> document_topics.document_topic_id`
- `practice_set_questions.practice_set_id -> practice_sets.practice_set_id`
- `practice_attempts.practice_set_id -> practice_sets.practice_set_id`

## Notes

- A practice set can be generic by subject or narrowed to one `document_topic`.
