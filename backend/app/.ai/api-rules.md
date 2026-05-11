# API RULES

## API VERSION

Use:

- /api/v1/

## ENDPOINT RULES

- RESTful naming
- plural resource names

GOOD:

- /documents
- /questions

BAD:

- /getDocuments

## RESPONSE CODES

- 200 success
- 201 created
- 400 validation error
- 401 unauthorized
- 403 forbidden
- 404 not found
- 500 internal error

## PAGINATION

Use:

- page
- limit

## FILTERS

Use query params.

## VALIDATION

Use Pydantic schemas only.

## AUTH

Protected APIs must:

- validate JWT
- load current user
- check roles

## FILE UPLOAD

Allowed:

- pdf
- docx
- txt

Max size:

- 20MB
