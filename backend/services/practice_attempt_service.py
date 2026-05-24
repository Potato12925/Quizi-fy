from math import ceil

from repositories.practice_attempt_repository import (
    create_practice_attempt_record,
    find_practice_attempt_by_id,
    list_practice_attempts,
    soft_delete_practice_attempt_by_id,
    update_practice_attempt_by_id,
)
from schemas.practice_attempt_schema import PracticeAttemptCreateRequest, PracticeAttemptUpdateRequest


async def create_practice_attempt(payload: PracticeAttemptCreateRequest) -> dict:
    return await create_practice_attempt_record({ "practice_set_id": payload.practice_set_id, "total_correct": payload.total_correct, "total_wrong": payload.total_wrong, "status": payload.status })


async def get_practice_attempt_by_id(record_id: int) -> dict:
    data = await find_practice_attempt_by_id(record_id)
    if not data:
        raise ValueError("PracticeAttempt not found")
    return data


async def get_practice_attempts(page: int, limit: int) -> dict:
    items, total = await list_practice_attempts(page=page, limit=limit)
    total_pages = ceil(total / limit) if total > 0 else 1
    return {"items": items, "pagination": {"page": page, "limit": limit, "total": total, "total_pages": total_pages}}


async def update_practice_attempt(record_id: int, payload: PracticeAttemptUpdateRequest) -> dict:
    existing = await find_practice_attempt_by_id(record_id)
    if not existing:
        raise ValueError("PracticeAttempt not found")
    update_payload = payload.model_dump(exclude_none=True)
    if not update_payload:
        raise ValueError("No fields to update")
    updated = await update_practice_attempt_by_id(record_id, update_payload)
    if not updated:
        raise ValueError("PracticeAttempt not found")
    return updated


async def delete_practice_attempt(record_id: int) -> dict:
    existing = await find_practice_attempt_by_id(record_id)
    if not existing:
        raise ValueError("PracticeAttempt not found")
    deleted = await soft_delete_practice_attempt_by_id(record_id)
    if not deleted:
        raise ValueError("PracticeAttempt not found")
    return {"attempt_id": record_id, "deleted": True}
