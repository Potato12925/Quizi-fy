import asyncio

from workers.celery_app import celery_app


@celery_app.task(name="workers.ai_generation_worker.process_ai_request_task")
def process_ai_request_task(request_id: int, teacher_id: int) -> None:
    from services.teacher_ai_generator_service import process_ai_request_job

    asyncio.run(process_ai_request_job(request_id=request_id, teacher_id=teacher_id))
