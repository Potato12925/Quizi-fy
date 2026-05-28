from fastapi import FastAPI

from controllers.ai_request_controller import router as ai_request_router
from controllers.auth_controller import router as auth_router
from controllers.class_controller import router as class_router
from controllers.class_student_controller import router as class_student_router
from controllers.class_subject_controller import router as class_subject_router
from controllers.class_teacher_controller import router as class_teacher_router
from controllers.database_controller import router as database_router
from controllers.document_controller import router as document_router
from controllers.document_topic_controller import router as document_topic_router
from controllers.health_controller import router as health_router
from controllers.notification_controller import router as notification_router
from controllers.practice_attempt_controller import router as practice_attempt_router
from controllers.practice_set_controller import router as practice_set_router
from controllers.practice_set_question_controller import (
    router as practice_set_question_router,
)
from controllers.question_controller import router as question_router
from controllers.question_history_controller import router as question_history_router
from controllers.question_option_controller import router as question_option_router
from controllers.role_controller import router as role_router
from controllers.student_answer_controller import router as student_answer_router
from controllers.subject_controller import router as subject_router
from controllers.teacher_topic_management_controller import (
    router as teacher_topic_management_router,
)
from controllers.teacher_question_bank_controller import (
    router as teacher_question_bank_router,
)
from controllers.teacher_ai_generator_controller import (
    router as teacher_ai_generator_router,
)
from controllers.topic_controller import router as topic_router
from controllers.user_role_controller import router as user_role_router
from controllers.user_controller import router as user_router


def register_routes(app: FastAPI) -> None:
    app.include_router(
        health_router,
        prefix="/api/v1",
    )

    app.include_router(
        database_router,
        prefix="/api/v1",
    )

    app.include_router(
        auth_router,
        prefix="/api/v1",
    )

    app.include_router(
        user_router,
        prefix="/api/v1",
    )

    app.include_router(
        class_router,
        prefix="/api/v1",
    )

    app.include_router(
        subject_router,
        prefix="/api/v1",
    )

    app.include_router(
        role_router,
        prefix="/api/v1",
    )

    app.include_router(
        user_role_router,
        prefix="/api/v1",
    )

    app.include_router(
        topic_router,
        prefix="/api/v1",
    )

    app.include_router(
        document_router,
        prefix="/api/v1",
    )

    app.include_router(
        document_topic_router,
        prefix="/api/v1",
    )

    app.include_router(
        ai_request_router,
        prefix="/api/v1",
    )

    app.include_router(
        question_router,
        prefix="/api/v1",
    )

    app.include_router(
        question_option_router,
        prefix="/api/v1",
    )

    app.include_router(
        question_history_router,
        prefix="/api/v1",
    )

    app.include_router(
        practice_set_router,
        prefix="/api/v1",
    )

    app.include_router(
        practice_attempt_router,
        prefix="/api/v1",
    )

    app.include_router(
        student_answer_router,
        prefix="/api/v1",
    )

    app.include_router(
        practice_set_question_router,
        prefix="/api/v1",
    )

    app.include_router(
        class_student_router,
        prefix="/api/v1",
    )

    app.include_router(
        class_subject_router,
        prefix="/api/v1",
    )

    app.include_router(
        class_teacher_router,
        prefix="/api/v1",
    )

    app.include_router(
        notification_router,
        prefix="/api/v1",
    )

    app.include_router(
        teacher_topic_management_router,
        prefix="/api/v1",
    )

    app.include_router(
        teacher_question_bank_router,
        prefix="/api/v1",
    )

    app.include_router(
        teacher_ai_generator_router,
        prefix="/api/v1",
    )
