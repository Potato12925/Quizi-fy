import asyncio
from datetime import datetime, timezone

from core.supabase import SupabaseManager


BASE_SELECT_FIELDS = "document_id,teacher_id,subject_id,title,description,file_url,file_hash,file_type,file_size,status,created_at,updated_at,deleted_at"


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
        .select("document_id,teacher_id,subject_id,title,description,file_url,file_hash,file_type,file_size,status,created_at,updated_at,deleted_at,subjects(subject_id,subject_name)")
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

    query = supabase.table("documents").select(
        "document_id,teacher_id,subject_id,title,description,file_url,file_hash,file_type,file_size,status,created_at,updated_at,deleted_at,subjects(subject_id,subject_name)",
        count="exact",
    )

    if teacher_id is not None:
        query = query.eq("teacher_id", teacher_id)
    if search:
        query = query.ilike("title", f"%{search}%")
    if subject_id is not None:
        query = query.eq("subject_id", subject_id)
    if uploaded_from:
        query = query.gte("created_at", uploaded_from)
    if uploaded_to:
        query = query.lte("created_at", uploaded_to)
    if status:
        query = query.eq("status", status)
    query = query.is_("deleted_at", None)

    if topic_id is not None:
        topic_documents = await asyncio.to_thread(
            lambda: supabase.table("document_topics")
            .select("document_id")
            .eq("topic_id", topic_id)
            .execute()
        )
        document_ids = sorted({int(row["document_id"]) for row in (topic_documents.data or [])})
        if not document_ids:
            return [], 0
        query = query.in_("document_id", document_ids)

    response = await asyncio.to_thread(lambda: query.order("document_id", desc=True).range(start, end).execute())
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
        .select("topic_id,topic_name")
        .in_("topic_id", topic_ids)
        .execute()
    )
    return response.data or []


async def find_active_document_by_title_in_subject(subject_id: int, title: str, teacher_id: int | None = None, exclude_document_id: int | None = None) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = (
        supabase.table("documents")
        .select("document_id,title,subject_id,teacher_id")
        .eq("subject_id", subject_id)
        .eq("title", title)
        .eq("status", "active")
        .is_("deleted_at", None)
    )
    if teacher_id is not None:
        query = query.eq("teacher_id", teacher_id)
    response = await asyncio.to_thread(lambda: query.execute())
    rows = response.data or []
    if exclude_document_id is not None:
        rows = [row for row in rows if int(row["document_id"]) != exclude_document_id]
    return rows[0] if rows else None


async def find_active_document_by_hash_in_subject(subject_id: int, file_hash: str, teacher_id: int | None = None, exclude_document_id: int | None = None) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = (
        supabase.table("documents")
        .select("document_id,file_hash,subject_id,teacher_id")
        .eq("subject_id", subject_id)
        .eq("file_hash", file_hash)
        .eq("status", "active")
        .is_("deleted_at", None)
    )
    if teacher_id is not None:
        query = query.eq("teacher_id", teacher_id)
    response = await asyncio.to_thread(lambda: query.execute())
    rows = response.data or []
    if exclude_document_id is not None:
        rows = [row for row in rows if int(row["document_id"]) != exclude_document_id]
    return rows[0] if rows else None


async def count_ai_requests_by_document(document_id: int) -> int:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("ai_requests")
        .select("request_id", count="exact")
        .eq("document_id", document_id)
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
