import asyncio
from datetime import datetime, timezone

from core.supabase import SupabaseManager


QUESTION_SELECT = "question_id,teacher_id,document_topic_id,content,difficulty,source,status,explanation,created_at,updated_at,question_options(option_id,option_label,option_text,is_correct,order_num)"


async def list_teacher_document_topic_options(
    teacher_id: int, class_subject_id: int | None = None, subject_id: int | None = None, topic_id: int | None = None
) -> list[dict]:
    supabase = SupabaseManager.get_client()
    query = (
        supabase.table("document_topics")
        .select(
            "document_topic_id,document_id,topic_id,"
            "documents!inner(document_id,title,file_type,file_size,status,created_at,teacher_id,deleted_at),"
            "topics!inner(topic_id,topic_name,class_subject_id,deleted_at,"
            "class_subjects!inner(class_subject_id,class_id,subject_id,assigned_teacher_id,status,deleted_at,"
            "classes!inner(class_id,class_name,status,deleted_at),subjects!inner(subject_id,subject_name,status,deleted_at)))"
        )
        .eq("documents.teacher_id", teacher_id)
        .eq("documents.status", "active")
        .is_("documents.deleted_at", None)
        .is_("topics.deleted_at", None)
        .eq("topics.class_subjects.subjects.status", "active")
        .is_("topics.class_subjects.subjects.deleted_at", None)
    )
    if class_subject_id is not None:
        query = query.eq("topics.class_subject_id", class_subject_id)
    if subject_id is not None:
        query = query.eq("topics.class_subjects.subject_id", subject_id)
    if topic_id is not None:
        query = query.eq("topic_id", topic_id)
    response = await asyncio.to_thread(lambda: query.order("document_topic_id", desc=True).execute())
    return response.data or []


async def list_teacher_questions(
    teacher_id: int,
    document_topic_ids: list[int],
    page: int,
    limit: int,
    difficulty: str | None = None,
    status: str | None = None,
    source: str | None = None,
    keyword: str | None = None,
) -> tuple[list[dict], int]:
    if not document_topic_ids:
        return [], 0

    supabase = SupabaseManager.get_client()
    start = (page - 1) * limit
    end = start + limit - 1

    query = (
        supabase.table("questions")
        .select(QUESTION_SELECT, count="exact")
        .eq("teacher_id", teacher_id)
        .in_("document_topic_id", document_topic_ids)
        .is_("deleted_at", None)
    )

    if difficulty:
        query = query.eq("difficulty", difficulty)
    if status:
        query = query.eq("status", status)
    if source:
        query = query.eq("source", source)
    if keyword:
        query = query.ilike("content", f"%{keyword}%")

    response = await asyncio.to_thread(lambda: query.order("question_id", desc=True).range(start, end).execute())
    return response.data or [], int(response.count or 0)


async def find_teacher_question_by_id(question_id: int, teacher_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("questions")
        .select(QUESTION_SELECT)
        .eq("question_id", question_id)
        .eq("teacher_id", teacher_id)
        .is_("deleted_at", None)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


async def create_question_record(payload: dict) -> dict:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(lambda: supabase.table("questions").insert(payload).execute())
    rows = response.data or []
    if not rows:
        raise ValueError("Unable to create question")
    return rows[0]


async def update_question_record(question_id: int, teacher_id: int, payload: dict) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("questions")
        .update(payload)
        .eq("question_id", question_id)
        .eq("teacher_id", teacher_id)
        .is_("deleted_at", None)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


async def soft_delete_question_record(question_id: int, teacher_id: int) -> bool:
    supabase = SupabaseManager.get_client()
    payload = {
        "deleted_at": datetime.now(timezone.utc).isoformat(),
        "status": "inactive",
    }
    response = await asyncio.to_thread(
        lambda: supabase.table("questions")
        .update(payload)
        .eq("question_id", question_id)
        .eq("teacher_id", teacher_id)
        .is_("deleted_at", None)
        .execute()
    )
    return bool(response.data)


async def replace_question_options(question_id: int, options: list[str], correct_option_index: int) -> None:
    supabase = SupabaseManager.get_client()
    await asyncio.to_thread(lambda: supabase.table("question_options").delete().eq("question_id", question_id).execute())

    payload = []
    labels = ["A", "B", "C", "D", "E", "F"]
    for idx, option_text in enumerate(options):
        payload.append(
            {
                "question_id": question_id,
                "option_label": labels[idx] if idx < len(labels) else str(idx + 1),
                "option_text": option_text,
                "is_correct": idx == correct_option_index,
                "order_num": idx + 1,
            }
        )

    await asyncio.to_thread(lambda: supabase.table("question_options").insert(payload).execute())
