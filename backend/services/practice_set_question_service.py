from math import ceil

from repositories.practice_set_question_repository import (
    create_practice_set_question_record,
    find_practice_set_question_by_id,
    list_practice_set_questions,
    soft_delete_practice_set_question_by_id,
    update_practice_set_question_by_id,
)
from schemas.practice_set_question_schema import PracticeSetQuestionCreateRequest, PracticeSetQuestionUpdateRequest


async def create_practice_set_question(payload: PracticeSetQuestionCreateRequest) -> dict:
    return await create_practice_set_question_record({ "practice_set_id": payload.practice_set_id, "question_id": payload.question_id, "order_num": payload.order_num })


async def get_practice_set_question_by_id(record_id: int) -> dict:
    data = await find_practice_set_question_by_id(record_id)
    if not data:
        raise ValueError("PracticeSetQuestion not found")
    return data


async def get_practice_set_questions(page: int, limit: int) -> dict:
    items, total = await list_practice_set_questions(page=page, limit=limit)
    total_pages = ceil(total / limit) if total > 0 else 1
    return {"items": items, "pagination": {"page": page, "limit": limit, "total": total, "total_pages": total_pages}}


async def update_practice_set_question(record_id: int, payload: PracticeSetQuestionUpdateRequest) -> dict:
    existing = await find_practice_set_question_by_id(record_id)
    if not existing:
        raise ValueError("PracticeSetQuestion not found")
    update_payload = payload.model_dump(exclude_none=True)
    if not update_payload:
        raise ValueError("No fields to update")
    updated = await update_practice_set_question_by_id(record_id, update_payload)
    if not updated:
        raise ValueError("PracticeSetQuestion not found")
    return updated


async def delete_practice_set_question(record_id: int) -> dict:
    existing = await find_practice_set_question_by_id(record_id)
    if not existing:
        raise ValueError("PracticeSetQuestion not found")
    deleted = await soft_delete_practice_set_question_by_id(record_id)
    if not deleted:
        raise ValueError("PracticeSetQuestion not found")
    return {"practice_set_question_id": record_id, "deleted": True}
