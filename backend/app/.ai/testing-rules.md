# TESTING RULES

## TEST FRAMEWORK

- pytest

## API TEST

Use:

- httpx AsyncClient

## DATABASE

Use test database only.

## COVERAGE

Test:

- services
- repositories
- APIs
- auth

## MOCKING

Mock:

- AI providers
- external APIs
- Supabase auth

## REQUIRED TESTS

- success case
- validation error
- permission denied
- not found

## NAMING

test\_<feature>.py
