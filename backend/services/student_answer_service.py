from math import ceil

from repositories.student_answer_repository import (
    create_student_answer_record,
    find_student_answer_by_id,
    list_student_answers,
    soft_delete_student_answer_by_id,
    update_student_answer_by_id,
)
from schemas.student_answer_schema import StudentAnswerCreateRequest, StudentAnswerUpdateRequest


async def create_student_answer(payload: StudentAnswerCreateRequest) -> dict:
    return await create_student_answer_record({ "attempt_id": payload.attempt_id, "question_id": payload.question_id, "selected_option_id": payload.selected_option_id })


async def get_student_answer_by_id(record_id: int) -> dict:
    data = await find_student_answer_by_id(record_id)
    if not data:
        raise ValueError("StudentAnswer not found")
    return data


async def get_student_answers(page: int, limit: int) -> dict:
    items, total = await list_student_answers(page=page, limit=limit)
    total_pages = ceil(total / limit) if total > 0 else 1
    return {"items": items, "pagination": {"page": page, "limit": limit, "total": total, "total_pages": total_pages}}


async def update_student_answer(record_id: int, payload: StudentAnswerUpdateRequest) -> dict:
    existing = await find_student_answer_by_id(record_id)
    if not existing:
        raise ValueError("StudentAnswer not found")
    update_payload = payload.model_dump(exclude_none=True)
    if not update_payload:
        raise ValueError("No fields to update")
    updated = await update_student_answer_by_id(record_id, update_payload)
    if not updated:
        raise ValueError("StudentAnswer not found")
    return updated


async def delete_student_answer(record_id: int) -> dict:
    existing = await find_student_answer_by_id(record_id)
    if not existing:
        raise ValueError("StudentAnswer not found")
    deleted = await soft_delete_student_answer_by_id(record_id)
    if not deleted:
        raise ValueError("StudentAnswer not found")
    return {"answer_id": record_id, "deleted": True}
