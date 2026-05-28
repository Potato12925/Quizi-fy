from math import ceil

from repositories.user_repository import (
    assign_role_to_user,
    create_class_student_mapping,
    create_class_teacher_mapping,
    create_user_record,
    find_active_class_student_mapping,
    find_active_class_teacher_mapping,
    find_role_codes_by_user_id,
    find_role_codes_by_user_ids,
    find_role_id_by_code,
    find_user_ids_by_role_code,
    find_user_by_id,
    find_user_by_username,
    list_users,
    soft_delete_user_by_id,
    update_user_by_id,
)
from schemas.user_schema import UserCreateRequest, UserUpdateRequest, ChangePasswordRequest
from middlewares.auth_middleware import CurrentUser
from services.auth_service import _verify_password
from repositories.auth_repository import find_user_by_id as find_user_with_hash

try:
    import bcrypt
except ImportError:  # pragma: no cover
    bcrypt = None


ALLOWED_ROLES = {"teacher", "student"}
ALLOWED_LIST_ROLES = {"teacher", "student", "all"}
ALLOWED_STATUS = {"active", "inactive", "all"}
DEFAULT_PASSWORD = "123456"


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
        "created_at": user.get("created_at"),
        "updated_at": user.get("updated_at"),
        "deleted_at": user.get("deleted_at"),
        "roles": roles,
    }


async def create_user(payload: UserCreateRequest, current_user: CurrentUser) -> dict:
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
            "password_hash": _hash_password(DEFAULT_PASSWORD),
            "full_name": payload.full_name,
            "is_active": True,
            "must_change_password": True,
        }
    )

    created_user_id = int(user["user_id"])
    await assign_role_to_user(created_user_id, role_id)

    class_mapping = None
    if payload.class_id is not None:
        if payload.role_code == "student":
            exists = await find_active_class_student_mapping(payload.class_id, created_user_id)
            if exists is None:
                class_mapping = await create_class_student_mapping(
                    class_id=payload.class_id,
                    student_id=created_user_id,
                )
        if payload.role_code == "teacher":
            exists = await find_active_class_teacher_mapping(payload.class_id, created_user_id)
            if exists is None:
                class_mapping = await create_class_teacher_mapping(
                    class_id=payload.class_id,
                    teacher_id=created_user_id,
                    added_by=current_user.user_id,
                )

    created_output = await _compose_user_output(user)
    if class_mapping is not None:
        created_output["class_assignment"] = class_mapping
    return created_output


async def get_user_by_id(user_id: int) -> dict:
    user = await find_user_by_id(user_id)
    if not user:
        raise ValueError("User not found")
    return await _compose_user_output(user)


async def get_users(
    page: int,
    limit: int,
    role_code: str = "all",
    status: str = "all",
    search: str | None = None,
    include_deleted: bool = False,
) -> dict:
    if role_code not in ALLOWED_LIST_ROLES:
        raise ValueError("role_code must be teacher, student, or all")
    if status not in ALLOWED_STATUS:
        raise ValueError("status must be active, inactive, or all")

    role_user_ids: list[int] | None = None
    if role_code != "all":
        role_user_ids = await find_user_ids_by_role_code(role_code)

    users, total = await list_users(
        page=page,
        limit=limit,
        status=status,
        search=search,
        include_deleted=include_deleted,
        user_ids=role_user_ids,
    )
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
    existing_roles = await find_role_codes_by_user_id(user_id)
    if "admin" in existing_roles:
        raise ValueError("Admin user cannot be updated")

    update_payload: dict = {}
    if payload.username is not None and payload.username != existing_user.get("username"):
        existed_user = await find_user_by_username(payload.username)
        if existed_user and int(existed_user["user_id"]) != user_id:
            raise ValueError("Username already exists")
        update_payload["username"] = payload.username
    if payload.full_name is not None:
        update_payload["full_name"] = payload.full_name
    if payload.is_active is not None:
        update_payload["is_active"] = payload.is_active

    if not update_payload:
        raise ValueError("No fields to update")

    updated_user = await update_user_by_id(user_id, update_payload)
    if not updated_user:
        raise ValueError("User not found")

    return await _compose_user_output(updated_user)


async def update_user_status(user_id: int, is_active: bool) -> dict:
    existing_user = await find_user_by_id(user_id)
    if not existing_user:
        raise ValueError("User not found")
    roles = await find_role_codes_by_user_id(user_id)
    if "admin" in roles:
        raise ValueError("Admin user cannot be updated")
    updated_user = await update_user_by_id(user_id, {"is_active": is_active})
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


async def change_password_for_user(
    current_user: CurrentUser,
    payload: ChangePasswordRequest,
) -> dict:
    user = await find_user_with_hash(current_user.user_id)
    if not user:
        raise ValueError("User not found")

    password_hash = str(user.get("password_hash", ""))
    if not password_hash:
        raise ValueError("No password hash found for this user")

    if not _verify_password(payload.old_password, password_hash):
        raise ValueError("Mật khẩu cũ không chính xác")

    new_hash = _hash_password(payload.new_password)
    updated = await update_user_by_id(current_user.user_id, {"password_hash": new_hash})
    if not updated:
        raise ValueError("Không thể cập nhật mật khẩu")

    return {"success": True}
