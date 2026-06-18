# ai_requests

## Purpose

Tracks AI generation jobs for a specific document-topic scope.

## Columns

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `request_id` | bigint | PK | AI request identifier |
| `document_topic_id` | bigint | not null, FK | Generation source scope |
| `num_questions` | int | not null | Requested question count |
| `content_scope` | text |  | Optional content subset or prompt scope |
| `status` | `ai_request_status` |  | Request lifecycle status |
| `generated_question_count` | int |  | Actual generated count |
| `retry_count` | int |  | Retry attempts |
| `error_message` | text |  | Failure details |
| `is_reviewed` | boolean | default `false` | Whether teacher reviewed output |
| `created_at` | timestamp |  | Creation time |
| `updated_at` | timestamp |  | Last update time |

## Relationships

- `document_topic_id -> document_topics.document_topic_id`
- `questions.ai_request_id -> ai_requests.request_id`
- `ai_request_difficulty_distribution.request_id -> ai_requests.request_id`

## Notes

- This table captures job orchestration metadata, not the generated questions themselves.
- One request can produce many questions.
- Difficulty targeting is stored in `ai_request_difficulty_distribution`, which may contain multiple rows per request.
