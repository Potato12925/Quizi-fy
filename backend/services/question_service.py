from math import ceil

from repositories.question_repository import (
    create_question_record,
    find_question_by_id,
    list_questions,
    soft_delete_question_by_id,
    update_question_by_id,
)
from repositories.subject_repository import find_subject_by_topic_id
from schemas.question_schema import QuestionCreateRequest, QuestionUpdateRequest
from utils.question_image_util import build_image_info, load_question_image_map, validate_question_image


class QuestionSubjectInactiveError(ValueError):
    pass


def _serialize_question(item: dict, image_by_id: dict[int, dict] | None = None) -> dict:
    image_id = int(item["image_id"]) if item.get("image_id") is not None else None
    return {
        **item,
        "image_id": image_id,
        "image": build_image_info((image_by_id or {}).get(image_id)) if image_id is not None else None,
    }


async def create_question(payload: QuestionCreateRequest) -> dict:
    subject = await find_subject_by_topic_id(payload.topic_id)
    if not subject:
        raise ValueError("Topic not found")
    if subject.get("status") != "active":
        raise QuestionSubjectInactiveError("Subject is inactive and cannot be used to create new questions")

    image = await validate_question_image(payload.image_id)
    created = await create_question_record(
        {
            "teacher_id": payload.teacher_id,
            "topic_id": payload.topic_id,
            "image_id": payload.image_id,
            "content": payload.content,
            "difficulty": payload.difficulty,
            "source": payload.source,
            "status": payload.status,
        }
    )
    image_by_id = {int(image["image_id"]): image} if image else {}
    return _serialize_question(created, image_by_id)


async def get_question_by_id(record_id: int) -> dict:
    data = await find_question_by_id(record_id)
    if not data:
        raise ValueError("Question not found")
    image_by_id = await load_question_image_map([data])
    return _serialize_question(data, image_by_id)


async def get_questions(page: int, limit: int) -> dict:
    items, total = await list_questions(page=page, limit=limit)
    image_by_id = await load_question_image_map(items)
    total_pages = ceil(total / limit) if total > 0 else 1
    return {
        "items": [_serialize_question(item, image_by_id) for item in items],
        "pagination": {"page": page, "limit": limit, "total": total, "total_pages": total_pages},
    }


async def update_question(record_id: int, payload: QuestionUpdateRequest) -> dict:
    existing = await find_question_by_id(record_id)
    if not existing:
        raise ValueError("Question not found")
    update_payload = payload.model_dump(exclude_unset=True)
    if not update_payload:
        raise ValueError("No fields to update")
    image = None
    if "image_id" in update_payload:
        image = await validate_question_image(update_payload.get("image_id"))
    updated = await update_question_by_id(record_id, update_payload)
    if not updated:
        raise ValueError("Question not found")
    if image is not None:
        return _serialize_question(updated, {int(image["image_id"]): image})
    image_by_id = await load_question_image_map([updated])
    return _serialize_question(updated, image_by_id)


async def delete_question(record_id: int) -> dict:
    existing = await find_question_by_id(record_id)
    if not existing:
        raise ValueError("Question not found")
    deleted = await soft_delete_question_by_id(record_id)
    if not deleted:
        raise ValueError("Question not found")
    return {"question_id": record_id, "deleted": True}
