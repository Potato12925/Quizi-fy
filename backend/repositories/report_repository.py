import asyncio
from collections import defaultdict

from core.supabase import SupabaseManager


async def list_active_users() -> list[dict]:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("users")
        .select("user_id,username,full_name,is_active,must_change_password,created_at,updated_at,deleted_at")
        .is_("deleted_at", None)
        .order("user_id")
        .execute()
    )
    return response.data or []


async def list_user_roles(user_ids: list[int]) -> dict[int, list[str]]:
    if not user_ids:
        return {}

    supabase = SupabaseManager.get_client()
    user_role_response = await asyncio.to_thread(
        lambda: supabase.table("user_roles")
        .select("user_id,role_id")
        .in_("user_id", user_ids)
        .execute()
    )
    user_role_rows = user_role_response.data or []
    role_ids = sorted({int(item["role_id"]) for item in user_role_rows if item.get("role_id") is not None})
    if not role_ids:
        return {user_id: [] for user_id in user_ids}

    role_response = await asyncio.to_thread(
        lambda: supabase.table("roles")
        .select("role_id,role_code")
        .in_("role_id", role_ids)
        .execute()
    )
    role_rows = role_response.data or []
    role_code_by_id = {int(item["role_id"]): str(item["role_code"]) for item in role_rows}

    result: dict[int, list[str]] = {user_id: [] for user_id in user_ids}
    for item in user_role_rows:
        user_id = int(item["user_id"])
        role_code = role_code_by_id.get(int(item["role_id"]))
        if role_code:
            result.setdefault(user_id, []).append(role_code)

    return result


async def list_users_by_ids(user_ids: list[int]) -> list[dict]:
    if not user_ids:
        return []

    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("users")
        .select("user_id,username,full_name,is_active,must_change_password,created_at,updated_at,deleted_at")
        .in_("user_id", user_ids)
        .is_("deleted_at", None)
        .execute()
    )
    return response.data or []


async def list_active_subjects(subject_ids: list[int] | None = None) -> list[dict]:
    supabase = SupabaseManager.get_client()
    query = (
        supabase.table("subjects")
        .select("subject_id,subject_code,subject_name,status,created_at,updated_at,deleted_at")
        .eq("status", "active")
        .is_("deleted_at", None)
    )
    if subject_ids is not None:
        if not subject_ids:
            return []
        query = query.in_("subject_id", subject_ids)

    response = await asyncio.to_thread(lambda: query.order("subject_id").execute())
    return response.data or []


async def list_active_topics(subject_ids: list[int] | None = None, topic_ids: list[int] | None = None) -> list[dict]:
    supabase = SupabaseManager.get_client()
    query = (
        supabase.table("topics")
        .select("topic_id,topic_name,class_subject_id,created_at,updated_at,deleted_at,class_subjects!inner(subject_id,class_id)")
        .is_("deleted_at", None)
    )

    if subject_ids is not None:
        if not subject_ids:
            return []
        query = query.in_("class_subjects.subject_id", subject_ids)

    if topic_ids is not None:
        if not topic_ids:
            return []
        query = query.in_("topic_id", topic_ids)

    response = await asyncio.to_thread(lambda: query.order("topic_id").execute())
    rows = response.data or []
    normalized: list[dict] = []
    for item in rows:
        next_item = dict(item)
        class_subject = item.get("class_subjects") or {}
        if next_item.get("subject_id") is None and class_subject.get("subject_id") is not None:
            next_item["subject_id"] = class_subject.get("subject_id")
        if next_item.get("class_id") is None and class_subject.get("class_id") is not None:
            next_item["class_id"] = class_subject.get("class_id")
        normalized.append(next_item)
    return normalized


async def list_teacher_assigned_subject_ids(teacher_id: int) -> list[int]:
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


