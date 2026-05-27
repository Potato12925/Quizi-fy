import asyncio
from datetime import datetime, timezone

from core.supabase import SupabaseManager


BASE_SELECT_FIELDS = "document_id,teacher_id,title,description,file_url,file_hash,file_type,file_size,status,created_at,updated_at,deleted_at"


async def find_document_by_id(record_id: int, include_deleted: bool = False) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = supabase.table("documents").select(BASE_SELECT_FIELDS).eq("document_id", record_id)
    if not include_deleted:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.limit(1).execute())
    rows = response.data or []
    return rows[0] if rows else None


async def find_document_enriched_by_id(record_id: int, include_deleted: bool = False) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = (
        supabase.table("documents")
        .select(
            "document_id,teacher_id,title,description,file_url,file_hash,file_type,file_size,status,created_at,updated_at,deleted_at,"
            "document_topics(document_topic_id,topic_id,topics(topic_id,topic_name,subject_id,subjects(subject_id,subject_name)))"
        )
        .eq("document_id", record_id)
    )
    if not include_deleted:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.limit(1).execute())
    rows = response.data or []
    return rows[0] if rows else None


async def create_document_record(payload: dict) -> dict:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(lambda: supabase.table("documents").insert(payload).execute())
    rows = response.data or []
    if not rows:
        raise ValueError("Unable to create document")
    return rows[0]


async def list_documents(
    page: int,
    limit: int,
    teacher_id: int | None = None,
    search: str | None = None,
    subject_id: int | None = None,
    topic_id: int | None = None,
    uploaded_from: str | None = None,
    uploaded_to: str | None = None,
    status: str | None = "active",
) -> tuple[list[dict], int]:
    supabase = SupabaseManager.get_client()
    start = (page - 1) * limit
    end = start + limit - 1

    base_query = supabase.table("documents").select(
        "document_id,teacher_id,title,description,file_url,file_hash,file_type,file_size,status,created_at,updated_at,deleted_at",
        count="exact",
    )

    if teacher_id is not None:
        base_query = base_query.eq("teacher_id", teacher_id)
    if search:
        base_query = base_query.ilike("title", f"%{search}%")
    if uploaded_from:
        base_query = base_query.gte("created_at", uploaded_from)
    if uploaded_to:
        base_query = base_query.lte("created_at", uploaded_to)
    if status:
        base_query = base_query.eq("status", status)
    base_query = base_query.is_("deleted_at", None)

    filtered_document_ids: list[int] | None = None
    if subject_id is not None or topic_id is not None:
        dt_query = supabase.table("document_topics").select("document_id,topic_id,topics!inner(subject_id)")
        if topic_id is not None:
            dt_query = dt_query.eq("topic_id", topic_id)
        if subject_id is not None:
            dt_query = dt_query.eq("topics.subject_id", subject_id)
        dt_response = await asyncio.to_thread(lambda: dt_query.execute())
        filtered_document_ids = sorted({int(row["document_id"]) for row in (dt_response.data or [])})
        if not filtered_document_ids:
            return [], 0
        base_query = base_query.in_("document_id", filtered_document_ids)

    response = await asyncio.to_thread(lambda: base_query.order("document_id", desc=True).range(start, end).execute())
    return response.data or [], int(response.count or 0)


async def update_document_by_id(record_id: int, payload: dict) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = supabase.table("documents").update(payload).eq("document_id", record_id).is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.execute())
    rows = response.data or []
    return rows[0] if rows else None


async def soft_delete_document_by_id(record_id: int) -> bool:
    supabase = SupabaseManager.get_client()
    payload = {
        "deleted_at": datetime.now(timezone.utc).isoformat(),
        "status": "inactive",
    }
    query = supabase.table("documents").update(payload).eq("document_id", record_id).is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.execute())
    rows = response.data or []
    return len(rows) > 0


async def is_teacher_assigned_to_subject(teacher_id: int, subject_id: int) -> bool:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("class_subjects")
        .select("class_subject_id")
        .eq("assigned_teacher_id", teacher_id)
        .eq("subject_id", subject_id)
        .eq("status", "active")
        .is_("deleted_at", None)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    return len(rows) > 0


