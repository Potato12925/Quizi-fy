
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
- users ↔ roles through user_roles
- classes ↔ subjects through class_subjects
- questions belong to subjects/topics
- practice_sets contain many questions
- practice_attempts store exam results

## Soft Delete Strategy
Most business tables use:
- deleted_at
- status enum

This prevents hard deletion and preserves history.

## Supabase Notes
- Recommended to use Row Level Security (RLS)
- Use UUID only if future scaling requires distributed systems
- Current bigint PK design is acceptable
