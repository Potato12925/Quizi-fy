from fastapi import APIRouter, Depends, Query

from core.responses import error_response, success_response
from middlewares.auth_middleware import CurrentUser, require_roles
from schemas.teacher_question_bank_schema import ManualQuestionPayload, QuestionStatusUpdatePayload
from services.teacher_question_bank_service import (
    TeacherQuestionBankAuthorizationError,
    create_teacher_manual_question,
    delete_teacher_question,
    get_teacher_document_topic_options,
    get_teacher_question_bank,
    update_teacher_question,
    update_teacher_question_status,
)
from utils.question_image_util import QuestionImageValidationError

router = APIRouter(prefix="/teacher/question-bank", tags=["Teacher Question Bank"])


@router.get("", summary="Get teacher question bank")
async def get_teacher_question_bank_route(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    class_subject_id: int | None = Query(default=None, ge=1),
    subject_id: int | None = Query(default=None, ge=1),
    topic_id: int | None = Query(default=None, ge=1),
    difficulty: str | None = Query(default=None),
    status: str | None = Query(default=None),
    source: str | None = Query(default=None),
    keyword: str | None = Query(default=None),
    current_user: CurrentUser = Depends(require_roles("teacher", "admin")),
):
    try:
        result = await get_teacher_question_bank(
            current_user=current_user,
            page=page,
            limit=limit,
            class_subject_id=class_subject_id,
            subject_id=subject_id,
            topic_id=topic_id,
            difficulty=difficulty,
            status=status,
            source=source,
            keyword=keyword,
        )
        return success_response(data=result["items"], meta=result["pagination"], message="Teacher question bank loaded successfully", status_code=200)
    except Exception:
        return error_response(message="Unable to load teacher question bank", status_code=500, error_code="TEACHER_QUESTION_BANK_LIST_FAILED")


@router.get("/document-topic-options", summary="Get teacher document-topic options")
async def get_teacher_document_topic_options_route(
    class_subject_id: int | None = Query(default=None, ge=1),
    subject_id: int | None = Query(default=None, ge=1),
    topic_id: int | None = Query(default=None, ge=1),
    current_user: CurrentUser = Depends(require_roles("teacher", "admin")),
):
    try:
        result = await get_teacher_document_topic_options(
            current_user=current_user,
            class_subject_id=class_subject_id,
            subject_id=subject_id,
            topic_id=topic_id,
        )
        return success_response(data=result, message="Document topic options loaded successfully", status_code=200)
    except Exception:
        return error_response(message="Unable to load document topic options", status_code=500, error_code="TEACHER_QUESTION_BANK_DOC_TOPIC_OPTIONS_FAILED")


@router.post("/manual", summary="Create manual question")
async def create_manual_question_route(
    payload: ManualQuestionPayload,
    current_user: CurrentUser = Depends(require_roles("teacher", "admin")),
):
    try:
        result = await create_teacher_manual_question(current_user=current_user, payload=payload)
        return success_response(data=result, message="Question created successfully", status_code=201)
    except TeacherQuestionBankAuthorizationError as exc:
        return error_response(message=str(exc), status_code=403, error_code="TEACHER_QUESTION_BANK_CREATE_FORBIDDEN")
    except QuestionImageValidationError as exc:
        return error_response(message=str(exc), status_code=exc.status_code, error_code=exc.error_code)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=400, error_code="TEACHER_QUESTION_BANK_CREATE_INVALID")
    except Exception:
        return error_response(message="Unable to create question", status_code=500, error_code="TEACHER_QUESTION_BANK_CREATE_FAILED")


@router.put("/{question_id}", summary="Update teacher question")
async def update_teacher_question_route(
    question_id: int,
    payload: ManualQuestionPayload,
    current_user: CurrentUser = Depends(require_roles("teacher", "admin")),
):
    try:
        result = await update_teacher_question(current_user=current_user, question_id=question_id, payload=payload)
        return success_response(data=result, message="Question updated successfully", status_code=200)
    except TeacherQuestionBankAuthorizationError as exc:
        return error_response(message=str(exc), status_code=403, error_code="TEACHER_QUESTION_BANK_UPDATE_FORBIDDEN")
    except QuestionImageValidationError as exc:
        return error_response(message=str(exc), status_code=exc.status_code, error_code=exc.error_code)
    except ValueError as exc:
        status_code = 404 if str(exc) == "Question not found" else 400
        return error_response(message=str(exc), status_code=status_code, error_code="TEACHER_QUESTION_BANK_UPDATE_INVALID")
    except Exception:
        return error_response(message="Unable to update question", status_code=500, error_code="TEACHER_QUESTION_BANK_UPDATE_FAILED")


@router.patch("/{question_id}/status", summary="Update teacher question status")
async def update_teacher_question_status_route(
    question_id: int,
    payload: QuestionStatusUpdatePayload,
    current_user: CurrentUser = Depends(require_roles("teacher", "admin")),
):
    try:
        result = await update_teacher_question_status(current_user=current_user, question_id=question_id, status=payload.status)
        return success_response(data=result, message="Question status updated successfully", status_code=200)
    except ValueError as exc:
        status_code = 404 if str(exc) == "Question not found" else 400
        return error_response(message=str(exc), status_code=status_code, error_code="TEACHER_QUESTION_BANK_STATUS_UPDATE_INVALID")
    except Exception:
        return error_response(message="Unable to update question status", status_code=500, error_code="TEACHER_QUESTION_BANK_STATUS_UPDATE_FAILED")


@router.delete("/{question_id}", summary="Soft delete teacher question")
async def delete_teacher_question_route(
    question_id: int,
    current_user: CurrentUser = Depends(require_roles("teacher", "admin")),
):
    try:
        result = await delete_teacher_question(current_user=current_user, question_id=question_id)
        return success_response(data=result, message="Question deleted successfully", status_code=200)
    except ValueError as exc:
        status_code = 404 if str(exc) == "Question not found" else 400
        return error_response(message=str(exc), status_code=status_code, error_code="TEACHER_QUESTION_BANK_DELETE_INVALID")
    except Exception:
        return error_response(message="Unable to delete question", status_code=500, error_code="TEACHER_QUESTION_BANK_DELETE_FAILED")
