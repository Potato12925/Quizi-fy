from math import ceil

from middlewares.auth_middleware import CurrentUser
from repositories.document_repository import (
    create_document_record,
    find_document_by_id,
    find_active_document_by_hash_in_subject,
    find_active_document_by_title_in_subject,
    is_teacher_assigned_to_subject,
    list_documents,
    soft_delete_document_by_id,
    update_document_by_id,
)
from schemas.document_schema import DocumentCreateRequest, DocumentUpdateRequest, DocumentUploadRequest
from utils.hash_util import generate_sha256
from utils.storage_util import upload_document_file


class DocumentValidationError(ValueError):
    pass


class DocumentAuthorizationError(ValueError):
    pass


def _is_admin(current_user: CurrentUser) -> bool:
    return "admin" in current_user.roles


def _ensure_document_access(document: dict, current_user: CurrentUser) -> None:
    if _is_admin(current_user):
        return
    if int(document["teacher_id"]) != current_user.user_id:
        raise DocumentAuthorizationError("You can only access your own documents")


async def create_document(payload: DocumentCreateRequest, current_user: CurrentUser) -> dict:
    teacher_id = payload.teacher_id
    if not _is_admin(current_user):
        teacher_id = current_user.user_id
    return await create_document_record(
        {
            "teacher_id": teacher_id,
            "subject_id": payload.subject_id,
            "title": payload.title,
            "file_url": payload.file_url,
            "file_type": payload.file_type,
            "file_size": payload.file_size,
            "status": payload.status,
        }
    )


async def get_document_by_id(record_id: int, current_user: CurrentUser) -> dict:
    data = await find_document_by_id(record_id)
    if not data:
        raise ValueError("Document not found")
    _ensure_document_access(data, current_user)
    return data


async def get_documents(page: int, limit: int, current_user: CurrentUser) -> dict:
    teacher_id = None if "admin" in current_user.roles else current_user.user_id
    items, total = await list_documents(page=page, limit=limit, teacher_id=teacher_id)
    total_pages = ceil(total / limit) if total > 0 else 1
    return {"items": items, "pagination": {"page": page, "limit": limit, "total": total, "total_pages": total_pages}}


async def update_document(record_id: int, payload: DocumentUpdateRequest, current_user: CurrentUser) -> dict:
    existing = await find_document_by_id(record_id)
    if not existing:
        raise ValueError("Document not found")
    _ensure_document_access(existing, current_user)
    update_payload = payload.model_dump(exclude_none=True)
    if not update_payload:
        raise ValueError("No fields to update")
    updated = await update_document_by_id(record_id, update_payload)
    if not updated:
        raise ValueError("Document not found")
    return updated


async def delete_document(record_id: int, current_user: CurrentUser) -> dict:
    existing = await find_document_by_id(record_id)
    if not existing:
        raise ValueError("Document not found")
    _ensure_document_access(existing, current_user)
    deleted = await soft_delete_document_by_id(record_id)
    if not deleted:
        raise ValueError("Document not found")
    return {"document_id": record_id, "deleted": True}


async def upload_teacher_document(
    teacher_id: int,
    payload: DocumentUploadRequest,
    file_name: str,
    file_content_type: str,
    file_bytes: bytes,
) -> dict:
    if not file_bytes:
        raise DocumentValidationError("File is empty")

    max_file_size = 20 * 1024 * 1024
    file_size = len(file_bytes)
    if file_size > max_file_size:
        raise DocumentValidationError("File size must be 20MB or less")

    allowed_content_types = {
        "application/pdf": "pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
        "text/plain": "txt",
    }
    extension = file_name.rsplit(".", maxsplit=1)[-1].lower() if "." in file_name else ""
    if extension not in {"pdf", "docx", "txt"}:
        raise DocumentValidationError("Only PDF, DOCX, and TXT files are allowed")
    file_type = allowed_content_types.get(file_content_type, extension)
    if file_type not in {"pdf", "docx", "txt"}:
        raise DocumentValidationError("Only PDF, DOCX, and TXT files are allowed")

    is_assigned = await is_teacher_assigned_to_subject(
        teacher_id=teacher_id,
        subject_id=payload.subject_id,
    )
    if not is_assigned:
        raise DocumentAuthorizationError("Teacher is not assigned to this subject")

    existing_title = await find_active_document_by_title_in_subject(
        subject_id=payload.subject_id,
        title=payload.title,
    )
    if existing_title:
        raise DocumentValidationError("Duplicate title in this subject is not allowed")

    file_hash = generate_sha256(file_bytes)
    existing_hash = await find_active_document_by_hash_in_subject(
        subject_id=payload.subject_id,
        file_hash=file_hash,
    )
    if existing_hash:
        raise DocumentValidationError("Duplicate file content detected in this subject")

    file_url = await upload_document_file(
        teacher_id=teacher_id,
        subject_id=payload.subject_id,
        file_name=file_name,
        file_bytes=file_bytes,
    )

    return await create_document_record(
        {
            "teacher_id": teacher_id,
            "subject_id": payload.subject_id,
            "topic_id": payload.topic_id,
            "title": payload.title,
            "description": payload.description,
            "file_url": file_url,
            "file_hash": file_hash,
            "file_type": file_type,
            "file_size": file_size,
            "status": "active",
        }
    )
