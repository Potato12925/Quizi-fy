from math import ceil

from repositories.document_topic_repository import (
    create_document_topic_record,
    delete_document_topic_by_id,
    find_document_topic_by_id,
    list_document_topics,
    update_document_topic_by_id,
)
from schemas.document_topic_schema import DocumentTopicCreateRequest, DocumentTopicUpdateRequest


async def create_document_topic(payload: DocumentTopicCreateRequest) -> dict:
    return await create_document_topic_record({"document_id": payload.document_id, "topic_id": payload.topic_id})


async def get_document_topic_by_id(record_id: int) -> dict:
    data = await find_document_topic_by_id(record_id)
    if not data:
        raise ValueError("DocumentTopic not found")
    return data


async def get_document_topics(page: int, limit: int) -> dict:
    items, total = await list_document_topics(page=page, limit=limit)
    total_pages = ceil(total / limit) if total > 0 else 1
    return {"items": items, "pagination": {"page": page, "limit": limit, "total": total, "total_pages": total_pages}}


async def update_document_topic(record_id: int, payload: DocumentTopicUpdateRequest) -> dict:
    existing = await find_document_topic_by_id(record_id)
    if not existing:
        raise ValueError("DocumentTopic not found")
    update_payload = payload.model_dump(exclude_none=True)
    if not update_payload:
        raise ValueError("No fields to update")
    updated = await update_document_topic_by_id(record_id, update_payload)
    if not updated:
        raise ValueError("DocumentTopic not found")
    return updated


async def delete_document_topic(record_id: int) -> dict:
    existing = await find_document_topic_by_id(record_id)
    if not existing:
        raise ValueError("DocumentTopic not found")
    deleted = await delete_document_topic_by_id(record_id)
    if not deleted:
        raise ValueError("DocumentTopic not found")
    return {"document_topic_id": record_id, "deleted": True}
