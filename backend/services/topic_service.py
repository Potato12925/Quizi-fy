from math import ceil

from repositories.topic_repository import (
    create_topic_record,
    find_topic_by_id,
    list_topics,
    soft_delete_topic_by_id,
    update_topic_by_id,
)
from schemas.topic_schema import TopicCreateRequest, TopicUpdateRequest


async def create_topic(payload: TopicCreateRequest) -> dict:
    return await create_topic_record({ "subject_id": payload.subject_id, "topic_name": payload.topic_name ,"description": payload.description})


async def get_topic_by_id(record_id: int) -> dict:
    data = await find_topic_by_id(record_id)
    if not data:
        raise ValueError("Topic not found")
    return data


async def get_topics(page: int, limit: int) -> dict:
    items, total = await list_topics(page=page, limit=limit)
    total_pages = ceil(total / limit) if total > 0 else 1
    return {"items": items, "pagination": {"page": page, "limit": limit, "total": total, "total_pages": total_pages}}


async def update_topic(record_id: int, payload: TopicUpdateRequest) -> dict:
    existing = await find_topic_by_id(record_id)
    if not existing:
        raise ValueError("Topic not found")
    update_payload = payload.model_dump(exclude_none=True)
    if not update_payload:
        raise ValueError("No fields to update")
    updated = await update_topic_by_id(record_id, update_payload)
    if not updated:
        raise ValueError("Topic not found")
    return updated


async def delete_topic(record_id: int) -> dict:
    existing = await find_topic_by_id(record_id)
    if not existing:
        raise ValueError("Topic not found")
    deleted = await soft_delete_topic_by_id(record_id)
    if not deleted:
        raise ValueError("Topic not found")
    return {"topic_id": record_id, "deleted": True}
