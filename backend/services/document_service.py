from math import ceil

from repositories.document_repository import (
    create_document_record,
    find_document_by_id,
    list_documents,
    soft_delete_document_by_id,
    update_document_by_id,
)
from schemas.document_schema import DocumentCreateRequest, DocumentUpdateRequest


async def create_document(payload: DocumentCreateRequest) -> dict:
    return await create_document_record({ "teacher_id": payload.teacher_id, "subject_id": payload.subject_id, "title": payload.title, "file_url": payload.file_url, "file_type": payload.file_type, "file_size": payload.file_size, "status": payload.status })


async def get_document_by_id(record_id: int) -> dict:
    data = await find_document_by_id(record_id)
    if not data:
        raise ValueError("Document not found")
    return data


async def get_documents(page: int, limit: int) -> dict:
    items, total = await list_documents(page=page, limit=limit)
    total_pages = ceil(total / limit) if total > 0 else 1
    return {"items": items, "pagination": {"page": page, "limit": limit, "total": total, "total_pages": total_pages}}


async def update_document(record_id: int, payload: DocumentUpdateRequest) -> dict:
    existing = await find_document_by_id(record_id)
    if not existing:
        raise ValueError("Document not found")
    update_payload = payload.model_dump(exclude_none=True)
    if not update_payload:
        raise ValueError("No fields to update")
    updated = await update_document_by_id(record_id, update_payload)
    if not updated:
        raise ValueError("Document not found")
    return updated


async def delete_document(record_id: int) -> dict:
    existing = await find_document_by_id(record_id)
    if not existing:
        raise ValueError("Document not found")
    deleted = await soft_delete_document_by_id(record_id)
    if not deleted:
        raise ValueError("Document not found")
    return {"document_id": record_id, "deleted": True}
