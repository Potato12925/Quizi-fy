import asyncio

from core.supabase import SupabaseManager


SELECT_FIELDS = "document_topic_id,document_id,topic_id,created_at"
HAS_DELETED = False


async def find_document_topic_by_id(record_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = supabase.table("document_topics").select(SELECT_FIELDS).eq("document_topic_id", record_id)
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.limit(1).execute())
    rows = response.data or []
    return rows[0] if rows else None


async def create_document_topic_record(payload: dict) -> dict:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(lambda: supabase.table("document_topics").insert(payload).execute())
    rows = response.data or []
    if not rows:
        raise ValueError("Unable to create document_topic")
    return rows[0]


async def list_document_topics(page: int, limit: int) -> tuple[list[dict], int]:
    supabase = SupabaseManager.get_client()
    start = (page - 1) * limit
    end = start + limit - 1
    query = supabase.table("document_topics").select(SELECT_FIELDS, count="exact")
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.order("document_topic_id").range(start, end).execute())
    return response.data or [], int(response.count or 0)


async def update_document_topic_by_id(record_id: int, payload: dict) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = supabase.table("document_topics").update(payload).eq("document_topic_id", record_id)
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.execute())
    rows = response.data or []
    return rows[0] if rows else None


async def delete_document_topic_by_id(record_id: int) -> bool:
    supabase = SupabaseManager.get_client()
    query = supabase.table("document_topics").delete().eq("document_topic_id", record_id)
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.execute())
    rows = response.data or []
    return len(rows) > 0
