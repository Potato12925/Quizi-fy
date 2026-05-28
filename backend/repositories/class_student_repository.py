import asyncio
from datetime import datetime, timezone

from core.supabase import SupabaseManager


SELECT_FIELDS = "class_student_id,class_id,student_id"
HAS_DELETED = True


async def find_class_student_by_id(record_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = supabase.table("class_students").select(SELECT_FIELDS).eq("class_student_id", record_id)
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.limit(1).execute())
    rows = response.data or []
    return rows[0] if rows else None


async def list_my_classes(student_id: int) -> list[dict]:
    supabase = SupabaseManager.get_client()
    query = supabase.table("class_students").select("class_id, classes(*)")
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.eq("student_id", student_id).execute())
    return response.data or []

async def create_class_student_record(payload: dict) -> dict:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(lambda: supabase.table("class_students").insert(payload).execute())
    rows = response.data or []
    if not rows:
        raise ValueError("Unable to create class_student")
    return rows[0]


async def list_class_students(page: int, limit: int) -> tuple[list[dict], int]:
    supabase = SupabaseManager.get_client()
    start = (page - 1) * limit
    end = start + limit - 1
    query = supabase.table("class_students").select(SELECT_FIELDS, count="exact")
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.order("class_student_id").range(start, end).execute())
    return response.data or [], int(response.count or 0)


async def update_class_student_by_id(record_id: int, payload: dict) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = supabase.table("class_students").update(payload).eq("class_student_id", record_id)
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.execute())
    rows = response.data or []
    return rows[0] if rows else None


async def soft_delete_class_student_by_id(record_id: int) -> bool:
    supabase = SupabaseManager.get_client()
    query = (
        supabase.table("class_students")
        .update({"deleted_at": datetime.now(timezone.utc).isoformat()})
        .eq("class_student_id", record_id)
    )
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.execute())
    rows = response.data or []
    return len(rows) > 0
