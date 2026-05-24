import asyncio
from datetime import datetime, timezone

from core.supabase import SupabaseManager


CLASS_SELECT_FIELDS = "class_id,class_code,class_name,owner_id,status"


async def find_class_by_id(class_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("classes")
        .select(CLASS_SELECT_FIELDS)
        .eq("class_id", class_id)
        .is_("deleted_at", None)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


async def find_class_by_code(class_code: str) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("classes")
        .select(CLASS_SELECT_FIELDS)
        .eq("class_code", class_code)
        .is_("deleted_at", None)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


async def create_class_record(payload: dict) -> dict:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("classes")
        .insert(payload)
        .execute()
    )
    rows = response.data or []
    if not rows:
        raise ValueError("Unable to create class")
    return rows[0]


async def list_classes(page: int, limit: int) -> tuple[list[dict], int]:
    supabase = SupabaseManager.get_client()
    start = (page - 1) * limit
    end = start + limit - 1

    response = await asyncio.to_thread(
        lambda: supabase.table("classes")
        .select(CLASS_SELECT_FIELDS, count="exact")
        .is_("deleted_at", None)
        .order("class_id")
        .range(start, end)
        .execute()
    )
    return response.data or [], int(response.count or 0)


async def update_class_by_id(class_id: int, payload: dict) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("classes")
        .update(payload)
        .eq("class_id", class_id)
        .is_("deleted_at", None)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


async def soft_delete_class_by_id(class_id: int) -> bool:
    supabase = SupabaseManager.get_client()
    payload = {"deleted_at": datetime.now(timezone.utc).isoformat()}

    response = await asyncio.to_thread(
        lambda: supabase.table("classes")
        .update(payload)
        .eq("class_id", class_id)
        .is_("deleted_at", None)
        .execute()
    )
    rows = response.data or []
    return len(rows) > 0

