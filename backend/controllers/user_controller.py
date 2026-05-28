from fastapi import APIRouter, Depends, Query

from core.responses import error_response, success_response
from middlewares.auth_middleware import CurrentUser, require_roles, require_authenticated_user
from schemas.user_schema import UserCreateRequest, UserUpdateRequest, ChangePasswordRequest
from services.user_service import (
    create_user,
    delete_user,
    get_user_by_id,
    get_users,
    update_user,
    change_password_for_user,
)

router = APIRouter(prefix="/user", tags=["User"])

# tạo user mặc định active và phải đổi mật khẩu
@router.post("", summary="Create teacher or student user")
async def post_user(
    payload: UserCreateRequest,
    _: CurrentUser = Depends(require_roles("admin")),
):
    try:
        result = await create_user(payload)
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
    except Exception:
        return error_response(
            message="Unable to create user",
            status_code=500,
            error_code="USER_CREATE_FAILED",
        )


@router.get("", summary="List users")
async def get_user_list(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    role_code: str | None = Query(default=None),
    _: CurrentUser = Depends(require_roles("admin")),
):
    try:
        result = await get_users(page=page, limit=limit, role_code=role_code)
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


@router.post("/change-password", summary="Change current user password")
async def post_change_password(
    payload: ChangePasswordRequest,
    current_user: CurrentUser = Depends(require_authenticated_user),
):
    try:
        result = await change_password_for_user(current_user, payload)
        return success_response(
            data=result,
            message="Đổi mật khẩu thành công",
            status_code=200,
        )
    except ValueError as exc:
        return error_response(
            message=str(exc),
            status_code=400,
            error_code="USER_CHANGE_PASSWORD_INVALID",
        )
    except Exception:
        return error_response(
            message="Unable to change password",
            status_code=500,
            error_code="USER_CHANGE_PASSWORD_FAILED",
        )
