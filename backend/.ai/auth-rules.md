# AUTH RULES

## AUTHENTICATION

- Google OAuth only
- Use Supabase Auth

## AUTHORIZATION

RBAC system:
users -> user_roles -> roles

## ROLES

- admin
- teacher
- student

## JWT

- Validate token
- Reject expired token

## MIDDLEWARE

Must:

- load current user
- load roles
- attach to request.state

## PERMISSION RULES

### Admin

- manage classes
- assign teachers
- backup/restore

### Teacher

- upload documents
- generate questions
- approve questions

### Student

- practice questions
- submit answers
- view history

## SECURITY

- Never trust frontend role
- Validate permissions in backend
