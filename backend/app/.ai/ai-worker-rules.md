# AI WORKER RULES

## Queue

Use Celery workers.

## AI Flow

1. Upload document
2. Create ai_request
3. Push worker job
4. Extract content
5. Generate questions
6. Save draft questions
7. Update status

## Error Handling

- Retry max 3 times
- Save error_message
- Update failed status

## Validation

Generated questions must:

- Have 4 options
- Have exactly 1 correct answer
- Include explanation
- Include difficulty

## Logging

Log:

- token usage
- processing time
- failures
