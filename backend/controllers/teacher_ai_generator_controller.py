from fastapi import APIRouter, Depends, Query

from core.responses import error_response, success_response
from middlewares.auth_middleware import CurrentUser, require_roles
from schemas.teacher_ai_generator_schema import (
    TeacherAiRequestConfirmReviewPayload,
    TeacherAiRequestCreatePayload,
    TeacherBulkQuestionStatusPayload,
    TeacherManualQuestionPayload,
    TeacherQuestionUpdatePayload,
)
from services.teacher_ai_generator_service import (
    TeacherAiAuthorizationError,
    TeacherAiValidationError,
    bulk_approve_teacher_questions,
    bulk_reject_teacher_questions,
    create_teacher_ai_request,
    create_teacher_manual_question,
    confirm_teacher_ai_request_review,
    get_teacher_ai_generator_options,
    get_teacher_ai_request_detail,
    list_teacher_ai_request_questions,
    list_teacher_ai_requests,
    retry_teacher_ai_request,
    update_teacher_question,
)

router = APIRouter(prefix="/teacher", tags=["Teacher AI Generator"])


@router.get("/ai-generator/options", summary="Get teacher AI generator options")
async def get_teacher_ai_generator_options_route(
    current_user: CurrentUser = Depends(require_roles("teacher")),
):
    try:
        result = await get_teacher_ai_generator_options(current_user=current_user)
        return success_response(data=result, message="AI generator options loaded successfully", status_code=200)
    except Exception:
        return error_response(message="Unable to load AI generator options", status_code=500, error_code="TEACHER_AI_GENERATOR_OPTIONS_FAILED")


@router.post("/ai-requests", summary="Create teacher AI request")
async def create_teacher_ai_request_route(
    payload: TeacherAiRequestCreatePayload,
    current_user: CurrentUser = Depends(require_roles("teacher")),
):
    try:
        result = await create_teacher_ai_request(current_user=current_user, payload=payload)
        return success_response(data=result, message="AI request created successfully", status_code=201)
    except TeacherAiAuthorizationError as exc:
        return error_response(message=str(exc), status_code=403, error_code="TEACHER_AI_REQUEST_CREATE_FORBIDDEN")
    except TeacherAiValidationError as exc:
        return error_response(message=str(exc), status_code=400, error_code="TEACHER_AI_REQUEST_CREATE_INVALID")
    except Exception:
        return error_response(message="Unable to create AI request", status_code=500, error_code="TEACHER_AI_REQUEST_CREATE_FAILED")


@router.get("/ai-requests", summary="List teacher AI requests")
async def list_teacher_ai_requests_route(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: CurrentUser = Depends(require_roles("teacher")),
):
    try:
        result = await list_teacher_ai_requests(current_user=current_user, page=page, limit=limit)
        return success_response(data=result["items"], meta=result["pagination"], message="AI requests loaded successfully", status_code=200)
    except Exception:
        return error_response(message="Unable to load AI requests", status_code=500, error_code="TEACHER_AI_REQUEST_LIST_FAILED")


@router.get("/ai-requests/{request_id}", summary="Get teacher AI request detail")
async def get_teacher_ai_request_detail_route(
    request_id: int,
    current_user: CurrentUser = Depends(require_roles("teacher")),
):
    try:
        result = await get_teacher_ai_request_detail(current_user=current_user, request_id=request_id)
        return success_response(data=result, message="AI request loaded successfully", status_code=200)
    except TeacherAiAuthorizationError as exc:
        return error_response(message=str(exc), status_code=403, error_code="TEACHER_AI_REQUEST_DETAIL_FORBIDDEN")
    except ValueError as exc:
        return error_response(message=str(exc), status_code=404, error_code="TEACHER_AI_REQUEST_NOT_FOUND")
    except Exception:
        return error_response(message="Unable to load AI request", status_code=500, error_code="TEACHER_AI_REQUEST_DETAIL_FAILED")


@router.get("/ai-requests/{request_id}/questions", summary="Get questions by teacher AI request")
async def list_teacher_ai_request_questions_route(
    request_id: int,
    current_user: CurrentUser = Depends(require_roles("teacher")),
):
    try:
        result = await list_teacher_ai_request_questions(current_user=current_user, request_id=request_id)
        return success_response(data=result, message="AI request questions loaded successfully", status_code=200)
    except TeacherAiAuthorizationError as exc:
        return error_response(message=str(exc), status_code=403, error_code="TEACHER_AI_REQUEST_QUESTIONS_FORBIDDEN")
    except ValueError as exc:
        return error_response(message=str(exc), status_code=404, error_code="TEACHER_AI_REQUEST_NOT_FOUND")
    except Exception:
        return error_response(message="Unable to load AI request questions", status_code=500, error_code="TEACHER_AI_REQUEST_QUESTIONS_FAILED")


