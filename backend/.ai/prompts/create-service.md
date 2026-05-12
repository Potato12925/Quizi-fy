# CREATE SERVICE

## SERVICE RESPONSIBILITY

- business logic
- validation
- workflow

## NEVER

- HTTP handling
- direct response return

## MUST

- call repositories
- raise custom exceptions
- validate permissions
