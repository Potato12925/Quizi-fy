import asyncio
from datetime import datetime, timezone

from core.supabase import SupabaseManager


SELECT_FIELDS = "practice_set_question_id,practice_set_id,question_id,order_num"
HAS_DELETED = False


async def find_practice_set_question_by_id(record_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = supabase.table("practice_set_questions").select(SELECT_FIELDS).eq("practice_set_question_id", record_id)
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.limit(1).execute())
    rows = response.data or []
    return rows[0] if rows else None


async def create_practice_set_question_record(payload: dict) -> dict:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(lambda: supabase.table("practice_set_questions").insert(payload).execute())
    rows = response.data or []
    if not rows:
        raise ValueError("Unable to create practice_set_question")
    return rows[0]


async def list_practice_set_questions(page: int, limit: int) -> tuple[list[dict], int]:
    supabase = SupabaseManager.get_client()
    start = (page - 1) * limit
    end = start + limit - 1
    query = supabase.table("practice_set_questions").select(SELECT_FIELDS, count="exact")
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.order("practice_set_question_id").range(start, end).execute())
    return response.data or [], int(response.count or 0)


async def update_practice_set_question_by_id(record_id: int, payload: dict) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = supabase.table("practice_set_questions").update(payload).eq("practice_set_question_id", record_id)
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.execute())
    rows = response.data or []
    return rows[0] if rows else None


async def soft_delete_practice_set_question_by_id(record_id: int) -> bool:
    supabase = SupabaseManager.get_client()
    query = supabase.table("practice_set_questions").delete().eq("practice_set_question_id", record_id)
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.execute())
    rows = response.data or []
    return len(rows) > 0
