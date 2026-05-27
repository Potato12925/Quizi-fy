import asyncio
from datetime import datetime, timezone

from core.supabase import SupabaseManager


SELECT_FIELDS = "answer_id,attempt_id,question_id,selected_option_id,is_correct,answered_at"
HAS_DELETED = False


async def find_student_answer_by_id(record_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = supabase.table("student_answers").select(SELECT_FIELDS).eq("answer_id", record_id)
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.limit(1).execute())
    rows = response.data or []
    return rows[0] if rows else None


async def create_student_answer_record(payload: dict) -> dict:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(lambda: supabase.table("student_answers").insert(payload).execute())
    rows = response.data or []
    if not rows:
        raise ValueError("Unable to create student_answer")
    return rows[0]


async def upsert_student_answers(payloads: list[dict]) -> list[dict]:
    if not payloads:
        return []
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(lambda: supabase.table("student_answers").upsert(payloads, on_conflict="attempt_id,question_id").execute())
    return response.data or []

async def list_student_answers(page: int, limit: int) -> tuple[list[dict], int]:
    supabase = SupabaseManager.get_client()
    start = (page - 1) * limit
    end = start + limit - 1
    query = supabase.table("student_answers").select(SELECT_FIELDS, count="exact")
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.order("answer_id").range(start, end).execute())
    return response.data or [], int(response.count or 0)


async def update_student_answer_by_id(record_id: int, payload: dict) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = supabase.table("student_answers").update(payload).eq("answer_id", record_id)
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.execute())
    rows = response.data or []
    return rows[0] if rows else None


async def soft_delete_student_answer_by_id(record_id: int) -> bool:
    supabase = SupabaseManager.get_client()
    query = supabase.table("student_answers").delete().eq("answer_id", record_id)
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.execute())
    rows = response.data or []
    return len(rows) > 0
