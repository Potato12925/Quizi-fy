from math import ceil

from repositories.practice_set_repository import (
    create_practice_set_record,
    find_practice_set_by_id,
    list_practice_sets,
    soft_delete_practice_set_by_id,
    update_practice_set_by_id,
)
from schemas.practice_set_schema import PracticeSetCreateRequest, PracticeSetUpdateRequest


async def create_practice_set(payload: PracticeSetCreateRequest) -> dict:
    return await create_practice_set_record({ "student_id": payload.student_id, "subject_id": payload.subject_id, "num_questions_requested": payload.num_questions_requested, "prioritize_unanswered": payload.prioritize_unanswered })


async def get_practice_set_by_id(record_id: int) -> dict:
    data = await find_practice_set_by_id(record_id)
    if not data:
        raise ValueError("PracticeSet not found")
    return data


async def get_practice_sets(page: int, limit: int) -> dict:
    items, total = await list_practice_sets(page=page, limit=limit)
    total_pages = ceil(total / limit) if total > 0 else 1
    return {"items": items, "pagination": {"page": page, "limit": limit, "total": total, "total_pages": total_pages}}


async def update_practice_set(record_id: int, payload: PracticeSetUpdateRequest) -> dict:
    existing = await find_practice_set_by_id(record_id)
    if not existing:
        raise ValueError("PracticeSet not found")
    update_payload = payload.model_dump(exclude_none=True)
    if not update_payload:
        raise ValueError("No fields to update")
    updated = await update_practice_set_by_id(record_id, update_payload)
    if not updated:
        raise ValueError("PracticeSet not found")
    return updated


async def delete_practice_set(record_id: int) -> dict:
    existing = await find_practice_set_by_id(record_id)
    if not existing:
        raise ValueError("PracticeSet not found")
    deleted = await soft_delete_practice_set_by_id(record_id)
    if not deleted:
        raise ValueError("PracticeSet not found")
    return {"practice_set_id": record_id, "deleted": True}
