# CODING RULES

## GENERAL
- Use async/await
- Use type hints
- Use dependency injection
- Use Pydantic v2
## CONTROLLERS
- Thin controllers only
- No business logic
- Validate request
- Return response only

## SERVICES
- Business logic only
- No HTTP logic
- No direct DB session creation

## REPOSITORIES
- Database access only
- No business logic
- Reusable queries

## ERRORS
- Use custom exceptions
- Never expose internal errors

## LOGGING
- Log failures
- Log worker errors
- Log auth failures

## DELETE STRATEGY
- Use soft delete
- Never hard delete production data

## RESPONSE
use helper functions to create response

## PERFORMANCE
- Use pagination
- Avoid N+1 queries
- Select only required fields