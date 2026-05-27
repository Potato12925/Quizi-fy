import asyncio
from datetime import datetime, timezone

from core.supabase import SupabaseManager


async def list_teacher_documents_with_subjects(teacher_id: int) -> list[dict]:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("documents")
        .select("document_id,title")
        .eq("teacher_id", teacher_id)
        .is_("deleted_at", None)
        .order("document_id")
        .execute()
    )
    return response.data or []


async def list_document_topics_with_topic(document_ids: list[int]) -> list[dict]:
    if not document_ids:
        return []
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("document_topics")
        .select("document_topic_id,document_id,topic_id,topics(topic_id,topic_name,subject_id,subjects(subject_id,subject_name))")
        .in_("document_id", document_ids)
        .order("document_topic_id")
        .execute()
    )
    return response.data or []


async def find_teacher_document(document_id: int, teacher_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("documents")
        .select("document_id,teacher_id,title")
        .eq("document_id", document_id)
        .eq("teacher_id", teacher_id)
        .is_("deleted_at", None)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


async def get_subject_ids_of_document(document_id: int) -> list[int]:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("document_topics")
        .select("topics!inner(subject_id)")
        .eq("document_id", document_id)
        .execute()
    )
    rows = response.data or []
    return sorted({int(row["topics"]["subject_id"]) for row in rows if row.get("topics") and row["topics"].get("subject_id") is not None})


async def find_topic_by_name_and_subject(topic_name: str, subject_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("topics")
        .select("topic_id,topic_name,subject_id,updated_at")
        .eq("topic_name", topic_name)
        .eq("subject_id", subject_id)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


async def create_topic(topic_name: str, subject_id: int) -> dict:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("topics")
        .insert({"topic_name": topic_name, "subject_id": subject_id})
        .execute()
    )
    rows = response.data or []
    if not rows:
        raise ValueError("Unable to create topic")
    return rows[0]


async def find_document_topic_relation(document_id: int, topic_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("document_topics")
        .select("document_topic_id,document_id,topic_id")
        .eq("document_id", document_id)
        .eq("topic_id", topic_id)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


async def create_document_topic_relation(document_id: int, topic_id: int) -> dict:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("document_topics")
        .insert({"document_id": document_id, "topic_id": topic_id})
        .execute()
    )
    rows = response.data or []
    if not rows:
        raise ValueError("Unable to add topic to document")
    return rows[0]


async def teacher_has_topic(topic_id: int, teacher_id: int) -> bool:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("document_topics")
        .select("document_topic_id,documents!inner(document_id,teacher_id,deleted_at)")
        .eq("topic_id", topic_id)
        .eq("documents.teacher_id", teacher_id)
        .is_("documents.deleted_at", None)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    return len(rows) > 0


async def find_topic_by_id(topic_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("topics")
        .select("topic_id,topic_name,subject_id,updated_at")
        .eq("topic_id", topic_id)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


async def update_topic_name(topic_id: int, topic_name: str) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("topics")
        .update({"topic_name": topic_name, "updated_at": datetime.now(timezone.utc).isoformat()})
        .eq("topic_id", topic_id)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


async def delete_document_topic_relation(document_id: int, topic_id: int) -> bool:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("document_topics")
        .delete()
        .eq("document_id", document_id)
        .eq("topic_id", topic_id)
        .execute()
    )
    rows = response.data or []
    return len(rows) > 0
