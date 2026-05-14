@echo off

echo Starting Backend...
start cmd /k "cd backend && call venv\Scripts\activate && uvicorn main:app --reload"

echo Starting Frontend...
start cmd /k "cd frontend && npm run dev"

exit