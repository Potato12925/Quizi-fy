# DATABASE SUMMARY

## MAIN TABLES

### users

System users.

### roles

Role definitions.

### user_roles

RBAC mapping.

### classes

Class management.

### subjects

Subject catalog.

### topics

Subject topics.

### documents

Uploaded learning materials.

### ai_requests

AI generation requests.

### questions

Question bank.

### question_options

MCQ answers.

### question_history

Audit history.

### practice_sets

Generated practice sessions.

### practice_attempts

Student submissions.

### student_answers

Selected answers.

## IMPORTANT RELATIONSHIPS

users
-> user_roles
-> roles

documents
-> ai_requests
-> questions

questions
-> question_options

practice_sets
-> practice_attempts
-> student_answers

## IMPORTANT STATUSES

Question:

- draft
- approved
- inactive
- rejected

AI Request:

- pending
- processing
- completed
- failed
