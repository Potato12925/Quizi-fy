from fastapi import APIRouter, Depends, Query

from core.responses import error_response, success_response
from middlewares.auth_middleware import CurrentUser, require_roles
from schemas.ai_request_schema import AiRequestCreateRequest, AiRequestUpdateRequest
from services.ai_request_service import create_ai_request, delete_ai_request, get_ai_request_by_id, get_ai_requests, update_ai_request

router = APIRouter(prefix="/ai-requests", tags=["AIRequests"])


@router.post("", summary="Create ai_request")
async def post_ai_request(payload: AiRequestCreateRequest, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await create_ai_request(payload)
        return success_response(data=result, message="AiRequest created successfully", status_code=201)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=400, error_code="AIREQUEST_CREATE_INVALID")
    except Exception:
        return error_response(message="Unable to create ai_request", status_code=500, error_code="AIREQUEST_CREATE_FAILED")


@router.get("", summary="List ai-requests")
async def get_ai_request_list(page: int = Query(default=1, ge=1), limit: int = Query(default=20, ge=1, le=100), _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await get_ai_requests(page=page, limit=limit)
        return success_response(data=result["items"], meta=result["pagination"], message="AiRequest loaded successfully", status_code=200)
    except Exception:
        return error_response(message="Unable to load ai-requests", status_code=500, error_code="AIREQUEST_LIST_FAILED")


@router.get("/{record_id}", summary="Get ai_request detail")
async def get_ai_request_detail(record_id: int, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await get_ai_request_by_id(record_id)
        return success_response(data=result, message="AiRequest loaded successfully", status_code=200)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=404, error_code="AIREQUEST_NOT_FOUND")
    except Exception:
        return error_response(message="Unable to load ai_request", status_code=500, error_code="AIREQUEST_GET_FAILED")


@router.put("/{record_id}", summary="Update ai_request")
async def put_ai_request(record_id: int, payload: AiRequestUpdateRequest, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await update_ai_request(record_id, payload)
        return success_response(data=result, message="AiRequest updated successfully", status_code=200)
    except ValueError as exc:
        status_code = 404 if str(exc) == "AiRequest not found" else 400
        return error_response(message=str(exc), status_code=status_code, error_code="AIREQUEST_UPDATE_INVALID")
    except Exception:
        return error_response(message="Unable to update ai_request", status_code=500, error_code="AIREQUEST_UPDATE_FAILED")


@router.delete("/{record_id}", summary="Delete ai_request")
async def delete_ai_request_route(record_id: int, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await delete_ai_request(record_id)
        return success_response(data=result, message="AiRequest deleted successfully", status_code=200)
    except ValueError as exc:
        status_code = 404 if str(exc) == "AiRequest not found" else 400
        return error_response(message=str(exc), status_code=status_code, error_code="AIREQUEST_DELETE_INVALID")
    except Exception:
        return error_response(message="Unable to delete ai_request", status_code=500, error_code="AIREQUEST_DELETE_FAILED")
