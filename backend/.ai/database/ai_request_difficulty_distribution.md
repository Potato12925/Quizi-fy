# ai_request_difficulty_distribution

## Purpose

Stores the difficulty distribution configuration for an AI question generation request.

Each record defines how many questions should be generated for a specific difficulty level within a request. This allows a teacher to create a mixed question set (for example: 40% Recognition, 30% Comprehension, 20% Application, 10% Advanced).

## Columns

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `distribution_id` | bigint | PK | Distribution identifier |
| `request_id` | bigint | not null, FK | AI request identifier |
| `difficulty` | `difficulty_level` | not null | Difficulty category |
| `percentage` | int | nullable, 0-100 | Percentage of total questions assigned to this difficulty |
| `question_count` | int | not null, > 0 | Number of questions assigned to this difficulty |
| `created_at` | timestamp | default current_timestamp | Creation time |

## Relationships

- `request_id -> ai_requests.request_id`

## Constraints

### Unique Constraints

- `uq_ai_request_distribution`
  - Ensures a request cannot contain duplicate difficulty levels.
  - Combination:
    - `request_id`
    - `difficulty`

### Check Constraints

- `chk_ai_request_distribution_question_count`
  - `question_count > 0`

- `chk_ai_request_distribution_percentage`
  - `percentage IS NULL`
  - or `percentage BETWEEN 0 AND 100`

## Indexes

### idx_ai_request_distribution_request_id

Used to quickly retrieve all difficulty distribution records belonging to a specific AI request.

## Difficulty Levels

| Value | Description |
|---------|-------------|
| `recognition` | Nhận biết |
| `comprehension` | Thông hiểu |
| `application` | Vận dụng |
| `advanced` | Vận dụng cao |

## Notes

- A single AI request can contain multiple difficulty distributions.
- The sum of all `question_count` values for a request should equal `ai_requests.num_questions`.
- The sum of all `percentage` values for a request should normally equal 100 when percentages are provided.
- Records are automatically deleted when the parent AI request is deleted through `ON DELETE CASCADE`.
- This table replaces the limitation of having only one difficulty level per AI request and supports the Vietnamese high-school assessment model:
  - Nhận biết
  - Thông hiểu
  - Vận dụng
  - Vận dụng cao