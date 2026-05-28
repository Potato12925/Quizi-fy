from celery import Celery

from core.config import Config


def _build_celery_app() -> Celery:
    return Celery(
        "quizify_workers",
        broker=Config.CELERY_BROKER_URL,
        backend=Config.CELERY_RESULT_BACKEND,
        include=["workers.ai_generation_worker"],
    )


celery_app = _build_celery_app()
celery_app.conf.update(
    task_default_queue="teacher_ai_generation",
    task_routes={
        "workers.ai_generation_worker.process_ai_request_task": {
            "queue": "teacher_ai_generation",
        }
    },
)

# Ensure worker task modules are imported so Celery can register tasks at startup.
from workers import ai_generation_worker  # noqa: E402,F401
