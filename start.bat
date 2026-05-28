@echo off

echo Starting Backend...
start cmd /k "cd backend && call venv\Scripts\activate && uvicorn main:app --reload"

echo Starting Celery Worker...
start cmd /k "cd backend && call venv\Scripts\activate && celery -A workers.celery_app.celery_app worker --pool=solo --loglevel=info -Q teacher_ai_generation"

echo Starting Frontend...
start cmd /k "cd frontend && npm run dev"

exit