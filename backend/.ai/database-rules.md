# DATABASE RULES

## DATABASE

- Supabase PostgreSQL
- snake_case naming

## TABLE RULES

All major tables must have:

- created_at
- updated_at

Soft delete tables:

- deleted_at

## AUTHORIZATION

Use:
users
user_roles
roles

Never store role in users table.

## RELATIONSHIPS

- Use foreign keys
- Avoid cascade delete
- Preserve history

## QUESTION FLOW

draft
approved
inactive
rejected

## AI REQUEST FLOW

pending
processing
completed
failed

## INDEXING

Add indexes for:

- foreign keys
- status
- created_at
- search fields

## AUDIT

Track:

- changed_by
- changed_at

## QUERY RULES

- avoid select \*
- use joins carefully
- paginate large datasets
