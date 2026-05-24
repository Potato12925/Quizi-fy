from math import ceil

from repositories.class_repository import (
    create_class_record,
    find_class_by_code,
    find_class_by_id,
    list_classes,
    soft_delete_class_by_id,
    update_class_by_id,
)
from schemas.class_schema import ClassCreateRequest, ClassUpdateRequest


async def create_class(payload: ClassCreateRequest) -> dict:
    existing_class = await find_class_by_code(payload.class_code)
    if existing_class:
        raise ValueError("Class code already exists")

    created = await create_class_record(
        {
            "class_code": payload.class_code,
            "class_name": payload.class_name,
            "description": payload.description,
            "owner_id": payload.owner_id,
            "status": "active",
        }
    )
    return created


async def get_class_by_id(class_id: int) -> dict:
    class_data = await find_class_by_id(class_id)
    if not class_data:
        raise ValueError("Class not found")
    return class_data


async def get_classes(page: int, limit: int) -> dict:
    items, total = await list_classes(page=page, limit=limit)
    total_pages = ceil(total / limit) if total > 0 else 1
    return {
        "items": items,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
        },
    }


async def update_class(class_id: int, payload: ClassUpdateRequest) -> dict:
    existing_class = await find_class_by_id(class_id)
    if not existing_class:
        raise ValueError("Class not found")

    update_payload: dict = {}
    if payload.class_name is not None:
        update_payload["class_name"] = payload.class_name
    if payload.owner_id is not None:
        update_payload["owner_id"] = payload.owner_id
    if payload.status is not None:
        update_payload["status"] = payload.status

    if not update_payload:
        raise ValueError("No fields to update")

    updated = await update_class_by_id(class_id, update_payload)
    if not updated:
        raise ValueError("Class not found")
    return updated


async def delete_class(class_id: int) -> dict:
    existing_class = await find_class_by_id(class_id)
    if not existing_class:
        raise ValueError("Class not found")

    deleted = await soft_delete_class_by_id(class_id)
    if not deleted:
        raise ValueError("Class not found")

    return {"class_id": class_id, "deleted": True}

