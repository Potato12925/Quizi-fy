from math import ceil

from repositories.subject_repository import (
    create_subject_record,
    find_subject_by_code,
    find_subject_by_id,
    list_subjects,
    soft_delete_subject_by_id,
    update_subject_by_id,
)
from schemas.subject_schema import SubjectCreateRequest, SubjectUpdateRequest


async def create_subject(payload: SubjectCreateRequest) -> dict:
    existing_subject = await find_subject_by_code(payload.subject_code)
    if existing_subject:
        raise ValueError("Subject code already exists")

    created = await create_subject_record(
        {
            "subject_code": payload.subject_code,
            "subject_name": payload.subject_name,
            "description": payload.description,
            "status": "active",
        }
    )
    return created


async def get_subject_by_id(subject_id: int) -> dict:
    subject = await find_subject_by_id(subject_id)
    if not subject:
        raise ValueError("Subject not found")
    return subject


async def get_subjects(page: int, limit: int) -> dict:
    items, total = await list_subjects(page=page, limit=limit)
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


async def update_subject(subject_id: int, payload: SubjectUpdateRequest) -> dict:
    existing_subject = await find_subject_by_id(subject_id)
    if not existing_subject:
        raise ValueError("Subject not found")

    update_payload: dict = {}
    if payload.subject_code is not None:
        if payload.subject_code != existing_subject["subject_code"]:
            code_exists = await find_subject_by_code(payload.subject_code)
            if code_exists:
                raise ValueError("Subject code already exists")
        update_payload["subject_code"] = payload.subject_code
    if payload.subject_name is not None:
        update_payload["subject_name"] = payload.subject_name
    if payload.status is not None:
        update_payload["status"] = payload.status
    if payload.description is not None:
        update_payload["description"] = payload.description

    if not update_payload:
        raise ValueError("No fields to update")

    updated = await update_subject_by_id(subject_id, update_payload)
    if not updated:
        raise ValueError("Subject not found")
    return updated


async def delete_subject(subject_id: int) -> dict:
    existing_subject = await find_subject_by_id(subject_id)
    if not existing_subject:
        raise ValueError("Subject not found")

    deleted = await soft_delete_subject_by_id(subject_id)
    if not deleted:
        raise ValueError("Subject not found")

    return {"subject_id": subject_id, "deleted": True}

