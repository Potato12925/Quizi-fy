from math import ceil

from repositories.question_history_repository import (
    create_question_history_record,
    find_question_history_by_id,
    list_question_historys,
    soft_delete_question_history_by_id,
    update_question_history_by_id,
)
from schemas.question_history_schema import QuestionHistoryCreateRequest, QuestionHistoryUpdateRequest


async def create_question_history(payload: QuestionHistoryCreateRequest) -> dict:
    return await create_question_history_record({ "question_id": payload.question_id, "changed_by": payload.changed_by })


async def get_question_history_by_id(record_id: int) -> dict:
    data = await find_question_history_by_id(record_id)
    if not data:
        raise ValueError("QuestionHistory not found")
    return data


async def get_question_historys(page: int, limit: int) -> dict:
    items, total = await list_question_historys(page=page, limit=limit)
    total_pages = ceil(total / limit) if total > 0 else 1
    return {"items": items, "pagination": {"page": page, "limit": limit, "total": total, "total_pages": total_pages}}


async def update_question_history(record_id: int, payload: QuestionHistoryUpdateRequest) -> dict:
    existing = await find_question_history_by_id(record_id)
    if not existing:
        raise ValueError("QuestionHistory not found")
    update_payload = payload.model_dump(exclude_none=True)
    if not update_payload:
        raise ValueError("No fields to update")
    updated = await update_question_history_by_id(record_id, update_payload)
    if not updated:
        raise ValueError("QuestionHistory not found")
    return updated


async def delete_question_history(record_id: int) -> dict:
    existing = await find_question_history_by_id(record_id)
    if not existing:
        raise ValueError("QuestionHistory not found")
    deleted = await soft_delete_question_history_by_id(record_id)
    if not deleted:
        raise ValueError("QuestionHistory not found")
    return {"history_id": record_id, "deleted": True}