async def list_classes(teacher_id: int | None = None) -> list[dict]:
    supabase = SupabaseManager.get_client()
    query = (
        supabase.table("classes")
        .select("class_id,class_code,class_name,teacher_id,status,created_at,updated_at,deleted_at")
        .is_("deleted_at", None)
    )
    if teacher_id is not None:
        query = query.eq("teacher_id", teacher_id)

    response = await asyncio.to_thread(lambda: query.order("class_id").execute())
    return response.data or []


async def list_class_student_counts(class_ids: list[int]) -> dict[int, int]:
    if not class_ids:
        return {}

    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("class_students")
        .select("class_id")
        .in_("class_id", class_ids)
        .is_("deleted_at", None)
        .execute()
    )
    rows = response.data or []

    counts: dict[int, int] = defaultdict(int)
    for item in rows:
        class_id = item.get("class_id")
        if class_id is None:
            continue
        counts[int(class_id)] += 1
    return dict(counts)


async def list_class_students_by_class_id(class_id: int) -> list[dict]:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("class_students")
        .select("class_student_id,class_id,student_id,joined_at,deleted_at")
        .eq("class_id", class_id)
        .is_("deleted_at", None)
        .order("class_student_id")
        .execute()
    )
    return response.data or []


async def list_class_teachers_by_class_id(class_id: int) -> list[dict]:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("class_teachers")
        .select("class_teacher_id,class_id,teacher_id,joined_at,deleted_at")
        .eq("class_id", class_id)
        .is_("deleted_at", None)
        .order("class_teacher_id")
        .execute()
    )
    return response.data or []


async def list_class_subjects_by_class_id(class_id: int) -> list[dict]:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("class_subjects")
        .select("class_subject_id,class_id,subject_id,assigned_teacher_id,status,created_at,updated_at,deleted_at")
        .eq("class_id", class_id)
        .eq("status", "active")
        .is_("deleted_at", None)
        .order("class_subject_id")
        .execute()
    )
    return response.data or []


async def list_practice_sets_by_student_ids(student_ids: list[int]) -> list[dict]:
    if not student_ids:
        return []

    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("practice_sets")
        .select("practice_set_id,student_id,subject_id,created_at")
        .in_("student_id", student_ids)
        .execute()
    )
    return response.data or []


async def list_submitted_practice_attempts_by_set_ids(
    practice_set_ids: list[int],
    date_from: str | None = None,
    date_to: str | None = None,
) -> list[dict]:
    if not practice_set_ids:
        return []

    supabase = SupabaseManager.get_client()
    query = (
        supabase.table("practice_attempts")
        .select("attempt_id,practice_set_id,submitted_at,score,total_correct,total_wrong,status")
        .in_("practice_set_id", practice_set_ids)
        .eq("status", "submitted")
    )
    if date_from:
        query = query.gte("submitted_at", date_from)
    if date_to:
        query = query.lte("submitted_at", date_to)

    response = await asyncio.to_thread(lambda: query.order("submitted_at", desc=True).execute())
    return response.data or []


async def list_documents(
    teacher_id: int | None = None,
    document_ids: list[int] | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
) -> list[dict]:
    supabase = SupabaseManager.get_client()
    query = (
        supabase.table("documents")
        .select("document_id,teacher_id,title,description,file_type,file_size,status,created_at,updated_at,deleted_at")
        .eq("status", "active")
        .is_("deleted_at", None)
    )

    if teacher_id is not None:
        query = query.eq("teacher_id", teacher_id)
    if document_ids is not None:
        if not document_ids:
            return []
        query = query.in_("document_id", document_ids)
    if date_from:
        query = query.gte("created_at", date_from)
    if date_to:
        query = query.lte("created_at", date_to)

    response = await asyncio.to_thread(lambda: query.order("created_at", desc=True).execute())
    return response.data or []


