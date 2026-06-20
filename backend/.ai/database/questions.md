# questions

## Purpose

Stores the question bank, including AI-generated and manually created questions.

## Columns

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `question_id` | bigint | PK | Question identifier |
| `teacher_id` | bigint | not null, FK | Question owner |
| `topic_id` | bigint | not null, FK | Topic used to classify the question |
| `ai_request_id` | bigint | FK | AI job that generated the question, null for manual questions |
| `content` | text | not null | Question body |
| `difficulty` | `difficulty_level` | not null | Difficulty level |
| `source` | `question_source` | not null | `ai` or `manual` |
| `status` | `question_status` |  | Workflow status |
| `explanation` | text |  | Answer explanation |
| `image_id` | bigint | FK | Optional image attached to the question |
| `created_at` | timestamp |  | Creation time |
| `updated_at` | timestamp |  | Last update time |
| `deleted_at` | timestamp |  | Soft delete marker |

## Relationships

- `teacher_id -> users.user_id`
- `topic_id -> topics.topic_id`
- `ai_request_id -> ai_requests.request_id`
- `question_options.question_id -> questions.question_id`
- `question_history.question_id -> questions.question_id`
- `practice_set_questions.question_id -> questions.question_id`
- `student_answers.question_id -> questions.question_id`
- `image_id -> images.image_id`

## Notes

- This is a soft-delete table.
- Supports both AI-generated and manually created questions.
- Manual questions are classified directly by `topic_id`.
- AI-generated questions keep their generation source through `ai_request_id`.
- The original AI document source can be traced through `ai_request_id -> ai_requests.document_topic_id -> document_topics.document_id`.
