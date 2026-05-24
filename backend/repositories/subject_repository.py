import asyncio
from datetime import datetime, timezone

from core.supabase import SupabaseManager


SUBJECT_SELECT_FIELDS = "subject_id,subject_code,subject_name,status"


async def find_subject_by_id(subject_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("subjects")
        .select(SUBJECT_SELECT_FIELDS)
        .eq("subject_id", subject_id)
        .is_("deleted_at", None)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


async def find_subject_by_code(subject_code: str) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("subjects")
        .select(SUBJECT_SELECT_FIELDS)
        .eq("subject_code", subject_code)
        .is_("deleted_at", None)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


async def create_subject_record(payload: dict) -> dict:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("subjects")
        .insert(payload)
        .execute()
    )
    rows = response.data or []
    if not rows:
        raise ValueError("Unable to create subject")
    return rows[0]


async def list_subjects(page: int, limit: int) -> tuple[list[dict], int]:
    supabase = SupabaseManager.get_client()
    start = (page - 1) * limit
    end = start + limit - 1

    response = await asyncio.to_thread(
        lambda: supabase.table("subjects")
        .select(SUBJECT_SELECT_FIELDS, count="exact")
        .is_("deleted_at", None)
        .order("subject_id")
        .range(start, end)
        .execute()
    )
    return response.data or [], int(response.count or 0)


async def update_subject_by_id(subject_id: int, payload: dict) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("subjects")
        .update(payload)
        .eq("subject_id", subject_id)
        .is_("deleted_at", None)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


async def soft_delete_subject_by_id(subject_id: int) -> bool:
    supabase = SupabaseManager.get_client()
    payload = {"deleted_at": datetime.now(timezone.utc).isoformat()}

    response = await asyncio.to_thread(
        lambda: supabase.table("subjects")
        .update(payload)
        .eq("subject_id", subject_id)
        .is_("deleted_at", None)
        .execute()
    )
    rows = response.data or []
    return len(rows) > 0

