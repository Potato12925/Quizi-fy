from celery import Celery

from core.config import Config


def _build_celery_app() -> Celery:
    return Celery(
        "quizify_workers",
        broker=Config.CELERY_BROKER_URL,
        backend=Config.CELERY_RESULT_BACKEND,
    )


celery_app = _build_celery_app()
celery_app.conf.task_default_queue = "teacher_ai_generation"
