import asyncio
from datetime import datetime, timezone

from core.supabase import SupabaseManager


SELECT_FIELDS = "document_topic_id,document_id,topic_id,created_at,deleted_at"
HAS_DELETED = True


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
    existing_response = await asyncio.to_thread(
        lambda: supabase.table("document_topics")
        .select(SELECT_FIELDS)
        .eq("document_id", payload["document_id"])
        .eq("topic_id", payload["topic_id"])
        .limit(1)
        .execute()
    )
    existing_rows = existing_response.data or []
    if existing_rows:
        existing = existing_rows[0]
        if existing.get("deleted_at") is None:
            raise ValueError("DocumentTopic already exists")
        restore_response = await asyncio.to_thread(
            lambda: supabase.table("document_topics")
            .update({"deleted_at": None})
            .eq("document_topic_id", existing["document_topic_id"])
            .execute()
        )
        restored_rows = restore_response.data or []
        if restored_rows:
            return restored_rows[0]
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
    query = (
        supabase.table("document_topics")
        .update({"deleted_at": datetime.now(timezone.utc).isoformat()})
        .eq("document_topic_id", record_id)
    )
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.execute())
    rows = response.data or []
    return len(rows) > 0


async def list_by_document_id(document_id: int) -> list[dict]:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("document_topics")
        .select(
            "document_topic_id,document_id,topic_id,"
            "topics(topic_id,topic_name,class_subject_id,"
            "class_subjects(class_subject_id,class_id,subject_id,assigned_teacher_id,classes(class_id,class_name),subjects(subject_id,subject_name)))"
        )
        .eq("document_id", document_id)
        .is_("deleted_at", None)
        .order("document_topic_id")
        .execute()
    )
    return response.data or []


async def delete_by_document_id(document_id: int) -> None:
    supabase = SupabaseManager.get_client()
    await asyncio.to_thread(
        lambda: supabase.table("document_topics")
        .update({"deleted_at": datetime.now(timezone.utc).isoformat()})
        .eq("document_id", document_id)
        .is_("deleted_at", None)
        .execute()
    )


async def bulk_create_document_topics(document_id: int, topic_ids: list[int]) -> None:
    if not topic_ids:
        return
    supabase = SupabaseManager.get_client()
    normalized_topic_ids = sorted(set(topic_ids))
    await asyncio.to_thread(
        lambda: supabase.table("document_topics")
        .update({"deleted_at": None})
        .eq("document_id", document_id)
        .in_("topic_id", normalized_topic_ids)
        .execute()
    )
    existing_response = await asyncio.to_thread(
        lambda: supabase.table("document_topics")
        .select("topic_id")
        .eq("document_id", document_id)
        .is_("deleted_at", None)
        .in_("topic_id", normalized_topic_ids)
        .execute()
    )
    existing_topic_ids = {
        int(row["topic_id"])
        for row in (existing_response.data or [])
        if row.get("topic_id") is not None
    }
    payload = [
        {"document_id": document_id, "topic_id": topic_id}
        for topic_id in normalized_topic_ids
        if topic_id not in existing_topic_ids
    ]
    if not payload:
        return
    await asyncio.to_thread(
        lambda: supabase.table("document_topics")
        .insert(payload)
        .execute()
    )


async def replace_topics_for_document(document_id: int, topic_ids: list[int]) -> list[dict]:
    await delete_by_document_id(document_id)
    await bulk_create_document_topics(document_id, topic_ids)
    return await list_by_document_id(document_id)
