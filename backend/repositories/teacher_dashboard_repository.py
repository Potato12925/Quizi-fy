import asyncio

from core.supabase import SupabaseManager

ALLOWED_AI_REQUEST_STATUSES = {"pending", "processing", "completed", "failed", "cancelled"}


async def list_assigned_subjects_for_teacher(teacher_id: int) -> list[dict]:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("class_subjects")
        .select(
            "subject_id,subjects!inner(subject_id,subject_name,status,deleted_at)"
        )
        .eq("assigned_teacher_id", teacher_id)
        .eq("status", "active")
        .is_("deleted_at", None)
        .eq("subjects.status", "active")
        .is_("subjects.deleted_at", None)
        .execute()
    )
    rows = response.data or []
    subject_map: dict[int, dict] = {}
    for row in rows:
        subject = row.get("subjects") or {}
        subject_id = subject.get("subject_id")
        if subject_id is None:
            continue
        sid = int(subject_id)
        subject_map[sid] = {
            "subject_id": sid,
            "subject_name": subject.get("subject_name") or "Unknown subject",
        }
    return list(subject_map.values())


async def count_active_topics_by_subject_ids(subject_ids: list[int]) -> int:
    if not subject_ids:
        return 0
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("topics")
        .select("topic_id,class_subjects!inner(subject_id,status,deleted_at,subjects!inner(subject_id,status,deleted_at))", count="exact")
        .in_("class_subjects.subject_id", subject_ids)
        .eq("class_subjects.status", "active")
        .is_("class_subjects.deleted_at", None)
        .eq("class_subjects.subjects.status", "active")
        .is_("class_subjects.subjects.deleted_at", None)
        .is_("deleted_at", None)
        .execute()
    )
    return int(response.count or 0)


async def list_active_topics_by_subject_ids(subject_ids: list[int]) -> list[dict]:
    if not subject_ids:
        return []
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("topics")
        .select(
            "topic_id,topic_name,class_subject_id,"
            "class_subjects!inner(subject_id,status,deleted_at,subjects!inner(subject_id,status,deleted_at))"
        )
        .in_("class_subjects.subject_id", subject_ids)
        .eq("class_subjects.status", "active")
        .is_("class_subjects.deleted_at", None)
        .eq("class_subjects.subjects.status", "active")
        .is_("class_subjects.subjects.deleted_at", None)
        .is_("deleted_at", None)
        .order("topic_id")
        .execute()
    )
    return response.data or []


async def count_active_documents_by_teacher(teacher_id: int) -> int:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("documents")
        .select("document_id", count="exact")
        .eq("teacher_id", teacher_id)
        .eq("status", "active")
        .is_("deleted_at", None)
        .execute()
    )
    return int(response.count or 0)


async def list_teacher_document_topic_context(teacher_id: int) -> list[dict]:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("document_topics")
        .select(
            "document_topic_id,document_id,topic_id,"
            "documents!inner(document_id,teacher_id,title,status,created_at,updated_at,deleted_at,file_type,file_size),"
            "topics!inner(topic_id,topic_name,class_subject_id,deleted_at,"
            "class_subjects!inner(class_subject_id,class_id,subject_id,assigned_teacher_id,status,deleted_at,"
            "classes!inner(class_id,class_name,status,deleted_at),"
            "subjects!inner(subject_id,subject_name,status,deleted_at)))"
        )
        .eq("documents.teacher_id", teacher_id)
        .eq("documents.status", "active")
        .is_("documents.deleted_at", None)
        .is_("topics.deleted_at", None)
        .eq("topics.class_subjects.status", "active")
        .is_("topics.class_subjects.deleted_at", None)
        .eq("topics.class_subjects.classes.status", "active")
        .is_("topics.class_subjects.classes.deleted_at", None)
        .eq("topics.class_subjects.subjects.status", "active")
        .is_("topics.class_subjects.subjects.deleted_at", None)
        .order("document_topic_id", desc=True)
        .execute()
    )
    return response.data or []


