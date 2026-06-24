import logging
from math import ceil

from middlewares.auth_middleware import CurrentUser
from repositories.document_chunk_repository import (
    create_document_chunks,
    soft_delete_document_chunks_by_document_id,
)
from repositories.document_repository import (
    count_ai_requests_by_document,
    count_questions_by_document,
    create_document_record,
    find_active_document_by_hash_in_class_subject,
    find_active_document_by_title_in_class_subject,
    find_class_subject_by_id,
    find_document_by_id,
    find_document_enriched_by_id,
    find_topics_by_ids,
    is_teacher_assigned_to_class_subject,
    list_documents,
    soft_delete_document_by_id,
    update_document_by_id,
)
from repositories.document_topic_repository import (
    list_by_document_id,
    replace_topics_for_document,
)
from services.document_chunk_service import backfill_document_chunk_embeddings
from repositories.subject_repository import find_subject_by_class_subject_id
from schemas.document_schema import DocumentCreateRequest, DocumentUpdateRequest, DocumentUploadRequest
from utils.document_chunking_util import build_document_chunks
from utils.document_extract_util import extract_document_content_from_bytes
from utils.hash_util import generate_sha256
from utils.storage_util import upload_document_file

logger = logging.getLogger(__name__)


class DocumentValidationError(ValueError):
    pass


class DocumentAuthorizationError(ValueError):
    pass


class DocumentSubjectInactiveError(DocumentValidationError):
    pass


def _is_admin(current_user: CurrentUser) -> bool:
    return "admin" in current_user.roles


def _ensure_document_access(document: dict, current_user: CurrentUser) -> None:
    if _is_admin(current_user):
        return
    if int(document["teacher_id"]) != current_user.user_id:
        raise DocumentAuthorizationError("You can only access your own documents")


async def _validate_class_subject_access(class_subject_id: int, current_user: CurrentUser) -> None:
    class_subject = await find_class_subject_by_id(class_subject_id)
    if not class_subject:
        raise DocumentValidationError("Class subject not found")
    if not _is_admin(current_user):
        is_assigned = await is_teacher_assigned_to_class_subject(
            teacher_id=current_user.user_id,
            class_subject_id=class_subject_id,
        )
        if not is_assigned:
            raise DocumentAuthorizationError("Teacher is not assigned to this class subject")


async def _validate_class_subject_access_by_teacher(class_subject_id: int, teacher_id: int, is_admin: bool = False) -> None:
    class_subject = await find_class_subject_by_id(class_subject_id)
    if not class_subject:
        raise DocumentValidationError("Class subject not found")
    if not is_admin:
        is_assigned = await is_teacher_assigned_to_class_subject(
            teacher_id=teacher_id,
            class_subject_id=class_subject_id,
        )
        if not is_assigned:
            raise DocumentAuthorizationError("Teacher is not assigned to this class subject")


async def _validate_topic_ids(topic_ids: list[int]) -> tuple[list[dict], int]:
    unique_ids = sorted(set(topic_ids))
    if not unique_ids:
        raise DocumentValidationError("topic_ids must not be empty")
    topics = await find_topics_by_ids(unique_ids)
    if len(topics) != len(unique_ids):
        raise DocumentValidationError("One or more topic_ids are invalid")
    class_subject_ids = {int(topic["class_subject_id"]) for topic in topics}
    if len(class_subject_ids) != 1:
        raise DocumentValidationError("All topic_ids must belong to the same class subject")
    return topics, class_subject_ids.pop()


async def _serialize_document(document: dict) -> dict:
    document_id = int(document["document_id"])
    topic_rows = await list_by_document_id(document_id)
    topics = []
    class_subject_id: int | None = None
    subject_id: int | None = None
    subject_name = "Unknown"

    for row in topic_rows:
        topic = row.get("topics") or {}
        if class_subject_id is None and topic.get("class_subject_id"):
            class_subject_id = int(topic["class_subject_id"])
        class_subject = topic.get("class_subjects") or {}
        subject_ref = class_subject.get("subjects") or {}
        if subject_id is None and class_subject.get("subject_id") is not None:
            subject_id = int(class_subject["subject_id"])
        if subject_ref.get("subject_name"):
            subject_name = subject_ref["subject_name"]
        topics.append({
            "topic_id": int(row["topic_id"]),
            "topic_name": topic.get("topic_name"),
        })

    ai_request_count, question_count = await _get_document_usage_counts(document_id)

    return {
        "document_id": document_id,
        "teacher_id": int(document["teacher_id"]),
        "class_subject_id": class_subject_id,
        "subject_id": subject_id,
        "subject": {
            "subject_id": subject_id,
            "subject_name": subject_name,
        },
        "title": document.get("title"),
        "description": document.get("description"),
        "file_url": document.get("file_url"),
        "file_type": document.get("file_type"),
        "file_size": int(document.get("file_size") or 0),
        "status": document.get("status"),
        "created_at": document.get("created_at"),
        "updated_at": document.get("updated_at"),
        "topics": topics,
        "ai_request_count": ai_request_count,
        "question_count": question_count,
    }


