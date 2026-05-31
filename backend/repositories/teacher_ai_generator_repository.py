import asyncio
from datetime import datetime, timezone

from core.supabase import SupabaseManager


AI_REQUEST_SELECT = (
    "request_id,document_topic_id,num_questions,difficulty,content_scope,status,"
    "generated_question_count,retry_count,error_message,is_reviewed,created_at,updated_at"
)
QUESTION_SELECT = (
    "question_id,teacher_id,document_topic_id,ai_request_id,content,difficulty,source,status,explanation,"
    "created_at,updated_at,deleted_at,"
    "question_options(option_id,option_label,option_text,is_correct,order_num)"
)


async def list_teacher_document_topic_rows(teacher_id: int) -> list[dict]:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("document_topics")
        .select(
            "document_topic_id,document_id,topic_id,"
            "documents!inner(document_id,teacher_id,title,file_url,file_type,status,deleted_at),"
            "topics!inner(topic_id,topic_name,class_subject_id,deleted_at,"
            "class_subjects!inner(class_subject_id,class_id,subject_id,assigned_teacher_id,status,deleted_at,"
            "classes!inner(class_id,class_name,status,deleted_at),"
            "subjects!inner(subject_id,subject_name,status,deleted_at)))"
        )
        .eq("documents.teacher_id", teacher_id)
        .eq("documents.status", "active")
        .is_("documents.deleted_at", None)
        .is_("topics.deleted_at", None)
        .order("document_topic_id", desc=True)
        .execute()
    )
    return response.data or []


async def find_teacher_document_topic_row(teacher_id: int, document_topic_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("document_topics")
        .select(
            "document_topic_id,document_id,topic_id,"
            "documents!inner(document_id,teacher_id,title,file_url,file_type,status,deleted_at),"
            "topics!inner(topic_id,topic_name,class_subject_id,deleted_at,"
            "class_subjects!inner(class_subject_id,class_id,subject_id,assigned_teacher_id,status,deleted_at,"
            "classes!inner(class_id,class_name,status,deleted_at),"
            "subjects!inner(subject_id,subject_name,status,deleted_at)))"
        )
        .eq("document_topic_id", document_topic_id)
        .eq("documents.teacher_id", teacher_id)
        .eq("documents.status", "active")
        .is_("documents.deleted_at", None)
        .is_("topics.deleted_at", None)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


async def create_ai_request_record(payload: dict) -> dict:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(lambda: supabase.table("ai_requests").insert(payload).execute())
    rows = response.data or []
    if not rows:
        raise ValueError("Unable to create ai_request")
    return rows[0]


async def find_active_ai_request_for_document_topic(document_topic_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("ai_requests")
        .select(AI_REQUEST_SELECT)
        .eq("document_topic_id", document_topic_id)
        .in_("status", ["pending", "processing"])
        .order("request_id", desc=True)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


async def find_ai_request_by_id(request_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("ai_requests")
        .select(AI_REQUEST_SELECT)
        .eq("request_id", request_id)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


async def list_ai_requests_by_document_topic_ids(
    document_topic_ids: list[int],
    page: int,
    limit: int,
) -> tuple[list[dict], int]:
    if not document_topic_ids:
        return [], 0

    supabase = SupabaseManager.get_client()
    start = (page - 1) * limit
    end = start + limit - 1
    response = await asyncio.to_thread(
        lambda: supabase.table("ai_requests")
        .select(AI_REQUEST_SELECT, count="exact")
        .in_("document_topic_id", document_topic_ids)
        .order("request_id", desc=True)
        .range(start, end)
        .execute()
    )
    return response.data or [], int(response.count or 0)


async def update_ai_request_by_id(request_id: int, payload: dict) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("ai_requests")
        .update(payload)
        .eq("request_id", request_id)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


async def list_existing_question_contents(document_topic_id: int) -> list[str]:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("questions")
        .select("content")
        .eq("document_topic_id", document_topic_id)
        .is_("deleted_at", None)
        .execute()
    )
    return [str(item.get("content") or "") for item in (response.data or []) if item.get("content")]


async def create_question_record(payload: dict) -> dict:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(lambda: supabase.table("questions").insert(payload).execute())
    rows = response.data or []
    if not rows:
        raise ValueError("Unable to create question")
    return rows[0]


async def create_question_options(question_id: int, options: list[str], correct_option_index: int) -> None:
    supabase = SupabaseManager.get_client()
    labels = ["A", "B", "C", "D"]
    payload = []
    for idx, option_text in enumerate(options):
        payload.append(
            {
                "question_id": question_id,
                "option_label": labels[idx],
                "option_text": option_text,
                "is_correct": idx == correct_option_index,
                "order_num": idx + 1,
            }
        )
    await asyncio.to_thread(lambda: supabase.table("question_options").insert(payload).execute())


async def list_questions_by_ai_request_id(request_id: int, teacher_id: int) -> list[dict]:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("questions")
        .select(QUESTION_SELECT)
        .eq("ai_request_id", request_id)
        .eq("teacher_id", teacher_id)
        .is_("deleted_at", None)
        .order("question_id", desc=True)
        .execute()
    )
    return response.data or []


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


async def update_teacher_question_by_id(question_id: int, teacher_id: int, payload: dict) -> dict | None:
    supabase = SupabaseManager.get_client()
    next_payload = dict(payload)
    next_payload["updated_at"] = datetime.now(timezone.utc).isoformat()
    response = await asyncio.to_thread(
        lambda: supabase.table("questions")
        .update(next_payload)
        .eq("question_id", question_id)
        .eq("teacher_id", teacher_id)
        .is_("deleted_at", None)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


async def soft_delete_teacher_question_by_id(question_id: int, teacher_id: int, status: str | None = None) -> dict | None:
    supabase = SupabaseManager.get_client()
    now_iso = datetime.now(timezone.utc).isoformat()
    payload = {
        "deleted_at": now_iso,
        "updated_at": now_iso,
    }
    if status is not None:
        payload["status"] = status
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


async def replace_question_options(question_id: int, options: list[str], correct_option_index: int) -> None:
    supabase = SupabaseManager.get_client()
    await asyncio.to_thread(lambda: supabase.table("question_options").delete().eq("question_id", question_id).execute())
    await create_question_options(question_id=question_id, options=options, correct_option_index=correct_option_index)


async def list_teacher_questions_by_ids(question_ids: list[int], teacher_id: int) -> list[dict]:
    if not question_ids:
        return []
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("questions")
        .select("question_id,status,teacher_id")
        .in_("question_id", question_ids)
        .eq("teacher_id", teacher_id)
        .is_("deleted_at", None)
        .execute()
    )
    return response.data or []


async def bulk_update_question_status(question_ids: list[int], teacher_id: int, from_status: str, to_status: str) -> list[int]:
    if not question_ids:
        return []
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("questions")
        .update(
            {
                "status": to_status,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        .in_("question_id", question_ids)
        .eq("teacher_id", teacher_id)
        .eq("status", from_status)
        .is_("deleted_at", None)
        .execute()
    )
    return [int(item["question_id"]) for item in (response.data or []) if item.get("question_id") is not None]


async def create_question_history_record(payload: dict) -> None:
    supabase = SupabaseManager.get_client()
    await asyncio.to_thread(lambda: supabase.table("question_history").insert(payload).execute())
