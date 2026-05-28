from math import ceil

from repositories.class_subject_repository import (
    create_class_subject_record,
    find_class_subject_by_id,
    list_class_subjects,
    list_my_subjects,
    soft_delete_class_subject_by_id,
    update_class_subject_by_id,
)
from schemas.class_subject_schema import ClassSubjectCreateRequest, ClassSubjectUpdateRequest


async def create_class_subject(payload: ClassSubjectCreateRequest) -> dict:
    return await create_class_subject_record({ "class_id": payload.class_id, "subject_id": payload.subject_id, "assigned_teacher_id": payload.assigned_teacher_id, "status": "active" })


async def get_class_subject_by_id(record_id: int) -> dict:
    data = await find_class_subject_by_id(record_id)
    if not data:
        raise ValueError("ClassSubject not found")
    return data


async def get_my_subjects(student_id: int) -> list[dict]:
    data = await list_my_subjects(student_id)
    subjects = []
    for item in data:
        subj = item.get("subject")
        if subj and subj.get("status") == "active":
            subjects.append(item)
    return subjects


async def get_class_subjects(page: int, limit: int) -> dict:
    items, total = await list_class_subjects(page=page, limit=limit)
    total_pages = ceil(total / limit) if total > 0 else 1
    return {"items": items, "pagination": {"page": page, "limit": limit, "total": total, "total_pages": total_pages}}


async def update_class_subject(record_id: int, payload: ClassSubjectUpdateRequest) -> dict:
    existing = await find_class_subject_by_id(record_id)
    if not existing:
        raise ValueError("ClassSubject not found")
    update_payload = payload.model_dump(exclude_none=True)
    if not update_payload:
        raise ValueError("No fields to update")
    updated = await update_class_subject_by_id(record_id, update_payload)
    if not updated:
        raise ValueError("ClassSubject not found")
    return updated


async def delete_class_subject(record_id: int) -> dict:
    existing = await find_class_subject_by_id(record_id)
    if not existing:
        raise ValueError("ClassSubject not found")
    deleted = await soft_delete_class_subject_by_id(record_id)
    if not deleted:
        raise ValueError("ClassSubject not found")
    return {"class_subject_id": record_id, "deleted": True}