async def _get_document_usage_counts(document_id: int) -> tuple[int, int]:
    ai_count = await count_ai_requests_by_document(document_id)
    question_count = await count_questions_by_document(document_id)
    return ai_count, question_count


async def _refresh_document_chunks_best_effort(
    *,
    document_id: int,
    file_bytes: bytes,
    file_type: str,
    replace_existing: bool,
) -> None:
    try:
        extracted = extract_document_content_from_bytes(raw=file_bytes, file_type=file_type)
        chunks = build_document_chunks(extracted)
        if replace_existing:
            await soft_delete_document_chunks_by_document_id(document_id)
        if chunks:
            created_chunks = await create_document_chunks(document_id=document_id, chunks=chunks)
            if created_chunks:
                try:
                    await backfill_document_chunk_embeddings(document_id=document_id)
                except Exception as embedding_exc:
                    logger.warning(
                        "Document chunk embeddings skipped; worker fallback will handle it | document_id=%s | error=%s",
                        document_id,
                        str(embedding_exc),
                    )
    except Exception as exc:
        logger.warning(
            "Document chunk refresh skipped; worker fallback will handle it | document_id=%s | replace_existing=%s | error=%s",
            document_id,
            replace_existing,
            str(exc),
        )


async def create_document(payload: DocumentCreateRequest, current_user: CurrentUser) -> dict:
    teacher_id = payload.teacher_id
    if not _is_admin(current_user):
        teacher_id = current_user.user_id
    _, class_subject_id = await _validate_topic_ids(payload.topic_ids)
    subject = await find_subject_by_class_subject_id(class_subject_id)
    if not subject:
        raise DocumentValidationError("Class subject not found")
    if subject.get("status") != "active":
        raise DocumentSubjectInactiveError("Subject is inactive and cannot be used to create new documents")
    await _validate_class_subject_access_by_teacher(class_subject_id, teacher_id=teacher_id, is_admin=_is_admin(current_user))
    created = await create_document_record(
        {
            "teacher_id": teacher_id,
            "title": payload.title,
            "file_url": payload.file_url,
            "file_type": payload.file_type,
            "file_size": payload.file_size,
            "status": payload.status,
        }
    )
    await replace_topics_for_document(int(created["document_id"]), payload.topic_ids)
    enriched = await find_document_enriched_by_id(int(created["document_id"]))
    if not enriched:
        raise ValueError("Document not found")
    return await _serialize_document(enriched)


async def get_document_by_id(record_id: int, current_user: CurrentUser) -> dict:
    data = await find_document_enriched_by_id(record_id)
    if not data:
        raise ValueError("Document not found")
    _ensure_document_access(data, current_user)
    return await _serialize_document(data)


async def get_documents(
    page: int,
    limit: int,
    current_user: CurrentUser,
    search: str | None = None,
    class_subject_id: int | None = None,
    topic_id: int | None = None,
    uploaded_from: str | None = None,
    uploaded_to: str | None = None,
    status: str | None = "active",
) -> dict:
    teacher_id = None if _is_admin(current_user) else current_user.user_id
    items, total = await list_documents(
        page=page,
        limit=limit,
        teacher_id=teacher_id,
        search=search,
        class_subject_id=class_subject_id,
        topic_id=topic_id,
        uploaded_from=uploaded_from,
        uploaded_to=uploaded_to,
        status=status,
    )
    total_pages = ceil(total / limit) if total > 0 else 1
    serialized_items = [await _serialize_document(item) for item in items]
    return {
        "items": serialized_items,
        "pagination": {"page": page, "limit": limit, "total": total, "total_pages": total_pages},
    }


