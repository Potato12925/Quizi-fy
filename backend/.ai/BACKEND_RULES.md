# AGENT ROUTING GUIDE

## PRIMARY GOAL

Load the minimum required context only.

DO NOT read all markdown files.

---

# ALWAYS READ

Load these files first for every task:

- .ai/project-overview.md
- .ai/coding-rules.md

ONLY load additional files if required by task type.

---

# TASK ROUTING

## 1. API / ROUTE TASK

WHEN:

- create endpoint
- modify endpoint
- validation
- pagination
- request/response

READ:

- .ai/api-rules.md

OPTIONAL:

- .ai/auth-rules.md (if protected API)

DO NOT READ:

- database-schema.md
- ai-worker-rules.md

---

## 2. DATABASE / MODEL / QUERY TASK

WHEN:

- create model
- relationships
- migrations
- repository queries
- indexes

READ:

- .ai/database-rules.md
- .ai/context/database-schema.md

OPTIONAL:

- .ai/naming-convention.md

DO NOT READ:

- api-rules.md
- ai-worker-rules.md

---

## 3. AUTH / RBAC TASK

WHEN:

- JWT
- permissions
- middleware
- role validation
- protected endpoints

READ:

- .ai/auth-rules.md
- .ai/context/roles-permissions.md

DO NOT READ:

- business-flow.md
- ai-worker-rules.md

---

## 4. AI GENERATION TASK

WHEN:

- AI question generation
- workers
- celery
- retry logic
- prompt handling

READ:

- .ai/ai-worker-rules.md
- .ai/business-rules.md

OPTIONAL:

- .ai/context/business-flow.md

DO NOT READ:

- auth-rules.md

---

## 5. PRACTICE / EXAM SYSTEM TASK

WHEN:

- practice set
- grading
- student answers
- history
- analytics

READ:

- .ai/business-rules.md
- .ai/context/business-flow.md

OPTIONAL:

- .ai/database-rules.md

DO NOT READ:

- ai-worker-rules.md

---

## 6. BACKUP / RESTORE TASK

WHEN:

- backup
- restore
- recovery
- audit history

READ:

- .ai/database-rules.md
- .ai/business-rules.md

DO NOT READ:

- api-rules.md
- ai-worker-rules.md

---

# FILE GENERATION TASKS

## CREATE REPOSITORY

READ:

- .ai/prompts/create-repository.md

OPTIONAL:

- .ai/database-rules.md

---

## CREATE SERVICE

READ:

- .ai/prompts/create-service.md

OPTIONAL:

- .ai/business-rules.md

---

## CREATE API

READ:

- .ai/prompts/create-api.md

OPTIONAL:

- .ai/api-rules.md

---

## CREATE MODEL

READ:

- .ai/prompts/create-model.md
- .ai/database-rules.md

---

## FIX BUG

READ:

- .ai/prompts/fix-bug.md

OPTIONAL:

- related feature rules only

---

# ARCHITECTURE RULES

Strictly follow architecture:

Route
→ Controller
→ Service
→ Repository
→ Database

Never skip layers.

---

# IMPORT RULES

routes
→ controllers only

controllers
→ services + schemas only

services
→ repositories + utils + models only

repositories
→ database + models only

Forbidden:

- routes → repositories
- services → controllers
- repositories → services

---

# TOKEN OPTIMIZATION RULES

- Never load unrelated files
- Never load all context files
- Never reload already loaded files
- Prefer summary files over detailed files
- Use lazy context loading
- Keep generated code concise
- Reuse existing patterns

---

# PRIORITY ORDER

1. Existing architecture
2. Existing patterns
3. Business rules
4. Clean code
5. Performance

---

# GLOBAL RULES

- Use async/await
- Keep controllers thin
- Business logic only in services
- Repositories handle database access only
- Schemas only validate format/types
- Use soft delete
- Use RBAC authorization
- Never expose internal errors
- Never hardcode AI prompts in controllers
