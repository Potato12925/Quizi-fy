@echo off

echo Starting FastAPI Backend...

call venv\Scripts\activate

uvicorn main:app --reload

pause