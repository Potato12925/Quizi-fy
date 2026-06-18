import asyncio
from datetime import datetime, timezone

from core.supabase import SupabaseManager


SELECT_FIELDS = "attempt_id,practice_set_id,started_at,submitted_at,score,total_correct,total_wrong,status,deleted_at"
HAS_DELETED = True


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
    attempt_resp = await asyncio.to_thread(
        lambda: supabase.table("practice_attempts")
        .select("*, practice_sets(*)")
        .eq("attempt_id", attempt_id)
        .is_("deleted_at", None)
        .limit(1)
        .execute()
    )
    if not attempt_resp.data:
        return None
    attempt = attempt_resp.data[0]
    
    answers_resp = await asyncio.to_thread(
        lambda: supabase.table("student_answers")
        .select("*, questions(question_id,content,explanation,image_id,question_options(*))")
        .eq("attempt_id", attempt_id)
        .is_("deleted_at", None)
        .execute()
    )
    
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
    query = (
        supabase.table("practice_attempts")
        .update({"deleted_at": datetime.now(timezone.utc).isoformat()})
        .eq("attempt_id", record_id)
    )
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.execute())
    rows = response.data or []
    return len(rows) > 0


async def find_submitted_attempts_by_practice_set_ids(ps_ids: list[int]) -> list[dict]:
    if not ps_ids:
        return []
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("practice_attempts")
        .select("attempt_id, practice_set_id, started_at, submitted_at, total_correct, total_wrong, score")
        .in_("practice_set_id", ps_ids)
        .eq("status", "submitted")
        .is_("deleted_at", None)
        .execute()
    )
    return response.data or []

async def find_all_student_history(student_id: int) -> list[dict]:
    supabase = SupabaseManager.get_client()
    
    ps_resp = await asyncio.to_thread(
        lambda: supabase.table("practice_sets")
        .select("practice_set_id, subjects(subject_name)")
        .eq("student_id", student_id)
        .is_("deleted_at", None)
        .execute()
    )
    
    ps_data = ps_resp.data or []
    if not ps_data:
        return []
    
    ps_ids = [ps["practice_set_id"] for ps in ps_data]
    ps_map = {ps["practice_set_id"]: ps["subjects"]["subject_name"] if ps.get("subjects") else "Unknown" for ps in ps_data}
    
    attempts_resp = await asyncio.to_thread(
        lambda: supabase.table("practice_attempts")
        .select("*")
        .in_("practice_set_id", ps_ids)
        .is_("deleted_at", None)
        .order("started_at", desc=True)
        .execute()
    )
    attempts = attempts_resp.data or []
    
    for attempt in attempts:
        attempt["subject_name"] = ps_map.get(attempt["practice_set_id"], "Unknown")
        
    return attempts
