from fastapi import APIRouter, Depends, Query

from core.responses import error_response, success_response
from middlewares.auth_middleware import CurrentUser, require_roles
from schemas.question_option_schema import QuestionOptionCreateRequest, QuestionOptionUpdateRequest
from services.question_option_service import create_question_option, delete_question_option, get_question_option_by_id, get_question_options, update_question_option

router = APIRouter(prefix="/question-options", tags=["QuestionOptions"])


@router.post("", summary="Create question_option")
async def post_question_option(payload: QuestionOptionCreateRequest, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await create_question_option(payload)
        return success_response(data=result, message="QuestionOption created successfully", status_code=201)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=400, error_code="QUESTIONOPTION_CREATE_INVALID")
    except Exception:
        return error_response(message="Unable to create question_option", status_code=500, error_code="QUESTIONOPTION_CREATE_FAILED")


@router.get("", summary="List question-options")
async def get_question_option_list(page: int = Query(default=1, ge=1), limit: int = Query(default=20, ge=1, le=100), _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await get_question_options(page=page, limit=limit)
        return success_response(data=result["items"], meta=result["pagination"], message="QuestionOption loaded successfully", status_code=200)
    except Exception:
        return error_response(message="Unable to load question-options", status_code=500, error_code="QUESTIONOPTION_LIST_FAILED")


@router.get("/{record_id}", summary="Get question_option detail")
async def get_question_option_detail(record_id: int, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await get_question_option_by_id(record_id)
        return success_response(data=result, message="QuestionOption loaded successfully", status_code=200)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=404, error_code="QUESTIONOPTION_NOT_FOUND")
    except Exception:
        return error_response(message="Unable to load question_option", status_code=500, error_code="QUESTIONOPTION_GET_FAILED")


@router.put("/{record_id}", summary="Update question_option")
async def put_question_option(record_id: int, payload: QuestionOptionUpdateRequest, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await update_question_option(record_id, payload)
        return success_response(data=result, message="QuestionOption updated successfully", status_code=200)
    except ValueError as exc:
        status_code = 404 if str(exc) == "QuestionOption not found" else 400
        return error_response(message=str(exc), status_code=status_code, error_code="QUESTIONOPTION_UPDATE_INVALID")
    except Exception:
        return error_response(message="Unable to update question_option", status_code=500, error_code="QUESTIONOPTION_UPDATE_FAILED")


@router.delete("/{record_id}", summary="Delete question_option")
async def delete_question_option_route(record_id: int, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await delete_question_option(record_id)
        return success_response(data=result, message="QuestionOption deleted successfully", status_code=200)
    except ValueError as exc:
        status_code = 404 if str(exc) == "QuestionOption not found" else 400
        return error_response(message=str(exc), status_code=status_code, error_code="QUESTIONOPTION_DELETE_INVALID")
    except Exception:
        return error_response(message="Unable to delete question_option", status_code=500, error_code="QUESTIONOPTION_DELETE_FAILED")
