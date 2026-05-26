import asyncio
from datetime import datetime, timezone

from core.supabase import SupabaseManager


SELECT_FIELDS = "document_id,teacher_id,subject_id,topic_id,title,description,file_url,file_type,file_size,file_hash,status"
HAS_DELETED = True


async def find_document_by_id(record_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = supabase.table("documents").select(SELECT_FIELDS).eq("document_id", record_id)
    if HAS_DELETED:
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


async def list_documents(page: int, limit: int) -> tuple[list[dict], int]:
    supabase = SupabaseManager.get_client()
    start = (page - 1) * limit
    end = start + limit - 1
    query = supabase.table("documents").select(SELECT_FIELDS, count="exact")
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.order("document_id").range(start, end).execute())
    return response.data or [], int(response.count or 0)


async def update_document_by_id(record_id: int, payload: dict) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = supabase.table("documents").update(payload).eq("document_id", record_id)
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.execute())
    rows = response.data or []
    return rows[0] if rows else None


async def soft_delete_document_by_id(record_id: int) -> bool:
    supabase = SupabaseManager.get_client()
    query = supabase.table("documents").update({"deleted_at": datetime.now(timezone.utc).isoformat()}).eq("document_id", record_id)
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
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


async def find_active_document_by_title_in_subject(subject_id: int, title: str) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("documents")
        .select("document_id,title,subject_id")
        .eq("subject_id", subject_id)
        .eq("title", title)
        .eq("status", "active")
        .is_("deleted_at", None)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


async def find_active_document_by_hash_in_subject(subject_id: int, file_hash: str) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("documents")
        .select("document_id,file_hash,subject_id")
        .eq("subject_id", subject_id)
        .eq("file_hash", file_hash)
        .eq("status", "active")
        .is_("deleted_at", None)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None
