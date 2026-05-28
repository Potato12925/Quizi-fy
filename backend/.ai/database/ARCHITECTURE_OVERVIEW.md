# Architecture Overview

## Main Modules
- Authentication & RBAC
- Classroom Management
- Subject & Topic Management
- AI Question Generation
- Question Bank
- Practice & Assessment
- Notifications

## Core Relationships
- users <-> roles through user_roles
- classes <-> subjects through class_subjects
- subjects -> topics -> document_topics -> documents -> ai_requests -> questions
- practice_sets contain many questions
- practice_attempts store exam results

## Soft Delete Strategy
Most business tables use:
- deleted_at
- status enum

## Supabase Notes
- Recommended to use Row Level Security (RLS)
- Use UUID only if future scaling requires distributed systems
- Current bigint PK design is acceptable
