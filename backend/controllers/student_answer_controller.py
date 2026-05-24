from fastapi import APIRouter, Depends, Query

from core.responses import error_response, success_response
from middlewares.auth_middleware import CurrentUser, require_roles
from schemas.student_answer_schema import StudentAnswerCreateRequest, StudentAnswerUpdateRequest
from services.student_answer_service import create_student_answer, delete_student_answer, get_student_answer_by_id, get_student_answers, update_student_answer

router = APIRouter(prefix="/student-answers", tags=["StudentAnswers"])


@router.post("", summary="Create student_answer")
async def post_student_answer(payload: StudentAnswerCreateRequest, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await create_student_answer(payload)
        return success_response(data=result, message="StudentAnswer created successfully", status_code=201)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=400, error_code="STUDENTANSWER_CREATE_INVALID")
    except Exception:
        return error_response(message="Unable to create student_answer", status_code=500, error_code="STUDENTANSWER_CREATE_FAILED")


@router.get("", summary="List student-answers")
async def get_student_answer_list(page: int = Query(default=1, ge=1), limit: int = Query(default=20, ge=1, le=100), _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await get_student_answers(page=page, limit=limit)
        return success_response(data=result["items"], meta=result["pagination"], message="StudentAnswer loaded successfully", status_code=200)
    except Exception:
        return error_response(message="Unable to load student-answers", status_code=500, error_code="STUDENTANSWER_LIST_FAILED")


@router.get("/{record_id}", summary="Get student_answer detail")
async def get_student_answer_detail(record_id: int, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await get_student_answer_by_id(record_id)
        return success_response(data=result, message="StudentAnswer loaded successfully", status_code=200)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=404, error_code="STUDENTANSWER_NOT_FOUND")
    except Exception:
        return error_response(message="Unable to load student_answer", status_code=500, error_code="STUDENTANSWER_GET_FAILED")


@router.put("/{record_id}", summary="Update student_answer")
async def put_student_answer(record_id: int, payload: StudentAnswerUpdateRequest, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await update_student_answer(record_id, payload)
        return success_response(data=result, message="StudentAnswer updated successfully", status_code=200)
    except ValueError as exc:
        status_code = 404 if str(exc) == "StudentAnswer not found" else 400
        return error_response(message=str(exc), status_code=status_code, error_code="STUDENTANSWER_UPDATE_INVALID")
    except Exception:
        return error_response(message="Unable to update student_answer", status_code=500, error_code="STUDENTANSWER_UPDATE_FAILED")


@router.delete("/{record_id}", summary="Delete student_answer")
async def delete_student_answer_route(record_id: int, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await delete_student_answer(record_id)
        return success_response(data=result, message="StudentAnswer deleted successfully", status_code=200)
    except ValueError as exc:
        status_code = 404 if str(exc) == "StudentAnswer not found" else 400
        return error_response(message=str(exc), status_code=status_code, error_code="STUDENTANSWER_DELETE_INVALID")
    except Exception:
        return error_response(message="Unable to delete student_answer", status_code=500, error_code="STUDENTANSWER_DELETE_FAILED")
