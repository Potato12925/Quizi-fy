# Backend Architecture Rules

This document defines mandatory backend architecture rules.  
All generated code must strictly follow this structure.

Violating these rules is considered an architecture error.

---

# controllers/

## Purpose

Controllers handle request and response processing.

## Responsibilities

- Receive data from routes
- Call services
- Return responses to clients
- Handle HTTP-related logic only

## Rules

- Controllers must not contain complex business logic
- Controllers must not access the database directly
- Controllers must not call Supabase directly
- Controllers must remain thin and lightweight

## Example Modules

- auth
- questions
- exams
- documents
- classes

---

# core/

## Purpose

Contains shared core system configurations and global components.

## Responsibilities

- Application configuration
- Security utilities
- Logging
- Constants
- Global exception handlers
- Environment variable loading

## Includes

- JWT handling
- Password hashing
- Logger configuration
- Global settings

---

# database/

## Purpose

Contains database initialization and connection logic.

## Responsibilities

- Initialize Supabase client
- Configure database connections
- Provide database utilities
- Provide transaction helpers

## Rules

- Database layer must not contain business logic

---

# middlewares/

## Purpose

Contains middleware executed before or after requests.

## Responsibilities

- Authentication
- Authorization
- Request logging
- Rate limiting
- Request tracking
- CORS handling

## Rules

- Middleware may validate JWT tokens
- Middleware may attach user information to request context

---

# models/

## Purpose

Contains domain models and shared data structures.

## Responsibilities

- Define database models
- Define enums
- Define constants
- Define domain objects

## Examples

- User
- Question
- Exam
- Class
- Document

---

# repositories/

## Purpose

Repositories handle direct database interaction using Supabase.

## Responsibilities

- Insert data
- Select data
- Update data
- Delete data

## Rules

- Repositories must not contain business logic
- Repositories must not contain AI processing
- Repositories must not perform grading logic
- Repositories must not perform complex business validation
- Repositories must only handle data access

## Repository Access

Repositories may use:

- supabase.table("table_name")
- supabase.storage
- supabase.auth

## Examples

### question_repository

- Handles questions table

### exam_repository

- Handles exams table

### document_repository

- Handles documents table and storage

### user_repository

- Handles users table

---

# routes/

## Purpose

Defines API endpoints and route mappings.

## Responsibilities

- Define API routes
- Map routes to controllers
- Handle dependency injection

## Rules

- Routes must not contain business logic
- Routes must not access repositories directly

## Examples

- /auth/login
- /questions/generate
- /exams/create

---

# schemas/

## Purpose

Contains Pydantic schemas for request and response validation.

## Responsibilities

- Validate request data
- Standardize API responses
- Generate Swagger/OpenAPI documentation

## Rules

- Schemas only validate data format and types
- Schemas must not contain business validation

## Examples

- QuestionCreateSchema
- ExamResponseSchema
- LoginRequestSchema

---

# services/

## Purpose

Services contain the main business logic of the system.

## Responsibilities

- AI processing
- Question generation
- Exam creation
- Grading
- Document processing
- Statistics and analytics

## Rules

- Services are the primary business layer
- Services must use repositories for database access
- Services must not access Supabase directly if a repository exists

## Examples

- ai_service
- exam_service
- grading_service
- document_service

---

# utils/

## Purpose

Contains shared helper and utility functions.

## Responsibilities

- PDF processing
- Date formatting
- Text cleaning
- AI prompt building
- Random code generation
- File upload helpers

## Rules

- Utils must not contain core business logic

---

# workers/

## Purpose

Contains background jobs and asynchronous processing.

## Responsibilities

- AI generation
- PDF extraction
- Document processing
- Email sending
- Queue processing

## Rules

- Workers handle long-running tasks
- Workers help avoid blocking API requests

## Technologies

- Celery
- Redis Queue
- FastAPI BackgroundTasks

## Examples

- generate_question_task
- extract_pdf_task
- send_email_task
- ai_processing_queue

---

# Request Flow

```text
Route
→ Controller
→ Service
→ Repository
→ Database
```

---

# Response Flow

```text
Database
→ Repository
→ Service
→ Controller
→ Client
```

---

# Dependency Rules

- routes may only import controllers
- controllers may only import services and schemas
- services may only import repositories, models, and utils
- repositories may only import database and models

## Forbidden Imports

- repositories must not import services
- services must not import controllers
- routes must not import repositories
- controllers must not import repositories directly

---

# Error Handling Rules

- Repositories only raise database-related errors
- Services handle business errors
- Controllers convert exceptions into HTTP responses
- Repositories must not return HTTPException

---

# Naming Convention

## File Naming

```text
question_service.py
question_repository.py
question_controller.py
question_schema.py
```

## Class Naming

```text
QuestionService
QuestionRepository
QuestionController
```

---

# Async Rules

- All I/O operations must use async/await
- Repository methods must be async
- Service methods must be async if they call:
  - repositories
  - external APIs
  - AI services
  - file systems

---

# Validation Rules

- Schemas only validate:
  - data format
  - data types
  - required fields

- Business validation must be handled in services

## Examples

### Schema Validation

- email format
- password length
- required fields

### Service Validation

- permission checking
- exam ownership validation
- grading rules
- AI quota validation

---

# Transaction Rules

- Transactions must be managed at the service layer
- Repositories must not manage complex business transactions

---

# Logging Rules

- Do not log sensitive information
- Services log business events
- Middleware logs request lifecycle
- Repositories should not log business flow events

---

# AI Rules

- Prompt templates should be stored in:
  - utils/prompts
  - services/prompts

## Rules

- Do not hardcode prompts in controllers
- AI providers must be abstracted through ai_service
- Controllers must not call AI providers directly
- Repositories must not call AI providers directly

---

# Forbidden Practices

- Do not write SQL inside controllers
- Do not place business logic inside routes
- Do not access databases directly inside controllers
- Do not call Supabase directly inside services if a repository exists
- Do not perform business validation inside schemas
- Do not call AI providers directly from controllers
- Do not import repositories inside routes
- Do not import controllers inside services
- Do not place database access logic inside controllers

---

# Example Project Structure

```text
app/
├── controllers/
├── core/
├── database/
├── middlewares/
├── models/
├── repositories/
├── routes/
├── schemas/
├── services/
├── utils/
├── workers/
```