async def update_document(
    record_id: int,
    payload: DocumentUpdateRequest,
    current_user: CurrentUser,
    file_name: str | None = None,
    file_content_type: str | None = None,
    file_bytes: bytes | None = None,
) -> dict:
    existing = await find_document_by_id(record_id)
    if not existing:
        raise ValueError("Document not found")
    _ensure_document_access(existing, current_user)

    update_payload = payload.model_dump(exclude_none=True)
    topic_ids = update_payload.pop("topic_ids", None)
    if topic_ids is None:
        raise DocumentValidationError("topic_ids must not be empty")

    _, target_class_subject_id = await _validate_topic_ids(topic_ids)
    await _validate_class_subject_access(target_class_subject_id, current_user)

    title_for_dup_check = str(update_payload.get("title") or existing["title"])
    existing_title = await find_active_document_by_title_in_class_subject(
        class_subject_id=target_class_subject_id,
        title=title_for_dup_check,
        teacher_id=existing["teacher_id"],
        exclude_document_id=record_id,
    )
    if existing_title:
        raise DocumentValidationError("Duplicate title in this class subject is not allowed")

    if file_bytes is not None:
        file_type, file_size, file_hash = _validate_and_build_file_metadata(
            file_name=file_name or "document.txt",
            file_content_type=file_content_type or "",
            file_bytes=file_bytes,
        )
        existing_hash = await find_active_document_by_hash_in_class_subject(
            class_subject_id=target_class_subject_id,
            file_hash=file_hash,
            teacher_id=existing["teacher_id"],
            exclude_document_id=record_id,
        )
        if existing_hash:
            raise DocumentValidationError("Duplicate file content detected in this class subject")

        file_url = await upload_document_file(
            teacher_id=int(existing["teacher_id"]),
            subject_id=target_class_subject_id,
            file_name=file_name or "document.txt",
            file_bytes=file_bytes,
            file_content_type=file_content_type or "",
        )
        update_payload.update(
            {
                "file_url": file_url,
                "file_hash": file_hash,
                "file_type": file_type,
                "file_size": file_size,
            }
        )

    if update_payload:
        updated = await update_document_by_id(record_id, update_payload)
        if not updated:
            raise ValueError("Document not found")

    await replace_topics_for_document(record_id, topic_ids)
    if file_bytes is not None:
        await _refresh_document_chunks_best_effort(
            document_id=record_id,
            file_bytes=file_bytes,
            file_type=str(update_payload.get("file_type") or existing.get("file_type") or ""),
            replace_existing=True,
        )

    result = await get_document_by_id(record_id, current_user=current_user)
    ai_count = int(result.get("ai_request_count") or 0)
    q_count = int(result.get("question_count") or 0)
    if ai_count > 0 or q_count > 0:
        result["warning"] = {
            "has_related_history": True,
            "message": "Document has existing AI requests or questions",
        }
    return result


async def delete_document(record_id: int, current_user: CurrentUser) -> dict:
    existing = await find_document_by_id(record_id)
    if not existing:
        raise ValueError("Document not found")
    _ensure_document_access(existing, current_user)
    deleted = await soft_delete_document_by_id(record_id)
    if not deleted:
        raise ValueError("Document not found")
    return {"document_id": record_id, "deleted": True}


def _validate_and_build_file_metadata(
    file_name: str,
    file_content_type: str,
    file_bytes: bytes,
) -> tuple[str, int, str]:
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

    file_hash = generate_sha256(file_bytes)
    return file_type, file_size, file_hash


async def upload_teacher_document(
    teacher_id: int,
    payload: DocumentUploadRequest,
    file_name: str,
    file_content_type: str,
    file_bytes: bytes,
) -> dict:
    file_type, file_size, file_hash = _validate_and_build_file_metadata(
        file_name=file_name,
        file_content_type=file_content_type,
        file_bytes=file_bytes,
    )

    _, class_subject_id = await _validate_topic_ids(payload.topic_ids)
    subject = await find_subject_by_class_subject_id(class_subject_id)
    if not subject:
        raise DocumentValidationError("Class subject not found")
    if subject.get("status") != "active":
        raise DocumentSubjectInactiveError("Subject is inactive and cannot be used to create new documents")
    await _validate_class_subject_access_by_teacher(class_subject_id, teacher_id=teacher_id, is_admin=False)

    existing_title = await find_active_document_by_title_in_class_subject(
        class_subject_id=class_subject_id,
        title=payload.title,
        teacher_id=teacher_id,
    )
    if existing_title:
        raise DocumentValidationError("Duplicate title in this class subject is not allowed")

    existing_hash = await find_active_document_by_hash_in_class_subject(
        class_subject_id=class_subject_id,
        file_hash=file_hash,
        teacher_id=teacher_id,
    )
    if existing_hash:
        raise DocumentValidationError("Duplicate file content detected in this class subject")

    file_url = await upload_document_file(
        teacher_id=teacher_id,
        subject_id=class_subject_id,
        file_name=file_name,
        file_bytes=file_bytes,
        file_content_type=file_type,
    )

    created = await create_document_record(
        {
            "teacher_id": teacher_id,
            "title": payload.title,
            "description": payload.description,
            "file_url": file_url,
            "file_hash": file_hash,
            "file_type": file_type,
            "file_size": file_size,
            "status": "active",
        }
    )

    await replace_topics_for_document(int(created["document_id"]), payload.topic_ids)
    await _refresh_document_chunks_best_effort(
        document_id=int(created["document_id"]),
        file_bytes=file_bytes,
        file_type=file_type,
        replace_existing=False,
    )
    enriched = await find_document_enriched_by_id(int(created["document_id"]))
    if not enriched:
        raise ValueError("Document not found")
    return await _serialize_document(enriched)
