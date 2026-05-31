import asyncio

from core.supabase import SupabaseManager


SELECT_FIELDS = "notification_id,user_id,title,content,is_read,created_at"
HAS_DELETED = False


async def find_notification_by_id(record_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = supabase.table("notifications").select(SELECT_FIELDS).eq("notification_id", record_id)
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.limit(1).execute())
    rows = response.data or []
    return rows[0] if rows else None


async def create_notification_record(payload: dict) -> dict:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(lambda: supabase.table("notifications").insert(payload).execute())
    rows = response.data or []
    if not rows:
        raise ValueError("Unable to create notification")
    return rows[0]


async def list_notifications(page: int, limit: int) -> tuple[list[dict], int]:
    supabase = SupabaseManager.get_client()
    start = (page - 1) * limit
    end = start + limit - 1
    query = supabase.table("notifications").select(SELECT_FIELDS, count="exact")
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.order("notification_id", desc=True).range(start, end).execute())
    return response.data or [], int(response.count or 0)


async def list_notifications_by_user(user_id: int, page: int, limit: int) -> tuple[list[dict], int]:
    supabase = SupabaseManager.get_client()
    start = (page - 1) * limit
    end = start + limit - 1
    query = supabase.table("notifications").select(SELECT_FIELDS, count="exact").eq("user_id", user_id)
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.order("notification_id", desc=True).range(start, end).execute())
    return response.data or [], int(response.count or 0)


async def count_unread_notifications_by_user(user_id: int) -> int:
    supabase = SupabaseManager.get_client()
    query = (
        supabase.table("notifications")
        .select("notification_id", count="exact")
        .eq("user_id", user_id)
        .eq("is_read", False)
    )
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.execute())
    return int(response.count or 0)


async def update_notification_by_id(record_id: int, payload: dict) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = supabase.table("notifications").update(payload).eq("notification_id", record_id)
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.execute())
    rows = response.data or []
    return rows[0] if rows else None


async def soft_delete_notification_by_id(record_id: int) -> bool:
    supabase = SupabaseManager.get_client()
    query = supabase.table("notifications").delete().eq("notification_id", record_id)
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.execute())
    rows = response.data or []
    return len(rows) > 0


async def mark_notification_read_by_id_and_user(record_id: int, user_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = (
        supabase.table("notifications")
        .update({"is_read": True})
        .eq("notification_id", record_id)
        .eq("user_id", user_id)
    )
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.execute())
    rows = response.data or []
    return rows[0] if rows else None


async def mark_all_notifications_read_by_user(user_id: int) -> int:
    supabase = SupabaseManager.get_client()
    query = supabase.table("notifications").update({"is_read": True}).eq("user_id", user_id).eq("is_read", False)
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.execute())
    rows = response.data or []
    return len(rows)
