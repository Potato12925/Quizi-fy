from math import ceil

from repositories.user_role_repository import (
    create_user_role_record,
    find_user_role_by_id,
    list_user_roles,
    soft_delete_user_role_by_id,
    update_user_role_by_id,
)
from schemas.user_role_schema import UserRoleCreateRequest, UserRoleUpdateRequest


async def create_user_role(payload: UserRoleCreateRequest) -> dict:
    return await create_user_role_record({ "user_id": payload.user_id, "role_id": payload.role_id })


async def get_user_role_by_id(record_id: int) -> dict:
    data = await find_user_role_by_id(record_id)
    if not data:
        raise ValueError("UserRole not found")
    return data


async def get_user_roles(page: int, limit: int) -> dict:
    items, total = await list_user_roles(page=page, limit=limit)
    total_pages = ceil(total / limit) if total > 0 else 1
    return {"items": items, "pagination": {"page": page, "limit": limit, "total": total, "total_pages": total_pages}}


async def update_user_role(record_id: int, payload: UserRoleUpdateRequest) -> dict:
    existing = await find_user_role_by_id(record_id)
    if not existing:
        raise ValueError("UserRole not found")
    update_payload = payload.model_dump(exclude_none=True)
    if not update_payload:
        raise ValueError("No fields to update")
    updated = await update_user_role_by_id(record_id, update_payload)
    if not updated:
        raise ValueError("UserRole not found")
    return updated


async def delete_user_role(record_id: int) -> dict:
    existing = await find_user_role_by_id(record_id)
    if not existing:
        raise ValueError("UserRole not found")
    deleted = await soft_delete_user_role_by_id(record_id)
    if not deleted:
        raise ValueError("UserRole not found")
    return {"user_role_id": record_id, "deleted": True}
