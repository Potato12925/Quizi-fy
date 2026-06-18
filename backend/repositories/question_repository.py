import asyncio
from datetime import datetime, timezone

from core.supabase import SupabaseManager


SELECT_FIELDS = "question_id,teacher_id,document_topic_id,ai_request_id,image_id,content,difficulty,source,status,explanation"
HAS_DELETED = True


async def find_question_by_id(record_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = supabase.table("questions").select(SELECT_FIELDS).eq("question_id", record_id)
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.limit(1).execute())
    rows = response.data or []
    return rows[0] if rows else None


async def get_random_question_ids(subject_id: int, document_topic_id: int | None, difficulty: str | None, limit: int) -> list[int]:
    supabase = SupabaseManager.get_client()
    query = (
        supabase.table("questions")
        .select("question_id, document_topics!inner(topics!inner(class_subjects!inner(subject_id)))")
        .eq("status", "approved")
        .eq("document_topics.topics.class_subjects.subject_id", subject_id)
    )
    if document_topic_id:
        query = query.eq("document_topic_id", document_topic_id)
    if difficulty and difficulty != "mix":
        query = query.eq("difficulty", difficulty)
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    
    response = await asyncio.to_thread(lambda: query.execute())
    questions = response.data or []
    
    import random
    random.shuffle(questions)
    
    return [q["question_id"] for q in questions[:limit]]

async def create_question_record(payload: dict) -> dict:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(lambda: supabase.table("questions").insert(payload).execute())
    rows = response.data or []
    if not rows:
        raise ValueError("Unable to create question")
    return rows[0]


async def list_questions(page: int, limit: int) -> tuple[list[dict], int]:
    supabase = SupabaseManager.get_client()
    start = (page - 1) * limit
    end = start + limit - 1
    query = supabase.table("questions").select(SELECT_FIELDS, count="exact")
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.order("question_id").range(start, end).execute())
    return response.data or [], int(response.count or 0)


async def update_question_by_id(record_id: int, payload: dict) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = supabase.table("questions").update(payload).eq("question_id", record_id)
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.execute())
    rows = response.data or []
    return rows[0] if rows else None


async def soft_delete_question_by_id(record_id: int) -> bool:
    supabase = SupabaseManager.get_client()
    query = supabase.table("questions").update({"deleted_at": datetime.now(timezone.utc).isoformat()}).eq("question_id", record_id)
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.execute())
    rows = response.data or []
    return len(rows) > 0
