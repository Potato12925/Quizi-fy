from math import ceil

from repositories.ai_request_repository import (
    bulk_create_ai_request_difficulty_distribution,
    create_ai_request_record,
    find_ai_request_by_id,
    list_ai_requests,
    soft_delete_ai_request_by_id,
    update_ai_request_by_id,
)
from schemas.ai_request_schema import AiRequestCreateRequest, AiRequestUpdateRequest


async def create_ai_request(payload: AiRequestCreateRequest) -> dict:
    created = await create_ai_request_record(
        {
            "document_topic_id": payload.document_topic_id,
            "num_questions": payload.num_questions,
            "content_scope": payload.content_scope,
        }
    )
    await bulk_create_ai_request_difficulty_distribution(
        [
            {
                "request_id": created["request_id"],
                "difficulty": item.difficulty,
                "percentage": item.percentage,
                "question_count": item.question_count,
            }
            for item in payload.difficulty_distribution
        ]
    )
    refreshed = await find_ai_request_by_id(int(created["request_id"]))
    return refreshed or created


async def get_ai_request_by_id(record_id: int) -> dict:
    data = await find_ai_request_by_id(record_id)
    if not data:
        raise ValueError("AiRequest not found")
    return data


async def get_ai_requests(page: int, limit: int) -> dict:
    items, total = await list_ai_requests(page=page, limit=limit)
    total_pages = ceil(total / limit) if total > 0 else 1
    return {"items": items, "pagination": {"page": page, "limit": limit, "total": total, "total_pages": total_pages}}


async def update_ai_request(record_id: int, payload: AiRequestUpdateRequest) -> dict:
    existing = await find_ai_request_by_id(record_id)
    if not existing:
        raise ValueError("AiRequest not found")
    update_payload = payload.model_dump(exclude_none=True)
    if not update_payload:
        raise ValueError("No fields to update")
    updated = await update_ai_request_by_id(record_id, update_payload)
    if not updated:
        raise ValueError("AiRequest not found")
    return updated


async def delete_ai_request(record_id: int) -> dict:
    existing = await find_ai_request_by_id(record_id)
    if not existing:
        raise ValueError("AiRequest not found")
    deleted = await soft_delete_ai_request_by_id(record_id)
    if not deleted:
        raise ValueError("AiRequest not found")
    return {"request_id": record_id, "deleted": True}
