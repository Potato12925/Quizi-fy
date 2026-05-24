import asyncio
from datetime import datetime, timezone

from core.supabase import SupabaseManager


SELECT_FIELDS = "request_id,teacher_id,document_id,num_questions,difficulty,status,generated_question_count,retry_count"
HAS_DELETED = false


async def find_ai_request_by_id(record_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = supabase.table("ai_requests").select(SELECT_FIELDS).eq("request_id", record_id)
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.limit(1).execute())
    rows = response.data or []
    return rows[0] if rows else None


async def create_ai_request_record(payload: dict) -> dict:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(lambda: supabase.table("ai_requests").insert(payload).execute())
    rows = response.data or []
    if not rows:
        raise ValueError("Unable to create ai_request")
    return rows[0]


async def list_ai_requests(page: int, limit: int) -> tuple[list[dict], int]:
    supabase = SupabaseManager.get_client()
    start = (page - 1) * limit
    end = start + limit - 1
    query = supabase.table("ai_requests").select(SELECT_FIELDS, count="exact")
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.order("request_id").range(start, end).execute())
    return response.data or [], int(response.count or 0)


async def update_ai_request_by_id(record_id: int, payload: dict) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = supabase.table("ai_requests").update(payload).eq("request_id", record_id)
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.execute())
    rows = response.data or []
    return rows[0] if rows else None


async def soft_delete_ai_request_by_id(record_id: int) -> bool:
    supabase = SupabaseManager.get_client()
    query = supabase.table("ai_requests").update({"status": "inactive"}).eq("request_id", record_id)
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.execute())
    rows = response.data or []
    return len(rows) > 0
