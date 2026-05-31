import asyncio

from core.supabase import SupabaseManager


async def list_teacher_assigned_topics_scope(teacher_id: int) -> list[dict]:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("topics")
        .select(
            "topic_id,topic_name,class_subject_id,deleted_at,"
            "class_subjects!inner(class_subject_id,class_id,subject_id,assigned_teacher_id,status,deleted_at,"
            "classes!inner(class_id,class_name,status,deleted_at),"
            "subjects!inner(subject_id,subject_name,status,deleted_at))"
        )
        .eq("class_subjects.assigned_teacher_id", teacher_id)
        .is_("deleted_at", None)
        .eq("class_subjects.status", "active")
        .is_("class_subjects.deleted_at", None)
        .eq("class_subjects.classes.status", "active")
        .is_("class_subjects.classes.deleted_at", None)
        .eq("class_subjects.subjects.status", "active")
        .is_("class_subjects.subjects.deleted_at", None)
        .order("topic_id")
        .execute()
    )
    return response.data or []


async def list_teacher_document_topics_scope(teacher_id: int) -> list[dict]:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("document_topics")
        .select(
            "document_topic_id,topic_id,"
            "documents!inner(document_id,teacher_id,status,deleted_at),"
            "topics!inner(topic_id,topic_name,class_subject_id,deleted_at,"
            "class_subjects!inner(class_subject_id,class_id,subject_id,assigned_teacher_id,status,deleted_at,"
            "classes!inner(class_id,class_name,status,deleted_at),"
            "subjects!inner(subject_id,subject_name,status,deleted_at)))"
        )
        .eq("topics.class_subjects.assigned_teacher_id", teacher_id)
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


async def list_scoped_practice_sets(
    assigned_subject_ids: list[int],
    scoped_document_topic_ids: list[int],
) -> list[dict]:
    if not assigned_subject_ids:
        return []
    supabase = SupabaseManager.get_client()
    # Subject scope is always enforced. Topic scope is optional via document_topic_id.
    base_rows_response = await asyncio.to_thread(
        lambda: supabase.table("practice_sets")
        .select("practice_set_id,student_id,subject_id,document_topic_id")
        .in_("subject_id", assigned_subject_ids)
        .execute()
    )
    base_rows = base_rows_response.data or []
    if not scoped_document_topic_ids:
        return [row for row in base_rows if row.get("document_topic_id") is None]

    scoped_document_topic_id_set = set(int(item) for item in scoped_document_topic_ids)
    scoped_rows: list[dict] = []
    for row in base_rows:
        document_topic_id = row.get("document_topic_id")
        if document_topic_id is None:
            scoped_rows.append(row)
            continue
        try:
            if int(document_topic_id) in scoped_document_topic_id_set:
                scoped_rows.append(row)
        except (TypeError, ValueError):
            continue
    return scoped_rows


async def list_practice_attempts_by_practice_set_ids(practice_set_ids: list[int]) -> list[dict]:
    if not practice_set_ids:
        return []
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("practice_attempts")
        .select("attempt_id,practice_set_id,started_at,submitted_at,score,status")
        .in_("practice_set_id", practice_set_ids)
        .execute()
    )
    return response.data or []


async def list_student_answers_by_attempt_ids(attempt_ids: list[int]) -> list[dict]:
    if not attempt_ids:
        return []
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("student_answers")
        .select("attempt_id,question_id,selected_option_id,is_correct")
        .in_("attempt_id", attempt_ids)
        .execute()
    )
    return response.data or []


async def list_question_document_topics(question_ids: list[int]) -> list[dict]:
    if not question_ids:
        return []
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("questions")
        .select("question_id,document_topic_id")
        .in_("question_id", question_ids)
        .is_("deleted_at", None)
        .execute()
    )
    return response.data or []