async def count_ai_requests_by_document_topic_ids(document_topic_ids: list[int], status: str | None = None) -> int:
    if not document_topic_ids:
        return 0
    if status is not None and status not in ALLOWED_AI_REQUEST_STATUSES:
        return 0
    supabase = SupabaseManager.get_client()
    query = (
        supabase.table("ai_requests")
        .select("request_id", count="exact")
        .in_("document_topic_id", document_topic_ids)
    )
    if status:
        query = query.eq("status", status)
    response = await asyncio.to_thread(lambda: query.execute())
    return int(response.count or 0)


async def list_ai_requests_by_document_topic_ids_for_stats(document_topic_ids: list[int]) -> list[dict]:
    if not document_topic_ids:
        return []
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("ai_requests")
        .select("request_id,document_topic_id,status,created_at")
        .in_("document_topic_id", document_topic_ids)
        .order("created_at", desc=True)
        .execute()
    )
    return response.data or []


async def count_questions_by_document_topic_ids(
    teacher_id: int,
    document_topic_ids: list[int],
    status: str | None = None,
    difficulty: str | None = None,
) -> int:
    if not document_topic_ids:
        return 0
    supabase = SupabaseManager.get_client()
    query = (
        supabase.table("questions")
        .select("question_id", count="exact")
        .eq("teacher_id", teacher_id)
        .in_("document_topic_id", document_topic_ids)
        .is_("deleted_at", None)
    )
    if status:
        query = query.eq("status", status)
    if difficulty:
        query = query.eq("difficulty", difficulty)
    response = await asyncio.to_thread(lambda: query.execute())
    return int(response.count or 0)


async def list_questions_by_document_topic_ids_for_stats(teacher_id: int, document_topic_ids: list[int]) -> list[dict]:
    if not document_topic_ids:
        return []
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("questions")
        .select("question_id,document_topic_id,status,difficulty")
        .eq("teacher_id", teacher_id)
        .in_("document_topic_id", document_topic_ids)
        .is_("deleted_at", None)
        .execute()
    )
    return response.data or []


async def list_recent_ai_requests_by_document_topic_ids(document_topic_ids: list[int], limit: int) -> list[dict]:
    if not document_topic_ids:
        return []
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("ai_requests")
        .select(
            "request_id,document_topic_id,num_questions,difficulty,content_scope,status,"
            "generated_question_count,retry_count,error_message,is_reviewed,created_at,updated_at"
        )
        .in_("document_topic_id", document_topic_ids)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return response.data or []


async def list_recent_documents_by_teacher(teacher_id: int, limit: int) -> list[dict]:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("documents")
        .select(
            "document_id,teacher_id,title,description,file_type,file_size,status,created_at,updated_at"
        )
        .eq("teacher_id", teacher_id)
        .eq("status", "active")
        .is_("deleted_at", None)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return response.data or []


async def list_ai_requests_by_document_topic_ids_for_summary(document_topic_ids: list[int]) -> list[dict]:
    if not document_topic_ids:
        return []
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("ai_requests")
        .select("request_id,document_topic_id,status,created_at")
        .in_("document_topic_id", document_topic_ids)
        .order("created_at", desc=True)
        .execute()
    )
    return response.data or []


async def list_questions_by_document_topic_ids_for_summary(teacher_id: int, document_topic_ids: list[int]) -> list[dict]:
    if not document_topic_ids:
        return []
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("questions")
        .select("question_id,document_topic_id,status")
        .eq("teacher_id", teacher_id)
        .in_("document_topic_id", document_topic_ids)
        .is_("deleted_at", None)
        .execute()
    )
    return response.data or []


async def list_recent_approved_questions_by_teacher(teacher_id: int, limit: int) -> list[dict]:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("questions")
        .select(
            "question_id,document_topic_id,ai_request_id,content,difficulty,source,status,created_at,updated_at"
        )
        .eq("teacher_id", teacher_id)
        .eq("status", "approved")
        .is_("deleted_at", None)
        .order("updated_at", desc=True)
        .limit(limit)
        .execute()
    )
    return response.data or []
