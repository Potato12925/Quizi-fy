# BKP System Database Documentation

## Database Stack

- Database: Supabase PostgreSQL
- Backend: Python (FastAPI)
- ORM: None
- Database Access: Supabase Python Client
- Query Strategy: Supabase Query Builder
- Schema Management: Supabase CLI migrations
- Architecture Target: Production-ready multi-role learning platform

## Architecture Principles

- Avoid ORM abstraction
- Prefer Supabase query builder
- Use lightweight service layers
- Optimize queries for low token usage
- Use pagination for large datasets

## Naming Convention

- PK: `<table>_id`
- FK naming: `<entity>_id`
- Soft delete: `deleted_at`
- Audit timestamps:
  - `created_at`
  - `updated_at`
- Status fields use PostgreSQL ENUMs

## Token optimization

- .ai/database/TOKEN_OPTIMIZATION_GUIDE.md
