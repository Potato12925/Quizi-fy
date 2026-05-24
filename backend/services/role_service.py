from math import ceil

from repositories.role_repository import (
    create_role_record,
    find_role_by_id,
    list_roles,
    soft_delete_role_by_id,
    update_role_by_id,
)
from schemas.role_schema import RoleCreateRequest, RoleUpdateRequest


async def create_role(payload: RoleCreateRequest) -> dict:
    return await create_role_record({ "role_code": payload.role_code, "role_name": payload.role_name })


async def get_role_by_id(record_id: int) -> dict:
    data = await find_role_by_id(record_id)
    if not data:
        raise ValueError("Role not found")
    return data


async def get_roles(page: int, limit: int) -> dict:
    items, total = await list_roles(page=page, limit=limit)
    total_pages = ceil(total / limit) if total > 0 else 1
    return {"items": items, "pagination": {"page": page, "limit": limit, "total": total, "total_pages": total_pages}}


async def update_role(record_id: int, payload: RoleUpdateRequest) -> dict:
    existing = await find_role_by_id(record_id)
    if not existing:
        raise ValueError("Role not found")
    update_payload = payload.model_dump(exclude_none=True)
    if not update_payload:
        raise ValueError("No fields to update")
    updated = await update_role_by_id(record_id, update_payload)
    if not updated:
        raise ValueError("Role not found")
    return updated


async def delete_role(record_id: int) -> dict:
    existing = await find_role_by_id(record_id)
    if not existing:
        raise ValueError("Role not found")
    deleted = await soft_delete_role_by_id(record_id)
    if not deleted:
        raise ValueError("Role not found")
    return {"role_id": record_id, "deleted": True}
