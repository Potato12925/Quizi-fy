from math import ceil

from repositories.class_student_repository import (
    create_class_student_record,
    find_class_student_by_id,
    list_class_students,
    list_my_classes,
    soft_delete_class_student_by_id,
    update_class_student_by_id,
)
from schemas.class_student_schema import ClassStudentCreateRequest, ClassStudentUpdateRequest


async def create_class_student(payload: ClassStudentCreateRequest) -> dict:
    return await create_class_student_record({ "class_id": payload.class_id, "student_id": payload.student_id, "invited_by": payload.invited_by })


async def get_class_student_by_id(record_id: int) -> dict:
    data = await find_class_student_by_id(record_id)
    if not data:
        raise ValueError("ClassStudent not found")
    return data


async def get_my_classes(student_id: int) -> list[dict]:
    data = await list_my_classes(student_id)
    classes = [item["classes"] for item in data if item.get("classes") and item["classes"].get("status") == "active"]
    return classes


async def get_class_students(page: int, limit: int) -> dict:
    items, total = await list_class_students(page=page, limit=limit)
    total_pages = ceil(total / limit) if total > 0 else 1
    return {"items": items, "pagination": {"page": page, "limit": limit, "total": total, "total_pages": total_pages}}


async def update_class_student(record_id: int, payload: ClassStudentUpdateRequest) -> dict:
    existing = await find_class_student_by_id(record_id)
    if not existing:
        raise ValueError("ClassStudent not found")
    update_payload = payload.model_dump(exclude_none=True)
    if not update_payload:
        raise ValueError("No fields to update")
    updated = await update_class_student_by_id(record_id, update_payload)
    if not updated:
        raise ValueError("ClassStudent not found")
    return updated


async def delete_class_student(record_id: int) -> dict:
    existing = await find_class_student_by_id(record_id)
    if not existing:
        raise ValueError("ClassStudent not found")
    deleted = await soft_delete_class_student_by_id(record_id)
    if not deleted:
        raise ValueError("ClassStudent not found")
    return {"class_student_id": record_id, "deleted": True}
