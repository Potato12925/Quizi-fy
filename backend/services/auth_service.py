from datetime import datetime, timedelta, timezone

import jwt
from core.config import Config
from middlewares.auth_middleware import CurrentUser
from repositories.auth_repository import (
    add_user_role,
    find_role_codes_by_user_id,
    find_role_id_by_code,
    find_user_by_username,
    has_user_role,
)
from schemas.auth_schema import SetRoleRequest, UsernamePasswordLoginRequest

try:
    import bcrypt
except ImportError:  # pragma: no cover
    bcrypt = None


def _create_jwt(user: dict, roles: list[str]) -> str:
    if not Config.JWT_SECRET:
        raise ValueError("Missing JWT_SECRET")

    now = datetime.now(timezone.utc)
    exp = now + timedelta(minutes=Config.JWT_EXPIRES_IN_MINUTES)
    payload = {
        "sub": str(user["user_id"]),
        "username": user["username"],
        "roles": roles,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    return jwt.encode(payload, Config.JWT_SECRET, algorithm=Config.JWT_ALGORITHM)


def _verify_password(raw_password: str, password_hash: str) -> bool:
    if bcrypt is None:
        raise RuntimeError("bcrypt library is required for password authentication")

    return bcrypt.checkpw(
        raw_password.encode("utf-8"),
        password_hash.encode("utf-8"),
    )


async def login_with_username_password(
    payload: UsernamePasswordLoginRequest,
) -> dict:
    user = await find_user_by_username(payload.username)

    if not user:
        raise ValueError("Invalid username or password")

    password_hash = str(user.get("password_hash", ""))
    if not password_hash:
        raise ValueError("Invalid username or password")

    if not _verify_password(payload.password, password_hash):
        raise ValueError("Invalid username or password")

    if not bool(user.get("is_active", True)):
        raise ValueError("User is inactive")

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
        "user": {
            "user_id": int(user["user_id"]),
            "username": user["username"],
            "full_name": user["full_name"],
            "is_active": bool(user.get("is_active", True)),
            "must_change_password": bool(
                user.get("must_change_password", False)
            ),
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

async def get_me(
    current_user: CurrentUser,
) -> dict:
    return {
        "user_id": current_user.user_id,
        "username": current_user.username,
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
