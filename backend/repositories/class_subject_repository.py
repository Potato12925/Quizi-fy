import asyncio
from datetime import datetime, timezone

from core.supabase import SupabaseManager


SELECT_FIELDS = "class_subject_id,class_id,subject_id,status"
HAS_DELETED = True


async def find_class_subject_by_id(record_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = supabase.table("class_subjects").select(SELECT_FIELDS).eq("class_subject_id", record_id)
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.limit(1).execute())
    rows = response.data or []
    return rows[0] if rows else None


async def list_my_subjects(student_id: int) -> list[dict]:
    supabase = SupabaseManager.get_client()
    class_students_resp = await asyncio.to_thread(
        lambda: supabase.table("class_students")
        .select("class_id")
        .eq("student_id", student_id)
        .is_("deleted_at", None)
        .execute()
    )
    class_ids = [item["class_id"] for item in (class_students_resp.data or [])]
    if not class_ids:
        return []
    subjects_resp = await asyncio.to_thread(
        lambda: supabase.table("class_subjects")
        .select("subject_id, subject:subjects(*), class:classes(*)")
        .in_("class_id", class_ids)
        .eq("status", "active")
        .is_("deleted_at", None)
        .execute()
    )
    return subjects_resp.data or []

async def create_class_subject_record(payload: dict) -> dict:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(lambda: supabase.table("class_subjects").insert(payload).execute())
    rows = response.data or []
    if not rows:
        raise ValueError("Unable to create class_subject")
    return rows[0]


async def list_class_subjects(page: int, limit: int) -> tuple[list[dict], int]:
    supabase = SupabaseManager.get_client()
    start = (page - 1) * limit
    end = start + limit - 1
    query = supabase.table("class_subjects").select(SELECT_FIELDS, count="exact")
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.order("class_subject_id").range(start, end).execute())
    return response.data or [], int(response.count or 0)


async def update_class_subject_by_id(record_id: int, payload: dict) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = supabase.table("class_subjects").update(payload).eq("class_subject_id", record_id)
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.execute())
    rows = response.data or []
    return rows[0] if rows else None


async def soft_delete_class_subject_by_id(record_id: int) -> bool:
    supabase = SupabaseManager.get_client()
    query = supabase.table("class_subjects").update({"deleted_at": datetime.now(timezone.utc).isoformat()}).eq("class_subject_id", record_id)
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.execute())
    rows = response.data or []
    return len(rows) > 0
