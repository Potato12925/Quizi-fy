from fastapi import APIRouter, Depends, Query

from core.responses import error_response, success_response
from middlewares.auth_middleware import CurrentUser, require_roles
from schemas.question_schema import QuestionCreateRequest, QuestionUpdateRequest
from services.question_service import create_question, delete_question, get_question_by_id, get_questions, update_question
from utils.question_image_util import QuestionImageValidationError

router = APIRouter(prefix="/questions", tags=["Questions"])


@router.post("", summary="Create question")
async def post_question(payload: QuestionCreateRequest, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await create_question(payload)
        return success_response(data=result, message="Question created successfully", status_code=201)
    except QuestionImageValidationError as exc:
        return error_response(message=str(exc), status_code=exc.status_code, error_code=exc.error_code)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=400, error_code="QUESTION_CREATE_INVALID")
    except Exception:
        return error_response(message="Unable to create question", status_code=500, error_code="QUESTION_CREATE_FAILED")


@router.get("", summary="List questions")
async def get_question_list(page: int = Query(default=1, ge=1), limit: int = Query(default=20, ge=1, le=100), _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await get_questions(page=page, limit=limit)
        return success_response(data=result["items"], meta=result["pagination"], message="Question loaded successfully", status_code=200)
    except Exception:
        return error_response(message="Unable to load questions", status_code=500, error_code="QUESTION_LIST_FAILED")


@router.get("/{record_id}", summary="Get question detail")
async def get_question_detail(record_id: int, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await get_question_by_id(record_id)
        return success_response(data=result, message="Question loaded successfully", status_code=200)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=404, error_code="QUESTION_NOT_FOUND")
    except Exception:
        return error_response(message="Unable to load question", status_code=500, error_code="QUESTION_GET_FAILED")


@router.put("/{record_id}", summary="Update question")
async def put_question(record_id: int, payload: QuestionUpdateRequest, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await update_question(record_id, payload)
        return success_response(data=result, message="Question updated successfully", status_code=200)
    except QuestionImageValidationError as exc:
        return error_response(message=str(exc), status_code=exc.status_code, error_code=exc.error_code)
    except ValueError as exc:
        status_code = 404 if str(exc) == "Question not found" else 400
        return error_response(message=str(exc), status_code=status_code, error_code="QUESTION_UPDATE_INVALID")
    except Exception:
        return error_response(message="Unable to update question", status_code=500, error_code="QUESTION_UPDATE_FAILED")


@router.delete("/{record_id}", summary="Delete question")
async def delete_question_route(record_id: int, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await delete_question(record_id)
        return success_response(data=result, message="Question deleted successfully", status_code=200)
    except ValueError as exc:
        status_code = 404 if str(exc) == "Question not found" else 400
        return error_response(message=str(exc), status_code=status_code, error_code="QUESTION_DELETE_INVALID")
    except Exception:
        return error_response(message="Unable to delete question", status_code=500, error_code="QUESTION_DELETE_FAILED")
