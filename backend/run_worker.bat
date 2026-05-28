@echo off

echo Starting Celery Worker...

call venv\Scripts\activate

celery -A workers.celery_app.celery_app worker ^
--loglevel=info ^
--pool=solo ^
-Q teacher_ai_generation

pause