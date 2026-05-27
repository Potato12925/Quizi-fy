from fastapi import APIRouter, Depends, Query

from core.responses import error_response, success_response
from middlewares.auth_middleware import CurrentUser, require_roles
from schemas.user_schema import UserCreateRequest, UserStatusUpdateRequest, UserUpdateRequest
from services.user_service import (
    create_user,
    delete_user,
    get_user_by_id,
    get_users,
    update_user_status,
    update_user,
)

router = APIRouter(prefix="/user", tags=["User"])

# tạo user mặc định active và phải đổi mật khẩu
@router.post("", summary="Create teacher or student user")
async def post_user(
    payload: UserCreateRequest,
    current_user: CurrentUser = Depends(require_roles("admin")),
):
    try:
        result = await create_user(payload, current_user)
        return success_response(
            data=result,
            message="User created successfully",
            status_code=201,
        )
    except ValueError as exc:
        return error_response(
            message=str(exc),
            status_code=400,
            error_code="USER_CREATE_INVALID",
        )
    except RuntimeError:
        return error_response(
            message="User service is not configured",
            status_code=500,
            error_code="USER_SERVICE_MISCONFIGURED",
        )
    except Exception as exc:
        return error_response(
            message=str(exc),
            status_code=500,
            error_code="USER_CREATE_FAILED",
        )


@router.get("", summary="List users")
async def get_user_list(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    role_code: str = Query(default="all"),
    status: str = Query(default="all"),
    search: str | None = Query(default=None),
    include_deleted: bool = Query(default=False),
    _: CurrentUser = Depends(require_roles("admin")),
):
    try:
        result = await get_users(
            page=page,
            limit=limit,
            role_code=role_code,
            status=status,
            search=search,
            include_deleted=include_deleted,
        )
        return success_response(
            data=result["items"],
            meta=result["pagination"],
            message="Users loaded successfully",
            status_code=200,
        )
    except ValueError as exc:
        return error_response(
            message=str(exc),
            status_code=400,
            error_code="USER_LIST_INVALID",
        )
    except Exception:
        return error_response(
            message="Unable to load users",
            status_code=500,
            error_code="USER_LIST_FAILED",
        )


@router.get("/{user_id}", summary="Get user detail")
async def get_user_detail(
    user_id: int,
    _: CurrentUser = Depends(require_roles("admin")),
):
    try:
        result = await get_user_by_id(user_id)
        return success_response(
            data=result,
            message="User loaded successfully",
            status_code=200,
        )
    except ValueError as exc:
        return error_response(
            message=str(exc),
            status_code=404,
            error_code="USER_NOT_FOUND",
        )
    except Exception:
        return error_response(
            message="Unable to load user",
            status_code=500,
            error_code="USER_GET_FAILED",
        )


@router.put("/{user_id}", summary="Update user")
async def put_user(
    user_id: int,
    payload: UserUpdateRequest,
    _: CurrentUser = Depends(require_roles("admin")),
):
    try:
        result = await update_user(user_id, payload)
        return success_response(
            data=result,
            message="User updated successfully",
            status_code=200,
        )
    except ValueError as exc:
        status_code = 404 if str(exc) == "User not found" else 400
        return error_response(
            message=str(exc),
            status_code=status_code,
            error_code="USER_UPDATE_INVALID",
        )
    except Exception:
        return error_response(
            message="Unable to update user",
            status_code=500,
            error_code="USER_UPDATE_FAILED",
        )


@router.patch("/{user_id}/status", summary="Update user active status")
async def patch_user_status(
    user_id: int,
    payload: UserStatusUpdateRequest,
    _: CurrentUser = Depends(require_roles("admin")),
):
    try:
        result = await update_user_status(user_id=user_id, is_active=payload.is_active)
        return success_response(
            data=result,
            message="User status updated successfully",
            status_code=200,
        )
    except ValueError as exc:
        status_code = 404 if str(exc) == "User not found" else 400
        return error_response(
            message=str(exc),
            status_code=status_code,
            error_code="USER_STATUS_UPDATE_INVALID",
        )
    except Exception:
        return error_response(
            message="Unable to update user status",
            status_code=500,
            error_code="USER_STATUS_UPDATE_FAILED",
        )


@router.delete("/{user_id}", summary="Soft delete user")
async def delete_user_route(
    user_id: int,
    _: CurrentUser = Depends(require_roles("admin")),
):
    try:
        result = await delete_user(user_id)
        return success_response(
            data=result,
            message="User deleted successfully",
            status_code=200,
        )
    except ValueError as exc:
        status_code = 404 if str(exc) == "User not found" else 400
        return error_response(
            message=str(exc),
            status_code=status_code,
            error_code="USER_DELETE_INVALID",
        )
    except Exception:
        return error_response(
            message="Unable to delete user",
            status_code=500,
            error_code="USER_DELETE_FAILED",
        )
