from math import ceil

from repositories.practice_set_repository import (
    create_practice_set_record,
    find_practice_set_by_id,
    list_practice_sets,
    soft_delete_practice_set_by_id,
    update_practice_set_by_id,
)
from schemas.practice_set_schema import PracticeSetCreateRequest, PracticeSetUpdateRequest, PracticeSetGenerateRequest
from repositories.question_repository import get_random_question_ids
from repositories.practice_set_question_repository import bulk_insert_practice_set_questions


async def create_practice_set(payload: PracticeSetCreateRequest) -> dict:
    return await create_practice_set_record({ 
        "student_id": payload.student_id, 
        "subject_id": payload.subject_id, 
        "difficulty": payload.difficulty,
        "time_limit_minutes": payload.time_limit_minutes,
        "num_questions_requested": payload.num_questions_requested, 
        "prioritize_unanswered": payload.prioritize_unanswered 
    })


async def get_practice_set_by_id(record_id: int) -> dict:
    data = await find_practice_set_by_id(record_id)
    if not data:
        raise ValueError("PracticeSet not found")
    return data


async def generate_practice_set(student_id: int, payload: PracticeSetGenerateRequest) -> dict:
    from repositories.class_subject_repository import list_my_subjects
    my_subjects = await list_my_subjects(student_id)
    allowed_subject_ids = {item["subject_id"] for item in my_subjects}
    if payload.subject_id not in allowed_subject_ids:
        raise ValueError("Student is not enrolled in this subject")

    question_ids = await get_random_question_ids(
        subject_id=payload.subject_id,
        topic_id=payload.topic_id,
        difficulty=payload.difficulty,
        limit=payload.num_questions
    )
    if not question_ids:
        raise ValueError("Not enough questions in bank for this criteria")
        
    ps_payload = {
        "student_id": student_id,
        "subject_id": payload.subject_id,
        "topic_id": payload.topic_id,
        "difficulty": payload.difficulty if payload.difficulty != "mix" else None,
        "time_limit_minutes": payload.time_limit_minutes,
        "num_questions_requested": payload.num_questions,
        "num_questions_actual": len(question_ids),
        "prioritize_unanswered": payload.prioritize_unanswered
    }
    practice_set = await create_practice_set_record(ps_payload)
    ps_id = practice_set["practice_set_id"]
    
    psq_payloads = [
        {"practice_set_id": ps_id, "question_id": qid, "order_num": idx + 1}
        for idx, qid in enumerate(question_ids)
    ]
    await bulk_insert_practice_set_questions(psq_payloads)
    return practice_set


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
