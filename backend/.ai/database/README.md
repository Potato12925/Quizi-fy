# Database Schema Reference

This directory contains table-level documentation generated from `backend/dbdiagram`.

## Source of truth

- Schema source: `backend/dbdiagram`
- SQL snapshot: `backend/database-sql.sql`

## Shared conventions

- Primary keys use bigint and the `<entity>_id` pattern.
- Foreign keys use the `<related_entity>_id` pattern.
- Soft delete is used on core business tables through `deleted_at`.
- Common audit fields:
  - `created_at`
  - `updated_at`
- Status fields are backed by enums in `dbdiagram`.

## Enums used in schema

- `active_status`: `active`, `inactive`
- `ai_request_status`: `pending`, `processing`, `completed`, `failed`, `cancelled`
- `difficulty_level`: `recognition`, `comprehension`, `application`, `advanced`
- `practice_attempt_status`: `in_progress`, `submitted`, `timeout`
- `question_source`: `ai`, `manual`
- `question_status`: `draft`, `approved`, `inactive`, `rejected`

## Table documents

- [users](./users.md)
- [roles](./roles.md)
- [user_roles](./user_roles.md)
- [classes](./classes.md)
- [subjects](./subjects.md)
- [class_teachers](./class_teachers.md)
- [class_students](./class_students.md)
- [class_subjects](./class_subjects.md)
- [topics](./topics.md)
- [documents](./documents.md)
- [document_topics](./document_topics.md)
- [document_chunks](./document_chunks.md)
- [ai_requests](./ai_requests.md)
- [questions](./questions.md)
- [question_options](./question_options.md)
- [question_sources](./question_sources.md)
- [question_history](./question_history.md)
- [practice_sets](./practice_sets.md)
- [practice_set_questions](./practice_set_questions.md)
- [practice_attempts](./practice_attempts.md)
- [student_answers](./student_answers.md)
- [notifications](./notifications.md)

## High-level relationship flow

1. `users` own roles through `user_roles`.
2. Teachers manage `classes`, `subjects`, and assignments through `class_subjects`.
3. `topics` belong to `class_subjects`.
4. `documents` uploaded by teachers are linked to topics through `document_topics`.
5. `documents` are chunked into `document_chunks` for RAG retrieval.
6. `ai_requests` generate `questions` from a specific `document_topic`.
7. `question_sources` links generated questions back to the chunks used as provenance.
8. Students receive `practice_sets`, answer them through `practice_attempts` and `student_answers`.
