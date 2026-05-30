import asyncio
from datetime import datetime, timezone

from core.supabase import SupabaseManager


SUBJECT_SELECT_FIELDS = "subject_id,subject_code,subject_name,description,status,created_at, updated_at, deleted_at"


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


async def find_subject_by_code_excluding_id(subject_code: str, subject_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("subjects")
        .select(SUBJECT_SELECT_FIELDS)
        .eq("subject_code", subject_code)
        .neq("subject_id", subject_id)
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


def _apply_subject_filters(query, search: str | None, status: str):
    if status in {"active", "inactive"}:
        query = query.eq("status", status)
    if search:
        search_text = search.strip()
        if search_text:
            query = query.or_(f"subject_code.ilike.%{search_text}%,subject_name.ilike.%{search_text}%")
    return query


async def list_subjects(
    page: int,
    limit: int,
    search: str | None = None,
    status: str = "all",
    sort_by: str = "created_at",
    sort_order: str = "desc",
) -> tuple[list[dict], int]:
    supabase = SupabaseManager.get_client()
    start = (page - 1) * limit
    end = start + limit - 1

    query = supabase.table("subjects").select(SUBJECT_SELECT_FIELDS, count="exact").is_("deleted_at", None)
    query = _apply_subject_filters(query, search=search, status=status)
    response = await asyncio.to_thread(
        lambda: query.order(sort_by, desc=sort_order == "desc").range(start, end).execute()
    )
    return response.data or [], int(response.count or 0)


async def list_subjects_by_teacher(
    page: int,
    limit: int,
    teacher_id: int,
    search: str | None = None,
    status: str = "all",
    sort_by: str = "created_at",
    sort_order: str = "desc",
) -> tuple[list[dict], int]:
    supabase = SupabaseManager.get_client()
    start = (page - 1) * limit
    end = start + limit - 1

    class_subjects_response = await asyncio.to_thread(
        lambda: supabase.table("class_subjects")
        .select("subject_id")
        .eq("assigned_teacher_id", teacher_id)
        .eq("status", "active")
        .is_("deleted_at", None)
        .execute()
    )
    subject_ids = sorted({item["subject_id"] for item in (class_subjects_response.data or [])})
    if not subject_ids:
        return [], 0

    query = supabase.table("subjects").select(SUBJECT_SELECT_FIELDS, count="exact").in_("subject_id", subject_ids).is_(
        "deleted_at", None
    )
    query = _apply_subject_filters(query, search=search, status=status)
    response = await asyncio.to_thread(
        lambda: query.order(sort_by, desc=sort_order == "desc").range(start, end).execute()
    )
    return response.data or [], int(response.count or 0)


async def is_teacher_assigned_to_subject(subject_id: int, teacher_id: int) -> bool:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("class_subjects")
        .select("class_subject_id")
        .eq("subject_id", subject_id)
        .eq("assigned_teacher_id", teacher_id)
        .eq("status", "active")
        .is_("deleted_at", None)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    return len(rows) > 0


async def list_assigned_subject_ids_by_teacher(teacher_id: int) -> list[int]:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("class_subjects")
        .select("subject_id")
        .eq("assigned_teacher_id", teacher_id)
        .eq("status", "active")
        .is_("deleted_at", None)
        .execute()
    )
    rows = response.data or []
    return sorted({int(item["subject_id"]) for item in rows if item.get("subject_id") is not None})


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