async def find_subject_by_id(subject_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("subjects")
        .select("subject_id,subject_name,status")
        .eq("subject_id", subject_id)
        .is_("deleted_at", None)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


async def find_topics_by_ids(topic_ids: list[int]) -> list[dict]:
    if not topic_ids:
        return []
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("topics")
        .select("topic_id,topic_name,subject_id")
        .in_("topic_id", topic_ids)
        .is_("deleted_at", None)
        .execute()
    )
    return response.data or []


async def find_active_document_by_title_in_subject(subject_id: int, title: str, teacher_id: int | None = None, exclude_document_id: int | None = None) -> dict | None:
    supabase = SupabaseManager.get_client()
    dt_query = (
        supabase.table("document_topics")
        .select("document_id,documents!inner(document_id,title,teacher_id,status,deleted_at),topics!inner(subject_id)")
        .eq("topics.subject_id", subject_id)
        .eq("documents.title", title)
        .eq("documents.status", "active")
        .is_("documents.deleted_at", None)
    )
    if teacher_id is not None:
        dt_query = dt_query.eq("documents.teacher_id", teacher_id)
    response = await asyncio.to_thread(lambda: dt_query.execute())
    rows = response.data or []
    document_ids = sorted({int(row["document_id"]) for row in rows})
    if exclude_document_id is not None:
        document_ids = [doc_id for doc_id in document_ids if doc_id != exclude_document_id]
    if not document_ids:
        return None
    return {"document_id": document_ids[0], "title": title, "subject_id": subject_id, "teacher_id": teacher_id}


async def find_active_document_by_hash_in_subject(subject_id: int, file_hash: str, teacher_id: int | None = None, exclude_document_id: int | None = None) -> dict | None:
    supabase = SupabaseManager.get_client()
    dt_query = (
        supabase.table("document_topics")
        .select("document_id,documents!inner(document_id,file_hash,teacher_id,status,deleted_at),topics!inner(subject_id)")
        .eq("topics.subject_id", subject_id)
        .eq("documents.file_hash", file_hash)
        .eq("documents.status", "active")
        .is_("documents.deleted_at", None)
    )
    if teacher_id is not None:
        dt_query = dt_query.eq("documents.teacher_id", teacher_id)
    response = await asyncio.to_thread(lambda: dt_query.execute())
    rows = response.data or []
    document_ids = sorted({int(row["document_id"]) for row in rows})
    if exclude_document_id is not None:
        document_ids = [doc_id for doc_id in document_ids if doc_id != exclude_document_id]
    if not document_ids:
        return None
    return {"document_id": document_ids[0], "file_hash": file_hash, "subject_id": subject_id, "teacher_id": teacher_id}


async def count_ai_requests_by_document(document_id: int) -> int:
    supabase = SupabaseManager.get_client()
    dt_response = await asyncio.to_thread(
        lambda: supabase.table("document_topics")
        .select("document_topic_id")
        .eq("document_id", document_id)
        .execute()
    )
    document_topic_ids = [int(item["document_topic_id"]) for item in (dt_response.data or [])]
    if not document_topic_ids:
        return 0

    response = await asyncio.to_thread(
        lambda: supabase.table("ai_requests")
        .select("request_id", count="exact")
        .in_("document_topic_id", document_topic_ids)
        .execute()
    )
    return int(response.count or 0)


async def count_questions_by_document(document_id: int) -> int:
    supabase = SupabaseManager.get_client()
    dt_response = await asyncio.to_thread(
        lambda: supabase.table("document_topics")
        .select("document_topic_id")
        .eq("document_id", document_id)
        .execute()
    )
    document_topic_ids = [int(item["document_topic_id"]) for item in (dt_response.data or [])]
    if not document_topic_ids:
        return 0

    response = await asyncio.to_thread(
        lambda: supabase.table("questions")
        .select("question_id", count="exact")
        .in_("document_topic_id", document_topic_ids)
        .is_("deleted_at", None)
        .execute()
    )
    return int(response.count or 0)