@router.post("/ai-requests/{request_id}/retry", summary="Retry failed teacher AI request")
async def retry_teacher_ai_request_route(
    request_id: int,
    current_user: CurrentUser = Depends(require_roles("teacher")),
):
    try:
        result = await retry_teacher_ai_request(current_user=current_user, request_id=request_id)
        return success_response(data=result, message="AI request retry queued successfully", status_code=200)
    except TeacherAiAuthorizationError as exc:
        return error_response(message=str(exc), status_code=403, error_code="TEACHER_AI_REQUEST_RETRY_FORBIDDEN")
    except TeacherAiValidationError as exc:
        return error_response(message=str(exc), status_code=400, error_code="TEACHER_AI_REQUEST_RETRY_INVALID")
    except ValueError as exc:
        return error_response(message=str(exc), status_code=404, error_code="TEACHER_AI_REQUEST_NOT_FOUND")
    except Exception:
        return error_response(message="Unable to retry AI request", status_code=500, error_code="TEACHER_AI_REQUEST_RETRY_FAILED")


@router.post("/ai-requests/{request_id}/confirm-review", summary="Confirm AI review and lock request")
async def confirm_teacher_ai_request_review_route(
    request_id: int,
    payload: TeacherAiRequestConfirmReviewPayload,
    current_user: CurrentUser = Depends(require_roles("teacher")),
):
    try:
        result = await confirm_teacher_ai_request_review(
            current_user=current_user,
            request_id=request_id,
            payload=payload,
        )
        return success_response(data=result, message="AI request review confirmed successfully", status_code=200)
    except TeacherAiAuthorizationError as exc:
        return error_response(message=str(exc), status_code=403, error_code="TEACHER_AI_REQUEST_CONFIRM_FORBIDDEN")
    except TeacherAiValidationError as exc:
        return error_response(message=str(exc), status_code=400, error_code="TEACHER_AI_REQUEST_CONFIRM_INVALID")
    except ValueError as exc:
        return error_response(message=str(exc), status_code=404, error_code="TEACHER_AI_REQUEST_NOT_FOUND")
    except Exception:
        return error_response(message="Unable to confirm AI review", status_code=500, error_code="TEACHER_AI_REQUEST_CONFIRM_FAILED")


@router.patch("/questions/{question_id}", summary="Update teacher question")
async def update_teacher_question_route(
    question_id: int,
    payload: TeacherQuestionUpdatePayload,
    current_user: CurrentUser = Depends(require_roles("teacher")),
):
    try:
        result = await update_teacher_question(current_user=current_user, question_id=question_id, payload=payload)
        return success_response(data=result, message="Question updated successfully", status_code=200)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=404, error_code="TEACHER_QUESTION_NOT_FOUND")
    except Exception:
        return error_response(message="Unable to update question", status_code=500, error_code="TEACHER_QUESTION_UPDATE_FAILED")


@router.post("/questions/bulk-approve", summary="Bulk approve draft questions")
async def bulk_approve_teacher_questions_route(
    payload: TeacherBulkQuestionStatusPayload,
    current_user: CurrentUser = Depends(require_roles("teacher")),
):
    try:
        result = await bulk_approve_teacher_questions(current_user=current_user, payload=payload)
        return success_response(data=result, message="Questions approved successfully", status_code=200)
    except Exception:
        return error_response(message="Unable to approve questions", status_code=500, error_code="TEACHER_QUESTION_BULK_APPROVE_FAILED")


@router.post("/questions/bulk-reject", summary="Bulk reject draft questions")
async def bulk_reject_teacher_questions_route(
    payload: TeacherBulkQuestionStatusPayload,
    current_user: CurrentUser = Depends(require_roles("teacher")),
):
    try:
        result = await bulk_reject_teacher_questions(current_user=current_user, payload=payload)
        return success_response(data=result, message="Questions rejected successfully", status_code=200)
    except Exception:
        return error_response(message="Unable to reject questions", status_code=500, error_code="TEACHER_QUESTION_BULK_REJECT_FAILED")


@router.post("/questions/manual", summary="Create manual teacher question")
async def create_teacher_manual_question_route(
    payload: TeacherManualQuestionPayload,
    current_user: CurrentUser = Depends(require_roles("teacher")),
):
    try:
        result = await create_teacher_manual_question(current_user=current_user, payload=payload)
        return success_response(data=result, message="Manual question created successfully", status_code=201)
    except TeacherAiAuthorizationError as exc:
        return error_response(message=str(exc), status_code=403, error_code="TEACHER_MANUAL_QUESTION_CREATE_FORBIDDEN")
    except ValueError as exc:
        return error_response(message=str(exc), status_code=400, error_code="TEACHER_MANUAL_QUESTION_CREATE_INVALID")
    except Exception:
        return error_response(message="Unable to create manual question", status_code=500, error_code="TEACHER_MANUAL_QUESTION_CREATE_FAILED")
