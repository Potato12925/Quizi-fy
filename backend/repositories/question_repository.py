import asyncio
from datetime import datetime, timezone

from core.supabase import SupabaseManager


SELECT_FIELDS = "question_id,teacher_id,topic_id,ai_request_id,image_id,content,difficulty,source,status,explanation"
HAS_DELETED = True


async def find_question_by_id(record_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = supabase.table("questions").select(SELECT_FIELDS).eq("question_id", record_id)
    if HAS_DELETED:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.limit(1).execute())
    rows = response.data or []
    return rows[0] if rows else None


async def get_random_question_ids(
    subject_id: int,
    topic_id: int | None,
    difficulty: str | None,
    limit: int,
    class_id: int | None = None
) -> list[int]:
    """Lay ngau nhien dung so cau, dung lop, dung mon, chi cau da approved.

    Truy van 3 buoc phang de tranh nested filter sau khong on dinh:
    1. Tim class_subject_id theo (subject_id, class_id).
    2. Tim danh sach topic_id thuoc class_subject do.
    3. Lay cau hoi approved theo topic (va difficulty neu co), boc ngau nhien limit cau.
    """
    supabase = SupabaseManager.get_client()

    # --- Buoc 1: xac dinh class_subject_id theo mon + lop ---
    cs_query = (
        supabase.table("class_subjects")
        .select("class_subject_id")
        .eq("subject_id", subject_id)
        .eq("status", "active")
    )
    if HAS_DELETED:
        cs_query = cs_query.is_("deleted_at", None)
    if class_id is not None:
        cs_query = cs_query.eq("class_id", class_id)
    cs_resp = await asyncio.to_thread(lambda: cs_query.limit(1).execute())
    cs_rows = cs_resp.data or []
    if not cs_rows:
        return []
    class_subject_id = cs_rows[0]["class_subject_id"]

    # --- Buoc 2: tim topic_id thuoc class_subject ---
    topic_query = (
        supabase.table("topics")
        .select("topic_id")
        .eq("class_subject_id", class_subject_id)
    )
    if HAS_DELETED:
        topic_query = topic_query.is_("deleted_at", None)
    topic_resp = await asyncio.to_thread(lambda: topic_query.execute())
    topic_ids = [t["topic_id"] for t in (topic_resp.data or [])]
    if not topic_ids:
        return []

    # Ne neu caller chi dinh topic cu the, chi giu topic do (phai thuoc class_subject)
    if topic_id is not None:
        if topic_id not in topic_ids:
            return []
        topic_ids = [topic_id]

    # --- Buoc 3: lay cau hoi approved theo topic (+ difficulty) ---
    question_query = (
        supabase.table("questions")
        .select("question_id")
        .eq("status", "approved")
        .in_("topic_id", topic_ids)
    )
    if HAS_DELETED:
        question_query = question_query.is_("deleted_at", None)
    if difficulty and difficulty != "mix":
        question_query = question_query.eq("difficulty", difficulty)

    question_resp = await asyncio.to_thread(lambda: question_query.execute())
    questions = question_resp.data or []
    if not questions:
        return []

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
