import asyncio
from datetime import datetime, timezone

from core.supabase import SupabaseManager


SELECT_FIELDS = "topic_id,subject_id,topic_name"
HAS_DELETED = false


async def find_topic_by_id(record_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = supabase.table("topics").select(SELECT_FIELDS).eq("topic_id", record_id)
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.limit(1).execute())
    rows = response.data or []
    return rows[0] if rows else None


async def create_topic_record(payload: dict) -> dict:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(lambda: supabase.table("topics").insert(payload).execute())
    rows = response.data or []
    if not rows:
        raise ValueError("Unable to create topic")
    return rows[0]


async def list_topics(page: int, limit: int) -> tuple[list[dict], int]:
    supabase = SupabaseManager.get_client()
    start = (page - 1) * limit
    end = start + limit - 1
    query = supabase.table("topics").select(SELECT_FIELDS, count="exact")
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.order("topic_id").range(start, end).execute())
    return response.data or [], int(response.count or 0)


async def update_topic_by_id(record_id: int, payload: dict) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = supabase.table("topics").update(payload).eq("topic_id", record_id)
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.execute())
    rows = response.data or []
    return rows[0] if rows else None


async def soft_delete_topic_by_id(record_id: int) -> bool:
    supabase = SupabaseManager.get_client()
    query = supabase.table("topics").delete().eq("topic_id", record_id)
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.execute())
    rows = response.data or []
    return len(rows) > 0
