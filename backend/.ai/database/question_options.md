# question_options

## Purpose

Stores answer options for multiple-choice questions.

## Columns

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `option_id` | bigint | PK | Option identifier |
| `question_id` | bigint | not null, FK | Parent question |
| `option_label` | varchar | not null | Label such as A, B, C, D |
| `option_text` | text | not null | Option content |
| `is_correct` | boolean |  | Correctness flag |
| `order_num` | int | not null | Display order |

## Relationships

- `question_id -> questions.question_id`
- `student_answers.selected_option_id -> question_options.option_id`

## Notes

- One question has many options.
- A selected student answer points to one option row.
