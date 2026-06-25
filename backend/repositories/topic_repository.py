import asyncio
from datetime import datetime, timezone

from core.supabase import SupabaseManager


SELECT_FIELDS = (
    "topic_id,topic_name,description,class_subject_id,created_at,updated_at,deleted_at,"
    "class_subjects!inner(class_subject_id,class_id,subject_id,assigned_teacher_id,"
    "classes!inner(class_id,class_code,class_name),subjects!inner(subject_id,subject_code,subject_name))"
)


async def find_topic_by_id(record_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = supabase.table("topics").select(SELECT_FIELDS).eq("topic_id", record_id).is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.limit(1).execute())
    rows = response.data or []
    return rows[0] if rows else None


async def find_topic_by_name_and_class_subject(topic_name: str, class_subject_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("topics")
        .select(SELECT_FIELDS)
        .eq("topic_name", topic_name)
        .eq("class_subject_id", class_subject_id)
        .is_("deleted_at", None)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


async def create_topic_record(payload: dict) -> dict:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(lambda: supabase.table("topics").insert(payload).execute())
    rows = response.data or []
    if not rows:
        raise ValueError("Unable to create topic")
    return rows[0]


async def list_topics(
    page: int,
    limit: int,
    class_subject_id: int | None = None,
    subject_id: int | None = None,
) -> tuple[list[dict], int]:
    supabase = SupabaseManager.get_client()
    start = (page - 1) * limit
    end = start + limit - 1
    query = supabase.table("topics").select(SELECT_FIELDS, count="exact").is_("deleted_at", None)
    if class_subject_id is not None:
        query = query.eq("class_subject_id", class_subject_id)
    if subject_id is not None:
        query = query.eq("class_subjects.subject_id", subject_id)
    response = await asyncio.to_thread(lambda: query.order("topic_id").range(start, end).execute())
    return response.data or [], int(response.count or 0)


async def list_topics_by_class_subject_ids(
    page: int,
    limit: int,
    class_subject_ids: list[int],
    subject_id: int | None = None,
) -> tuple[list[dict], int]:
    if not class_subject_ids:
        return [], 0
    supabase = SupabaseManager.get_client()
    start = (page - 1) * limit
    end = start + limit - 1
    query = (
        supabase.table("topics")
        .select(SELECT_FIELDS, count="exact")
        .in_("class_subject_id", class_subject_ids)
        .is_("deleted_at", None)
    )
    if subject_id is not None:
        query = query.eq("class_subjects.subject_id", subject_id)
    response = await asyncio.to_thread(lambda: query.order("topic_id").range(start, end).execute())
    return response.data or [], int(response.count or 0)


async def list_assigned_class_subject_ids_by_teacher(teacher_id: int) -> list[int]:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("class_subjects")
        .select("class_subject_id")
        .eq("assigned_teacher_id", teacher_id)
        .eq("status", "active")
        .is_("deleted_at", None)
        .execute()
    )
    rows = response.data or []
    return sorted({int(item["class_subject_id"]) for item in rows if item.get("class_subject_id") is not None})


async def update_topic_by_id(record_id: int, payload: dict) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = supabase.table("topics").update(payload).eq("topic_id", record_id).is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.execute())
    rows = response.data or []
    return rows[0] if rows else None


async def soft_delete_topic_by_id(record_id: int) -> bool:
    supabase = SupabaseManager.get_client()
    query = (
        supabase.table("topics")
        .update({"deleted_at": datetime.now(timezone.utc).isoformat()})
        .eq("topic_id", record_id)
        .is_("deleted_at", None)
    )
    response = await asyncio.to_thread(lambda: query.execute())
    rows = response.data or []
    return len(rows) > 0
