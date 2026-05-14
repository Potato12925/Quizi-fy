import asyncio
import json
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode
from urllib.request import urlopen
from middlewares.auth_middleware import CurrentUser
import jwt

from core.config import Config
from repositories.auth_repository import (
    add_user_role,
    create_user,
    find_role_codes_by_user_id,
    find_role_id_by_code,
    find_user_by_google_id_or_email,
    has_user_role,
)
from schemas.auth_schema import GoogleLoginRequest, SetRoleRequest


async def _verify_google_token(token: str, token_type: str) -> dict:
    query_key = "id_token" if token_type == "id_token" else "access_token"
    query_string = urlencode({query_key: token})
    url = f"https://oauth2.googleapis.com/tokeninfo?{query_string}"

    def _fetch() -> dict:
        with urlopen(url, timeout=10) as response:
            return json.loads(response.read().decode("utf-8"))

    payload = await asyncio.to_thread(_fetch)
    if payload.get("error_description"):
        raise ValueError("Invalid Google token")
    return payload


def _create_jwt(user: dict, roles: list[str]) -> str:
    if not Config.JWT_SECRET:
        raise ValueError("Missing JWT_SECRET")

    now = datetime.now(timezone.utc)
    exp = now + timedelta(minutes=Config.JWT_EXPIRES_IN_MINUTES)
    payload = {
        "sub": str(user["user_id"]),
        "email": user["email"],
        "roles": roles,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    return jwt.encode(payload, Config.JWT_SECRET, algorithm=Config.JWT_ALGORITHM)


async def login_with_google(payload: GoogleLoginRequest) -> dict:
    token_payload = await _verify_google_token(payload.token, payload.token_type)

    google_id = token_payload.get("sub")
    email = token_payload.get("email")
    full_name = token_payload.get("name") or email

    if not google_id or not email:
        raise ValueError("Google token missing required claims")

    user = await find_user_by_google_id_or_email(
        google_id=google_id,
        email=email,
    )

    is_new_user = False

    if not user:
        user = await create_user(
            google_id=google_id,
            email=email,
            full_name=full_name,
        )

        is_new_user = True

        # =========================
        # ADD DEFAULT ROLE
        # =========================

        # nếu frontend không gửi role
        default_roles = payload.roles or ["student"]

        for role_code in default_roles:

            role_id = await find_role_id_by_code(role_code)

            if role_id is None:
                continue

            await add_user_role(
                user_id=int(user["user_id"]),
                role_id=role_id,
            )

    roles = await find_role_codes_by_user_id(
        int(user["user_id"])
    )

    access_token = _create_jwt(
        user=user,
        roles=roles,
    )

    return {
        "access_token": access_token,
        "token_type": "Bearer",
        "is_new_user": is_new_user,
        "user": {
            "user_id": int(user["user_id"]),
            "google_id": user["google_id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "is_active": bool(user.get("is_active", True)),
            "roles": roles,
        },
    }


def _decode_jwt_token(token: str) -> dict:
    if not Config.JWT_SECRET:
        raise ValueError("Missing JWT_SECRET")
    return jwt.decode(
        token,
        Config.JWT_SECRET,
        algorithms=[Config.JWT_ALGORITHM],
    )

from middlewares.auth_middleware import CurrentUser


async def get_me(
    current_user: CurrentUser,
) -> dict:

    return {
        "user_id": current_user.user_id,
        "email": current_user.email,
        "roles": current_user.roles,
    }



async def logout_user(_: str | None) -> dict:
    return {"logged_out": True}

async def set_role_for_current_user(
    current_user: CurrentUser,
    payload: SetRoleRequest,
) -> dict:

    user_id = current_user.user_id

    role_id = await find_role_id_by_code(
        payload.role_code
    )

    if role_id is None:
        raise ValueError("Role does not exist")

    already_has_role = await has_user_role(
        user_id=user_id,
        role_id=role_id,
    )

    if not already_has_role:
        await add_user_role(
            user_id=user_id,
            role_id=role_id,
        )

    roles = await find_role_codes_by_user_id(
        user_id
    )

    return {
        "user_id": user_id,
        "roles": roles,
    }