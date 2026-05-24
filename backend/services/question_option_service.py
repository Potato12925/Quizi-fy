from math import ceil

from repositories.question_option_repository import (
    create_question_option_record,
    find_question_option_by_id,
    list_question_options,
    soft_delete_question_option_by_id,
    update_question_option_by_id,
)
from schemas.question_option_schema import QuestionOptionCreateRequest, QuestionOptionUpdateRequest


async def create_question_option(payload: QuestionOptionCreateRequest) -> dict:
    return await create_question_option_record({ "question_id": payload.question_id, "option_label": payload.option_label, "option_text": payload.option_text, "is_correct": payload.is_correct, "order_num": payload.order_num })


async def get_question_option_by_id(record_id: int) -> dict:
    data = await find_question_option_by_id(record_id)
    if not data:
        raise ValueError("QuestionOption not found")
    return data


async def get_question_options(page: int, limit: int) -> dict:
    items, total = await list_question_options(page=page, limit=limit)
    total_pages = ceil(total / limit) if total > 0 else 1
    return {"items": items, "pagination": {"page": page, "limit": limit, "total": total, "total_pages": total_pages}}


async def update_question_option(record_id: int, payload: QuestionOptionUpdateRequest) -> dict:
    existing = await find_question_option_by_id(record_id)
    if not existing:
        raise ValueError("QuestionOption not found")
    update_payload = payload.model_dump(exclude_none=True)
    if not update_payload:
        raise ValueError("No fields to update")
    updated = await update_question_option_by_id(record_id, update_payload)
    if not updated:
        raise ValueError("QuestionOption not found")
    return updated


async def delete_question_option(record_id: int) -> dict:
    existing = await find_question_option_by_id(record_id)
    if not existing:
        raise ValueError("QuestionOption not found")
    deleted = await soft_delete_question_option_by_id(record_id)
    if not deleted:
        raise ValueError("QuestionOption not found")
    return {"option_id": record_id, "deleted": True}
