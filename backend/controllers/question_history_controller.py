from fastapi import APIRouter, Depends, Query

from core.responses import error_response, success_response
from middlewares.auth_middleware import CurrentUser, require_roles
from schemas.question_history_schema import QuestionHistoryCreateRequest, QuestionHistoryUpdateRequest
from services.question_history_service import create_question_history, delete_question_history, get_question_history_by_id, get_question_historys, update_question_history

router = APIRouter(prefix="/question-history", tags=["QuestionHistory"])


@router.post("", summary="Create question_history")
async def post_question_history(payload: QuestionHistoryCreateRequest, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await create_question_history(payload)
        return success_response(data=result, message="QuestionHistory created successfully", status_code=201)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=400, error_code="QUESTIONHISTORY_CREATE_INVALID")
    except Exception:
        return error_response(message="Unable to create question_history", status_code=500, error_code="QUESTIONHISTORY_CREATE_FAILED")


@router.get("", summary="List question-history")
async def get_question_history_list(page: int = Query(default=1, ge=1), limit: int = Query(default=20, ge=1, le=100), _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await get_question_historys(page=page, limit=limit)
        return success_response(data=result["items"], meta=result["pagination"], message="QuestionHistory loaded successfully", status_code=200)
    except Exception:
        return error_response(message="Unable to load question-history", status_code=500, error_code="QUESTIONHISTORY_LIST_FAILED")


@router.get("/{record_id}", summary="Get question_history detail")
async def get_question_history_detail(record_id: int, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await get_question_history_by_id(record_id)
        return success_response(data=result, message="QuestionHistory loaded successfully", status_code=200)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=404, error_code="QUESTIONHISTORY_NOT_FOUND")
    except Exception:
        return error_response(message="Unable to load question_history", status_code=500, error_code="QUESTIONHISTORY_GET_FAILED")


@router.put("/{record_id}", summary="Update question_history")
async def put_question_history(record_id: int, payload: QuestionHistoryUpdateRequest, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await update_question_history(record_id, payload)
        return success_response(data=result, message="QuestionHistory updated successfully", status_code=200)
    except ValueError as exc:
        status_code = 404 if str(exc) == "QuestionHistory not found" else 400
        return error_response(message=str(exc), status_code=status_code, error_code="QUESTIONHISTORY_UPDATE_INVALID")
    except Exception:
        return error_response(message="Unable to update question_history", status_code=500, error_code="QUESTIONHISTORY_UPDATE_FAILED")


@router.delete("/{record_id}", summary="Delete question_history")
async def delete_question_history_route(record_id: int, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await delete_question_history(record_id)
        return success_response(data=result, message="QuestionHistory deleted successfully", status_code=200)
    except ValueError as exc:
        status_code = 404 if str(exc) == "QuestionHistory not found" else 400
        return error_response(message=str(exc), status_code=status_code, error_code="QUESTIONHISTORY_DELETE_INVALID")
    except Exception:
        return error_response(message="Unable to delete question_history", status_code=500, error_code="QUESTIONHISTORY_DELETE_FAILED")
