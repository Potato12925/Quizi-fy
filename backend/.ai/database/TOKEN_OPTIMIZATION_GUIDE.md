
# Token Optimization Guide For AI Coding Agents

## Goal
Reduce token usage and avoid reading the entire database schema repeatedly.

---

# High-Level Strategy

DO NOT load every table for every feature.

Instead:
1. Identify the feature domain
2. Read only related tables
3. Query only required columns
4. Avoid nested joins unless necessary

---

# Authentication & Authorization

Read these tables ONLY:
- users
- roles
- user_roles

Use when:
- Login
- Permission checks
- Middleware
- RBAC authorization

Avoid reading:
- practice tables
- question tables

---

# Classroom Management

Read:
- classes
- class_students
- class_teachers
- class_subjects
- subjects

Use when:
- Create class
- Assign student
- Assign teacher
- Load dashboard

Avoid:
- questions
- practice_attempts

---

# AI Question Generation

Read:
- documents
- ai_requests
- questions
- question_options
- topics
- subjects

Use when:
- Upload documents
- Generate AI questions
- Approve questions

Avoid:
- practice tables

---

# Practice & Exam Flow

Read:
- practice_sets
- practice_set_questions
- practice_attempts
- student_answers
- questions
- question_options

Use when:
- Generate practice set
- Submit answers
- Calculate score

Avoid:
- documents
- ai_requests

---

# Reporting & Analytics

Read:
- practice_attempts
- student_answers
- practice_sets
- class_students

Use aggregates:
- COUNT()
- AVG()
- GROUP BY

Never load full question content for analytics unless required.

---

# Query Optimization Rules

## GOOD
```sql
select question_id, difficulty
from questions
where subject_id = 1
limit 20;
```

## BAD
```sql
select *
from questions;
```

---

# Supabase Best Practices

## Always paginate
```ts
.range(0, 19)
```

## Select explicit columns
```ts
.select("question_id, content")
```

## Avoid deep nested joins
Use multiple lightweight queries instead.

---

# Suggested Feature → Table Mapping

| Feature | Tables |
|---|---|
| Google Login | users, roles, user_roles |
| Upload Document | documents, subjects, topics |
| AI Generation | ai_requests, questions |
| Question Approval | questions, question_history |
| Student Practice | practice_sets, practice_attempts |
| Result Review | student_answers, question_options |
| Notifications | notifications |

---

# Recommended Documentation Reading Order

1. README.md
2. users.md
3. roles.md
4. user_roles.md
5. Feature-specific tables only

Do NOT preload all markdown files into AI context.

---

# Recommended AI Agent Workflow

1. Read feature requirement
2. Load minimal related table docs
3. Generate SQL
4. Validate FK relations
5. Implement API/service
6. Stop reading unrelated tables

This minimizes token usage and avoids context overflow.
