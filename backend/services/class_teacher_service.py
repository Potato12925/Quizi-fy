from math import ceil

from repositories.class_teacher_repository import (
    create_class_teacher_record,
    find_class_teacher_by_id,
    list_class_teachers,
    soft_delete_class_teacher_by_id,
    update_class_teacher_by_id,
)
from schemas.class_teacher_schema import ClassTeacherCreateRequest, ClassTeacherUpdateRequest


async def create_class_teacher(payload: ClassTeacherCreateRequest) -> dict:
    return await create_class_teacher_record({ "class_id": payload.class_id, "teacher_id": payload.teacher_id, "added_by": payload.added_by })


async def get_class_teacher_by_id(record_id: int) -> dict:
    data = await find_class_teacher_by_id(record_id)
    if not data:
        raise ValueError("ClassTeacher not found")
    return data


async def get_class_teachers(page: int, limit: int) -> dict:
    items, total = await list_class_teachers(page=page, limit=limit)
    total_pages = ceil(total / limit) if total > 0 else 1
    return {"items": items, "pagination": {"page": page, "limit": limit, "total": total, "total_pages": total_pages}}


async def update_class_teacher(record_id: int, payload: ClassTeacherUpdateRequest) -> dict:
    existing = await find_class_teacher_by_id(record_id)
    if not existing:
        raise ValueError("ClassTeacher not found")
    update_payload = payload.model_dump(exclude_none=True)
    if not update_payload:
        raise ValueError("No fields to update")
    updated = await update_class_teacher_by_id(record_id, update_payload)
    if not updated:
        raise ValueError("ClassTeacher not found")
    return updated


async def delete_class_teacher(record_id: int) -> dict:
    existing = await find_class_teacher_by_id(record_id)
    if not existing:
        raise ValueError("ClassTeacher not found")
    deleted = await soft_delete_class_teacher_by_id(record_id)
    if not deleted:
        raise ValueError("ClassTeacher not found")
    return {"class_teacher_id": record_id, "deleted": True}
