import asyncio
from datetime import datetime, timezone

from core.supabase import SupabaseManager


SELECT_FIELDS = "practice_set_id,student_id,subject_id,document_topic_id,difficulty,num_questions_requested,num_questions_actual,time_limit_minutes,prioritize_unanswered,created_at,deleted_at"
HAS_DELETED = True


async def find_practice_set_by_id(record_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = supabase.table("practice_sets").select(SELECT_FIELDS).eq("practice_set_id", record_id)
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.limit(1).execute())
    rows = response.data or []
    return rows[0] if rows else None


async def create_practice_set_record(payload: dict) -> dict:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(lambda: supabase.table("practice_sets").insert(payload).execute())
    rows = response.data or []
    if not rows:
        raise ValueError("Unable to create practice_set")
    return rows[0]


async def list_practice_sets(page: int, limit: int) -> tuple[list[dict], int]:
    supabase = SupabaseManager.get_client()
    start = (page - 1) * limit
    end = start + limit - 1
    query = supabase.table("practice_sets").select(SELECT_FIELDS, count="exact")
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.order("practice_set_id").range(start, end).execute())
    return response.data or [], int(response.count or 0)


async def update_practice_set_by_id(record_id: int, payload: dict) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = supabase.table("practice_sets").update(payload).eq("practice_set_id", record_id)
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.execute())
    rows = response.data or []
    return rows[0] if rows else None


async def soft_delete_practice_set_by_id(record_id: int) -> bool:
    supabase = SupabaseManager.get_client()
    query = (
        supabase.table("practice_sets")
        .update({"deleted_at": datetime.now(timezone.utc).isoformat()})
        .eq("practice_set_id", record_id)
    )
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.execute())
    rows = response.data or []
    return len(rows) > 0


async def find_practice_sets_with_subjects_by_student(student_id: int) -> list[dict]:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("practice_sets")
        .select("practice_set_id, subjects(subject_name)")
        .eq("student_id", student_id)
        .is_("deleted_at", None)
        .execute()
    )
    return response.data or []
