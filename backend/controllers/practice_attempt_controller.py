# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, Query

from core.responses import error_response, success_response
from middlewares.auth_middleware import CurrentUser, require_roles
from schemas.practice_attempt_schema import PracticeAttemptCreateRequest, PracticeAttemptUpdateRequest, PracticeAttemptStartRequest
from schemas.student_answer_schema import StudentAnswerSaveRequest
from services.practice_attempt_service import (
    create_practice_attempt,
    delete_practice_attempt,
    get_practice_attempt_by_id,
    get_practice_attempts,
    update_practice_attempt,
    start_attempt,
    autosave_answers,
    submit_attempt,
    get_attempt_result,
    get_my_history,
    get_attempt_questions,
)

router = APIRouter(prefix="/practice-attempts", tags=["PracticeAttempts"])


@router.post("", summary="Create practice_attempt")
async def post_practice_attempt(payload: PracticeAttemptCreateRequest, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await create_practice_attempt(payload)
        return success_response(data=result, message="PracticeAttempt created successfully", status_code=201)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=400, error_code="PRACTICEATTEMPT_CREATE_INVALID")
    except Exception:
        return error_response(message="Unable to create practice_attempt", status_code=500, error_code="PRACTICEATTEMPT_CREATE_FAILED")


@router.get("", summary="List practice-attempts")
async def get_practice_attempt_list(page: int = Query(default=1, ge=1), limit: int = Query(default=20, ge=1, le=100), _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await get_practice_attempts(page=page, limit=limit)
        return success_response(data=result["items"], meta=result["pagination"], message="PracticeAttempt loaded successfully", status_code=200)
    except Exception:
        return error_response(message="Unable to load practice-attempts", status_code=500, error_code="PRACTICEATTEMPT_LIST_FAILED")


@router.get("/my-history", summary="Get practice history for current student")
async def get_my_history_route(current_user: CurrentUser = Depends(require_roles("student"))):
    try:
        result = await get_my_history(current_user.user_id)
        return success_response(data=result, message="History loaded successfully", status_code=200)
    except Exception:
        return error_response(message="Unable to load history", status_code=500, error_code="HISTORY_LOAD_FAILED")


@router.post("/start", summary="Start practice attempt")
async def start_practice_attempt_route(payload: PracticeAttemptStartRequest, _: CurrentUser = Depends(require_roles("student"))):
    try:
        result = await start_attempt(payload)
        return success_response(data=result, message="Practice attempt started", status_code=201)
    except Exception:
        return error_response(message="Unable to start practice attempt", status_code=500, error_code="PRACTICE_ATTEMPT_START_FAILED")

@router.get("/{attempt_id}/questions", summary="Get attempt questions")
async def get_attempt_questions_route(attempt_id: int, _: CurrentUser = Depends(require_roles("student"))):
    try:
        result = await get_attempt_questions(attempt_id)
        return success_response(data=result, message="Questions loaded successfully", status_code=200)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=404, error_code="PRACTICE_ATTEMPT_NOT_FOUND")
    except Exception:
        return error_response(message="Unable to load questions", status_code=500, error_code="QUESTIONS_LOAD_FAILED")

@router.post("/{attempt_id}/answers", summary="Autosave student answers")
async def autosave_answers_route(attempt_id: int, payload: StudentAnswerSaveRequest, _: CurrentUser = Depends(require_roles("student"))):
    try:
        result = await autosave_answers(attempt_id, payload)
        return success_response(data=result, message="Answers saved successfully", status_code=200)
    except Exception as e:
        return error_response(message=f"Unable to save answers: {str(e)}", status_code=500, error_code="ANSWERS_SAVE_FAILED")

@router.post("/{attempt_id}/submit", summary="Submit practice attempt")
async def submit_practice_attempt_route(attempt_id: int, _: CurrentUser = Depends(require_roles("student"))):
    try:
        result = await submit_attempt(attempt_id)
        return success_response(data=result, message="Practice attempt submitted", status_code=200)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=404, error_code="PRACTICE_ATTEMPT_NOT_FOUND")
    except Exception:
        return error_response(message="Unable to submit practice attempt", status_code=500, error_code="PRACTICE_ATTEMPT_SUBMIT_FAILED")

@router.get("/{attempt_id}/result", summary="Get attempt result")
async def get_practice_attempt_result_route(attempt_id: int, _: CurrentUser = Depends(require_roles("student"))):
    try:
        result = await get_attempt_result(attempt_id)
        return success_response(data=result, message="Result loaded successfully", status_code=200)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=404, error_code="PRACTICE_ATTEMPT_NOT_FOUND")
    except Exception:
        return error_response(message="Unable to load result", status_code=500, error_code="RESULT_GET_FAILED")


@router.get("/{record_id}", summary="Get practice_attempt detail")
async def get_practice_attempt_detail(record_id: int, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await get_practice_attempt_by_id(record_id)
        return success_response(data=result, message="PracticeAttempt loaded successfully", status_code=200)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=404, error_code="PRACTICEATTEMPT_NOT_FOUND")
    except Exception:
        return error_response(message="Unable to load practice_attempt", status_code=500, error_code="PRACTICEATTEMPT_GET_FAILED")


@router.put("/{record_id}", summary="Update practice_attempt")
async def put_practice_attempt(record_id: int, payload: PracticeAttemptUpdateRequest, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await update_practice_attempt(record_id, payload)
        return success_response(data=result, message="PracticeAttempt updated successfully", status_code=200)
    except ValueError as exc:
        status_code = 404 if str(exc) == "PracticeAttempt not found" else 400
        return error_response(message=str(exc), status_code=status_code, error_code="PRACTICEATTEMPT_UPDATE_INVALID")
    except Exception:
        return error_response(message="Unable to update practice_attempt", status_code=500, error_code="PRACTICEATTEMPT_UPDATE_FAILED")


@router.delete("/{record_id}", summary="Delete practice_attempt")
async def delete_practice_attempt_route(record_id: int, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await delete_practice_attempt(record_id)
        return success_response(data=result, message="PracticeAttempt deleted successfully", status_code=200)
    except ValueError as exc:
        status_code = 404 if str(exc) == "PracticeAttempt not found" else 400
        return error_response(message=str(exc), status_code=status_code, error_code="PRACTICEATTEMPT_DELETE_INVALID")
    except Exception:
        return error_response(message="Unable to delete practice_attempt", status_code=500, error_code="PRACTICEATTEMPT_DELETE_FAILED")
