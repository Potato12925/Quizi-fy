# practice_set_questions

## Purpose

Join table defining which questions belong to a practice set and in what order.

## Columns

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `practice_set_question_id` | bigint | PK | Join row identifier |
| `practice_set_id` | bigint | not null, FK | References `practice_sets` |
| `question_id` | bigint | not null, FK | References `questions` |
| `order_num` | int | not null | Question order inside the set |

## Relationships

- `practice_set_id -> practice_sets.practice_set_id`
- `question_id -> questions.question_id`

## Notes

- Represents a many-to-many relation between `practice_sets` and `questions`.
