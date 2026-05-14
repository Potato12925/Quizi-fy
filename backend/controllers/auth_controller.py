import jwt
from fastapi import APIRouter, Depends

from core.responses import error_response, success_response
from middlewares.auth_middleware import (
    CurrentUser,
    require_authenticated_user,
)
from schemas.auth_schema import (
    GoogleLoginRequest,
    SetRoleRequest,
)
from services.auth_service import (
    get_me,
    login_with_google,
    logout_user,
    set_role_for_current_user,
)

router = APIRouter(
    prefix="/auth",
    tags=["Auth"],
)


@router.post("/google-login", summary="Login with Google token")
async def post_google_login(payload: GoogleLoginRequest):
    try:
        result = await login_with_google(payload)

        return success_response(
            data=result,
            message="Google login successful",
            status_code=200,
        )

    except ValueError as exc:
        return error_response(
            message=str(exc),
            status_code=401,
            error_code="AUTH_INVALID_GOOGLE_TOKEN",
        )

    except Exception:
        return error_response(
            message="Unable to login with Google",
            status_code=500,
            error_code="AUTH_GOOGLE_LOGIN_FAILED",
        )


@router.post("/logout", summary="Logout current user")
async def post_logout(
    current_user: CurrentUser = Depends(
        require_authenticated_user
    ),
):
    try:
        result = await logout_user(current_user)

        return success_response(
            data=result,
            message="Logged out successfully",
            status_code=200,
        )

    except Exception:
        return error_response(
            message="Unable to logout",
            status_code=500,
            error_code="AUTH_LOGOUT_FAILED",
        )


@router.get("/me", summary="Get current user")
async def get_me_route(
    current_user: CurrentUser = Depends(
        require_authenticated_user
    ),
):
    try:
        result = await get_me(current_user)

        return success_response(
            data=result,
            message="Current user loaded",
            status_code=200,
        )

    except Exception as exc:
        return error_response(
            message=str(exc),
            status_code=500,
            error_code="AUTH_ME_FAILED",
        )
  



@router.post("/set-role", summary="Set role for current user")
async def post_set_role(
    payload: SetRoleRequest,
    current_user: CurrentUser = Depends(
        require_authenticated_user
    ),
):
    try:
        result = await set_role_for_current_user(
            current_user,
            payload,
        )

        return success_response(
            data=result,
            message="Role updated successfully",
            status_code=200,
        )

    except ValueError as exc:
        return error_response(
            message=str(exc),
            status_code=400,
            error_code="AUTH_INVALID_ROLE",
        )

    except Exception:
        return error_response(
            message="Unable to set role",
            status_code=500,
            error_code="AUTH_SET_ROLE_FAILED",
        )

