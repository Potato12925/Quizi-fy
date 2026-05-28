import asyncio

from core.supabase import SupabaseManager


async def list_teacher_document_topics_scope(teacher_id: int) -> list[dict]:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("document_topics")
        .select(
            "document_topic_id,topic_id,"
            "documents!inner(document_id,teacher_id,status,deleted_at),"
            "topics!inner(topic_id,topic_name,subject_id,deleted_at,subjects!inner(subject_id,subject_name,status,deleted_at))"
        )
        .eq("documents.teacher_id", teacher_id)
        .eq("documents.status", "active")
        .is_("documents.deleted_at", None)
        .is_("topics.deleted_at", None)
        .eq("topics.subjects.status", "active")
        .is_("topics.subjects.deleted_at", None)
        .order("document_topic_id", desc=True)
        .execute()
    )
    return response.data or []


async def list_practice_sets_by_document_topic_ids(document_topic_ids: list[int]) -> list[dict]:
    if not document_topic_ids:
        return []
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("practice_sets")
        .select("practice_set_id,student_id,document_topic_id")
        .in_("document_topic_id", document_topic_ids)
        .execute()
    )
    return response.data or []


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
