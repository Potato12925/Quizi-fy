import asyncio
from datetime import datetime, timezone

from core.supabase import SupabaseManager


SELECT_FIELDS = "role_id,role_code,role_name"
HAS_DELETED = False


async def find_role_by_id(record_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = supabase.table("roles").select(SELECT_FIELDS).eq("role_id", record_id)
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.limit(1).execute())
    rows = response.data or []
    return rows[0] if rows else None


async def create_role_record(payload: dict) -> dict:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(lambda: supabase.table("roles").insert(payload).execute())
    rows = response.data or []
    if not rows:
        raise ValueError("Unable to create role")
    return rows[0]


async def list_roles(page: int, limit: int) -> tuple[list[dict], int]:
    supabase = SupabaseManager.get_client()
    start = (page - 1) * limit
    end = start + limit - 1
    query = supabase.table("roles").select(SELECT_FIELDS, count="exact")
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.order("role_id").range(start, end).execute())
    return response.data or [], int(response.count or 0)


async def update_role_by_id(record_id: int, payload: dict) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = supabase.table("roles").update(payload).eq("role_id", record_id)
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.execute())
    rows = response.data or []
    return rows[0] if rows else None


async def soft_delete_role_by_id(record_id: int) -> bool:
    supabase = SupabaseManager.get_client()
    query = supabase.table("roles").delete().eq("role_id", record_id)
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.execute())
    rows = response.data or []
    return len(rows) > 0
