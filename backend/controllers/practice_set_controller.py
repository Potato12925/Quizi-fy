from fastapi import APIRouter, Depends, Query

from core.responses import error_response, success_response
from middlewares.auth_middleware import CurrentUser, require_roles
from schemas.practice_set_schema import PracticeSetCreateRequest, PracticeSetUpdateRequest, PracticeSetGenerateRequest
from services.practice_set_service import (
    create_practice_set,
    delete_practice_set,
    get_practice_set_by_id,
    get_practice_sets,
    update_practice_set,
    generate_practice_set,
)

router = APIRouter(prefix="/practice-sets", tags=["PracticeSets"])


@router.post("", summary="Create practice_set")
async def post_practice_set(payload: PracticeSetCreateRequest, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await create_practice_set(payload)
        return success_response(data=result, message="PracticeSet created successfully", status_code=201)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=400, error_code="PRACTICESET_CREATE_INVALID")
    except Exception:
        return error_response(message="Unable to create practice_set", status_code=500, error_code="PRACTICESET_CREATE_FAILED")


@router.get("", summary="List practice-sets")
async def get_practice_set_list(page: int = Query(default=1, ge=1), limit: int = Query(default=20, ge=1, le=100), _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await get_practice_sets(page=page, limit=limit)
        return success_response(data=result["items"], meta=result["pagination"], message="PracticeSet loaded successfully", status_code=200)
    except Exception:
        return error_response(message="Unable to load practice-sets", status_code=500, error_code="PRACTICESET_LIST_FAILED")


@router.post("/generate", summary="Generate practice set for student")
async def generate_practice_set_route(payload: PracticeSetGenerateRequest, current_user: CurrentUser = Depends(require_roles("student"))):
    try:
        result = await generate_practice_set(current_user.user_id, payload)
        return success_response(data=result, message="Practice set generated successfully", status_code=201)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=400, error_code="PRACTICE_SET_GENERATE_INVALID")
    except Exception:
        return error_response(message="Unable to generate practice set", status_code=500, error_code="PRACTICE_SET_GENERATE_FAILED")


@router.get("/{record_id}", summary="Get practice_set detail")
async def get_practice_set_detail(record_id: int, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await get_practice_set_by_id(record_id)
        return success_response(data=result, message="PracticeSet loaded successfully", status_code=200)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=404, error_code="PRACTICESET_NOT_FOUND")
    except Exception:
        return error_response(message="Unable to load practice_set", status_code=500, error_code="PRACTICESET_GET_FAILED")


@router.put("/{record_id}", summary="Update practice_set")
async def put_practice_set(record_id: int, payload: PracticeSetUpdateRequest, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await update_practice_set(record_id, payload)
        return success_response(data=result, message="PracticeSet updated successfully", status_code=200)
    except ValueError as exc:
        status_code = 404 if str(exc) == "PracticeSet not found" else 400
        return error_response(message=str(exc), status_code=status_code, error_code="PRACTICESET_UPDATE_INVALID")
    except Exception:
        return error_response(message="Unable to update practice_set", status_code=500, error_code="PRACTICESET_UPDATE_FAILED")


@router.delete("/{record_id}", summary="Delete practice_set")
async def delete_practice_set_route(record_id: int, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await delete_practice_set(record_id)
        return success_response(data=result, message="PracticeSet deleted successfully", status_code=200)
    except ValueError as exc:
        status_code = 404 if str(exc) == "PracticeSet not found" else 400
        return error_response(message=str(exc), status_code=status_code, error_code="PRACTICESET_DELETE_INVALID")
    except Exception:
        return error_response(message="Unable to delete practice_set", status_code=500, error_code="PRACTICESET_DELETE_FAILED")
