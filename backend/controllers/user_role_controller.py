from fastapi import APIRouter, Depends, Query

from core.responses import error_response, success_response
from middlewares.auth_middleware import CurrentUser, require_roles
from schemas.user_role_schema import UserRoleCreateRequest, UserRoleUpdateRequest
from services.user_role_service import create_user_role, delete_user_role, get_user_role_by_id, get_user_roles, update_user_role

router = APIRouter(prefix="/user-roles", tags=["UserRoles"])


@router.post("", summary="Create user_role")
async def post_user_role(payload: UserRoleCreateRequest, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await create_user_role(payload)
        return success_response(data=result, message="UserRole created successfully", status_code=201)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=400, error_code="USERROLE_CREATE_INVALID")
    except Exception:
        return error_response(message="Unable to create user_role", status_code=500, error_code="USERROLE_CREATE_FAILED")


@router.get("", summary="List user-roles")
async def get_user_role_list(page: int = Query(default=1, ge=1), limit: int = Query(default=20, ge=1, le=100), _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await get_user_roles(page=page, limit=limit)
        return success_response(data=result["items"], meta=result["pagination"], message="UserRole loaded successfully", status_code=200)
    except Exception:
        return error_response(message="Unable to load user-roles", status_code=500, error_code="USERROLE_LIST_FAILED")


@router.get("/{record_id}", summary="Get user_role detail")
async def get_user_role_detail(record_id: int, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await get_user_role_by_id(record_id)
        return success_response(data=result, message="UserRole loaded successfully", status_code=200)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=404, error_code="USERROLE_NOT_FOUND")
    except Exception:
        return error_response(message="Unable to load user_role", status_code=500, error_code="USERROLE_GET_FAILED")


@router.put("/{record_id}", summary="Update user_role")
async def put_user_role(record_id: int, payload: UserRoleUpdateRequest, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await update_user_role(record_id, payload)
        return success_response(data=result, message="UserRole updated successfully", status_code=200)
    except ValueError as exc:
        status_code = 404 if str(exc) == "UserRole not found" else 400
        return error_response(message=str(exc), status_code=status_code, error_code="USERROLE_UPDATE_INVALID")
    except Exception:
        return error_response(message="Unable to update user_role", status_code=500, error_code="USERROLE_UPDATE_FAILED")


@router.delete("/{record_id}", summary="Delete user_role")
async def delete_user_role_route(record_id: int, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await delete_user_role(record_id)
        return success_response(data=result, message="UserRole deleted successfully", status_code=200)
    except ValueError as exc:
        status_code = 404 if str(exc) == "UserRole not found" else 400
        return error_response(message=str(exc), status_code=status_code, error_code="USERROLE_DELETE_INVALID")
    except Exception:
        return error_response(message="Unable to delete user_role", status_code=500, error_code="USERROLE_DELETE_FAILED")
