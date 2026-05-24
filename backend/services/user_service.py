from math import ceil

from repositories.user_repository import (
    assign_role_to_user,
    create_user_record,
    find_role_codes_by_user_id,
    find_role_codes_by_user_ids,
    find_role_id_by_code,
    find_user_by_id,
    find_user_by_username,
    list_users,
    soft_delete_user_by_id,
    update_user_by_id,
)
from schemas.user_schema import UserCreateRequest, UserUpdateRequest

try:
    import bcrypt
except ImportError:  # pragma: no cover
    bcrypt = None


ALLOWED_ROLES = {"teacher", "student"}


def _hash_password(raw_password: str) -> str:
    if bcrypt is None:
        raise RuntimeError("bcrypt library is required for password hashing")

    password_hash = bcrypt.hashpw(
        raw_password.encode("utf-8"),
        bcrypt.gensalt(),
    )
    return password_hash.decode("utf-8")


async def _compose_user_output(user: dict) -> dict:
    user_id = int(user["user_id"])
    roles = await find_role_codes_by_user_id(user_id)
    return {
        "user_id": user_id,
        "username": user["username"],
        "full_name": user["full_name"],
        "is_active": bool(user.get("is_active", True)),
        "must_change_password": bool(user.get("must_change_password", True)),
        "roles": roles,
    }


async def create_user(payload: UserCreateRequest) -> dict:
    if payload.role_code not in ALLOWED_ROLES:
        raise ValueError("Only teacher or student roles are allowed")

    existed_user = await find_user_by_username(payload.username)
    if existed_user:
        raise ValueError("Username already exists")

    role_id = await find_role_id_by_code(payload.role_code)
    if role_id is None:
        raise ValueError("Role does not exist")

    user = await create_user_record(
        {
            "username": payload.username,
            "password_hash": _hash_password(payload.password),
            "full_name": payload.full_name,
            "is_active": True,
            "must_change_password": True,
        }
    )

    await assign_role_to_user(int(user["user_id"]), role_id)

    return await _compose_user_output(user)


async def get_user_by_id(user_id: int) -> dict:
    user = await find_user_by_id(user_id)
    if not user:
        raise ValueError("User not found")
    return await _compose_user_output(user)


async def get_users(page: int, limit: int, role_code: str | None) -> dict:
    if role_code is not None and role_code not in ALLOWED_ROLES:
        raise ValueError("role_code must be teacher or student")

    users, total = await list_users(page=page, limit=limit)
    user_ids = [int(user["user_id"]) for user in users]
    user_roles_map = await find_role_codes_by_user_ids(user_ids)

    mapped_users = []
    for user in users:
        current_user_id = int(user["user_id"])
        mapped_users.append(
            {
                "user_id": current_user_id,
                "username": user["username"],
                "full_name": user["full_name"],
                "is_active": bool(user.get("is_active", True)),
                "must_change_password": bool(user.get("must_change_password", True)),
                "roles": user_roles_map.get(current_user_id, []),
            }
        )

    if role_code:
        mapped_users = [
            user
            for user in mapped_users
            if role_code in user["roles"]
        ]

    total_pages = ceil(total / limit) if total > 0 else 1

    return {
        "items": mapped_users,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
        },
    }


async def update_user(user_id: int, payload: UserUpdateRequest) -> dict:
    existing_user = await find_user_by_id(user_id)
    if not existing_user:
        raise ValueError("User not found")

    update_payload: dict = {}
    if payload.full_name is not None:
        update_payload["full_name"] = payload.full_name
    if payload.is_active is not None:
        update_payload["is_active"] = payload.is_active
    if payload.must_change_password is not None:
        update_payload["must_change_password"] = payload.must_change_password

    if not update_payload:
        raise ValueError("No fields to update")

    updated_user = await update_user_by_id(user_id, update_payload)
    if not updated_user:
        raise ValueError("User not found")

    return await _compose_user_output(updated_user)


async def delete_user(user_id: int) -> dict:
    existing_user = await find_user_by_id(user_id)
    if not existing_user:
        raise ValueError("User not found")

    roles = await find_role_codes_by_user_id(user_id)
    if "admin" in roles:
        raise ValueError("Admin user cannot be deleted")

    deleted = await soft_delete_user_by_id(user_id)
    if not deleted:
        raise ValueError("User not found")

    return {"user_id": user_id, "deleted": True}
