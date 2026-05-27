import asyncio
from datetime import datetime, timezone

from core.supabase import SupabaseManager


SELECT_FIELDS = "attempt_id,practice_set_id,started_at,submitted_at,score,total_correct,total_wrong,status"
HAS_DELETED = False


async def find_practice_attempt_by_id(record_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = supabase.table("practice_attempts").select(SELECT_FIELDS).eq("attempt_id", record_id)
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.limit(1).execute())
    rows = response.data or []
    return rows[0] if rows else None


async def create_practice_attempt_record(payload: dict) -> dict:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(lambda: supabase.table("practice_attempts").insert(payload).execute())
    rows = response.data or []
    if not rows:
        raise ValueError("Unable to create practice_attempt")
    return rows[0]


async def get_attempt_result_details(attempt_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    attempt_resp = await asyncio.to_thread(lambda: supabase.table("practice_attempts").select("*, practice_sets(*)").eq("attempt_id", attempt_id).limit(1).execute())
    if not attempt_resp.data:
        return None
    attempt = attempt_resp.data[0]
    
    answers_resp = await asyncio.to_thread(lambda: supabase.table("student_answers").select("*, questions(*, question_options(*))").eq("attempt_id", attempt_id).execute())
    
    return {
        "attempt": attempt,
        "answers": answers_resp.data or []
    }

async def list_practice_attempts(page: int, limit: int) -> tuple[list[dict], int]:
    supabase = SupabaseManager.get_client()
    start = (page - 1) * limit
    end = start + limit - 1
    query = supabase.table("practice_attempts").select(SELECT_FIELDS, count="exact")
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.order("attempt_id").range(start, end).execute())
    return response.data or [], int(response.count or 0)


async def update_practice_attempt_by_id(record_id: int, payload: dict) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = supabase.table("practice_attempts").update(payload).eq("attempt_id", record_id)
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.execute())
    rows = response.data or []
    return rows[0] if rows else None


async def soft_delete_practice_attempt_by_id(record_id: int) -> bool:
    supabase = SupabaseManager.get_client()
    query = supabase.table("practice_attempts").update({"status": "inactive"}).eq("attempt_id", record_id)
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.execute())
    rows = response.data or []
    return len(rows) > 0