async def list_document_topics(
    document_ids: list[int] | None = None,
    topic_ids: list[int] | None = None,
    document_topic_ids: list[int] | None = None,
) -> list[dict]:
    supabase = SupabaseManager.get_client()
    query = supabase.table("document_topics").select("document_topic_id,document_id,topic_id,created_at")

    if document_ids is not None:
        if not document_ids:
            return []
        query = query.in_("document_id", document_ids)

    if topic_ids is not None:
        if not topic_ids:
            return []
        query = query.in_("topic_id", topic_ids)

    if document_topic_ids is not None:
        if not document_topic_ids:
            return []
        query = query.in_("document_topic_id", document_topic_ids)

    response = await asyncio.to_thread(lambda: query.order("document_topic_id").execute())
    return response.data or []


async def list_ai_requests(
    document_topic_ids: list[int] | None = None,
    ai_request_ids: list[int] | None = None,
    status: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
) -> list[dict]:
    supabase = SupabaseManager.get_client()
    query = supabase.table("ai_requests").select(
        "request_id,document_topic_id,num_questions,difficulty,content_scope,status,generated_question_count,retry_count,error_message,is_reviewed,created_at,updated_at"
    )

    if document_topic_ids is not None:
        if not document_topic_ids:
            return []
        query = query.in_("document_topic_id", document_topic_ids)

    if ai_request_ids is not None:
        if not ai_request_ids:
            return []
        query = query.in_("request_id", ai_request_ids)

    if status:
        query = query.eq("status", status)
    if date_from:
        query = query.gte("created_at", date_from)
    if date_to:
        query = query.lte("created_at", date_to)

    response = await asyncio.to_thread(lambda: query.order("created_at", desc=True).execute())
    return response.data or []


async def list_questions(
    teacher_id: int | None = None,
    question_ids: list[int] | None = None,
    ai_request_ids: list[int] | None = None,
    status: str | None = None,
    difficulty: str | None = None,
    source: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    search: str | None = None,
) -> list[dict]:
    supabase = SupabaseManager.get_client()
    query = (
        supabase.table("questions")
        .select(
            "question_id,teacher_id,document_topic_id,ai_request_id,image_id,content,difficulty,source,status,explanation,created_at,updated_at,deleted_at"
        )
        .is_("deleted_at", None)
    )

    if teacher_id is not None:
        query = query.eq("teacher_id", teacher_id)
    if question_ids is not None:
        if not question_ids:
            return []
        query = query.in_("question_id", question_ids)
    if ai_request_ids is not None:
        if not ai_request_ids:
            return []
        query = query.in_("ai_request_id", ai_request_ids)
    if status:
        query = query.eq("status", status)
    if difficulty:
        query = query.eq("difficulty", difficulty)
    if source:
        query = query.eq("source", source)
    if date_from:
        query = query.gte("created_at", date_from)
    if date_to:
        query = query.lte("created_at", date_to)
    if search:
        query = query.ilike("content", f"%{search}%")

    response = await asyncio.to_thread(lambda: query.order("created_at", desc=True).execute())
    return response.data or []


async def list_question_options(question_ids: list[int]) -> list[dict]:
    if not question_ids:
        return []

    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("question_options")
        .select("option_id,question_id,option_label,option_text,is_correct,order_num")
        .in_("question_id", question_ids)
        .order("order_num")
        .execute()
    )
    return response.data or []


async def list_topics_with_document_counts(
    subject_ids: list[int] | None = None,
    teacher_id: int | None = None,
) -> dict[int, int]:
    topics = await list_active_topics(subject_ids=subject_ids)
    topic_ids = [int(item["topic_id"]) for item in topics]
    if not topic_ids:
        return {}

    document_rows = await list_documents(teacher_id=teacher_id)
    document_ids = [int(item["document_id"]) for item in document_rows]
    if not document_ids:
        return {topic_id: 0 for topic_id in topic_ids}

    document_topics = await list_document_topics(document_ids=document_ids, topic_ids=topic_ids)
    counts: dict[int, int] = defaultdict(int)
    for item in document_topics:
        topic_id = item.get("topic_id")
        if topic_id is None:
            continue
        counts[int(topic_id)] += 1

    return {topic_id: counts.get(topic_id, 0) for topic_id in topic_ids}
