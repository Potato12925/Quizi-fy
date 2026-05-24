from fastapi import APIRouter, Depends, Query

from core.responses import error_response, success_response
from middlewares.auth_middleware import CurrentUser, require_roles
from schemas.role_schema import RoleCreateRequest, RoleUpdateRequest
from services.role_service import create_role, delete_role, get_role_by_id, get_roles, update_role

router = APIRouter(prefix="/roles", tags=["Roles"])


@router.post("", summary="Create role")
async def post_role(payload: RoleCreateRequest, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await create_role(payload)
        return success_response(data=result, message="Role created successfully", status_code=201)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=400, error_code="ROLE_CREATE_INVALID")
    except Exception:
        return error_response(message="Unable to create role", status_code=500, error_code="ROLE_CREATE_FAILED")


@router.get("", summary="List roles")
async def get_role_list(page: int = Query(default=1, ge=1), limit: int = Query(default=20, ge=1, le=100), _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await get_roles(page=page, limit=limit)
        return success_response(data=result["items"], meta=result["pagination"], message="Role loaded successfully", status_code=200)
    except Exception:
        return error_response(message="Unable to load roles", status_code=500, error_code="ROLE_LIST_FAILED")


@router.get("/{record_id}", summary="Get role detail")
async def get_role_detail(record_id: int, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await get_role_by_id(record_id)
        return success_response(data=result, message="Role loaded successfully", status_code=200)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=404, error_code="ROLE_NOT_FOUND")
    except Exception:
        return error_response(message="Unable to load role", status_code=500, error_code="ROLE_GET_FAILED")


@router.put("/{record_id}", summary="Update role")
async def put_role(record_id: int, payload: RoleUpdateRequest, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await update_role(record_id, payload)
        return success_response(data=result, message="Role updated successfully", status_code=200)
    except ValueError as exc:
        status_code = 404 if str(exc) == "Role not found" else 400
        return error_response(message=str(exc), status_code=status_code, error_code="ROLE_UPDATE_INVALID")
    except Exception:
        return error_response(message="Unable to update role", status_code=500, error_code="ROLE_UPDATE_FAILED")


@router.delete("/{record_id}", summary="Delete role")
async def delete_role_route(record_id: int, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await delete_role(record_id)
        return success_response(data=result, message="Role deleted successfully", status_code=200)
    except ValueError as exc:
        status_code = 404 if str(exc) == "Role not found" else 400
        return error_response(message=str(exc), status_code=status_code, error_code="ROLE_DELETE_INVALID")
    except Exception:
        return error_response(message="Unable to delete role", status_code=500, error_code="ROLE_DELETE_FAILED")
