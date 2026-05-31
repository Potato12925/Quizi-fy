from math import ceil

from repositories.question_repository import (
    create_question_record,
    find_question_by_id,
    list_questions,
    soft_delete_question_by_id,
    update_question_by_id,
)
from schemas.question_schema import QuestionCreateRequest, QuestionUpdateRequest


async def create_question(payload: QuestionCreateRequest) -> dict:
    return await create_question_record(
        {
            "teacher_id": payload.teacher_id,
            "document_topic_id": payload.document_topic_id,
            "content": payload.content,
            "difficulty": payload.difficulty,
            "source": payload.source,
            "status": payload.status,
        }
    )


async def get_question_by_id(record_id: int) -> dict:
    data = await find_question_by_id(record_id)
    if not data:
        raise ValueError("Question not found")
    return data


async def get_questions(page: int, limit: int) -> dict:
    items, total = await list_questions(page=page, limit=limit)
    total_pages = ceil(total / limit) if total > 0 else 1
    return {"items": items, "pagination": {"page": page, "limit": limit, "total": total, "total_pages": total_pages}}


async def update_question(record_id: int, payload: QuestionUpdateRequest) -> dict:
    existing = await find_question_by_id(record_id)
    if not existing:
        raise ValueError("Question not found")
    update_payload = payload.model_dump(exclude_none=True)
    if not update_payload:
        raise ValueError("No fields to update")
    updated = await update_question_by_id(record_id, update_payload)
    if not updated:
        raise ValueError("Question not found")
    return updated


async def delete_question(record_id: int) -> dict:
    existing = await find_question_by_id(record_id)
    if not existing:
        raise ValueError("Question not found")
    deleted = await soft_delete_question_by_id(record_id)
    if not deleted:
        raise ValueError("Question not found")
    return {"question_id": record_id, "deleted": True}
