import asyncio

from core.supabase import SupabaseManager


async def list_teacher_assigned_class_subjects(teacher_id: int) -> list[dict]:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("class_subjects")
        .select("class_subject_id,class_id,subject_id")
        .eq("assigned_teacher_id", teacher_id)
        .eq("status", "active")
        .is_("deleted_at", None)
        .execute()
    )
    return response.data or []


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
        .is_("deleted_at", None)
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
    teacher_id: int,
    scoped_class_subject_ids: list[int],
    scoped_topic_ids: list[int],
) -> list[dict]:
    if not scoped_class_subject_ids:
        return []
    supabase = SupabaseManager.get_client()

    class_subject_rows = await asyncio.to_thread(
        lambda: supabase.table("class_subjects")
        .select("class_subject_id,class_id,subject_id")
        .eq("assigned_teacher_id", teacher_id)
        .eq("status", "active")
        .is_("deleted_at", None)
        .in_("class_subject_id", scoped_class_subject_ids)
        .execute()
    )
    class_subjects = class_subject_rows.data or []
    if not class_subjects:
        return []

    class_ids = sorted({int(item["class_id"]) for item in class_subjects if item.get("class_id") is not None})
    if not class_ids:
        return []

    class_student_rows = await asyncio.to_thread(
        lambda: supabase.table("class_students")
        .select("class_id,student_id")
        .in_("class_id", class_ids)
        .is_("deleted_at", None)
        .execute()
    )
    class_students = class_student_rows.data or []
    if not class_students:
        return []

    student_ids = sorted({int(item["student_id"]) for item in class_students if item.get("student_id") is not None})
    if not student_ids:
        return []

    subject_ids = sorted({int(item["subject_id"]) for item in class_subjects if item.get("subject_id") is not None})
    if not subject_ids:
        return []

    practice_set_rows = await asyncio.to_thread(
        lambda: supabase.table("practice_sets")
        .select("practice_set_id,student_id,subject_id,topic_id")
        .in_("student_id", student_ids)
        .in_("subject_id", subject_ids)
        .is_("deleted_at", None)
        .execute()
    )
    practice_sets = practice_set_rows.data or []
    if not practice_sets:
        return []

    topic_rows = await asyncio.to_thread(
        lambda: supabase.table("topics")
        .select("topic_id,class_subject_id")
        .is_("deleted_at", None)
        .execute()
    )
    topic_class_subject_by_id = {
        int(item["topic_id"]): int(item["class_subject_id"])
        for item in (topic_rows.data or [])
        if item.get("topic_id") is not None and item.get("class_subject_id") is not None
    }

    class_ids_by_student_id: dict[int, set[int]] = {}
    for row in class_students:
        if row.get("student_id") is None or row.get("class_id") is None:
            continue
        class_ids_by_student_id.setdefault(int(row["student_id"]), set()).add(int(row["class_id"]))

    allowed_class_subject_keys: set[tuple[int, int]] = set()
    allowed_topic_ids_by_key: dict[tuple[int, int], set[int]] = {}
    for row in class_subjects:
        if row.get("class_id") is None or row.get("subject_id") is None or row.get("class_subject_id") is None:
            continue
        key = (int(row["class_id"]), int(row["subject_id"]))
        allowed_class_subject_keys.add(key)
        allowed_topic_ids_by_key.setdefault(key, set())

    for topic_id, class_subject_id in topic_class_subject_by_id.items():
        matched_row = next(
            (
                row
                for row in class_subjects
                if row.get("class_subject_id") is not None and int(row["class_subject_id"]) == class_subject_id
            ),
            None,
        )
        if not matched_row or matched_row.get("class_id") is None or matched_row.get("subject_id") is None:
            continue
        key = (int(matched_row["class_id"]), int(matched_row["subject_id"]))
        allowed_topic_ids_by_key.setdefault(key, set()).add(topic_id)

    scoped_topic_id_set = {int(item) for item in scoped_topic_ids}
    deduped_practice_sets: dict[int, dict] = {}
    for row in practice_sets:
        practice_set_id = int(row.get("practice_set_id") or 0)
        student_id = int(row.get("student_id") or 0)
        subject_id = int(row.get("subject_id") or 0)
        if practice_set_id <= 0 or student_id <= 0 or subject_id <= 0:
            continue

        student_class_ids = class_ids_by_student_id.get(student_id) or set()
        if not student_class_ids:
            continue

        matches_scope = False
        for class_id in student_class_ids:
            key = (class_id, subject_id)
            if key not in allowed_class_subject_keys:
                continue

            topic_id = row.get("topic_id")
            if topic_id is not None:
                try:
                    normalized_topic_id = int(topic_id)
                except (TypeError, ValueError):
                    continue
                if scoped_topic_id_set and normalized_topic_id not in scoped_topic_id_set:
                    continue
                if normalized_topic_id not in (allowed_topic_ids_by_key.get(key) or set()):
                    continue
            elif scoped_topic_id_set:
                continue
            matches_scope = True
            break

        if not matches_scope:
            continue

        deduped_practice_sets[practice_set_id] = row

    return list(deduped_practice_sets.values())


async def list_practice_attempts_by_practice_set_ids(practice_set_ids: list[int]) -> list[dict]:
    if not practice_set_ids:
        return []
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("practice_attempts")
        .select("attempt_id,practice_set_id,started_at,submitted_at,score,status")
        .in_("practice_set_id", practice_set_ids)
        .is_("deleted_at", None)
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
        .is_("deleted_at", None)
        .execute()
    )
    return response.data or []


async def list_question_topic_rows(question_ids: list[int]) -> list[dict]:
    if not question_ids:
        return []
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("questions")
        .select("question_id,topic_id")
        .in_("question_id", question_ids)
        .is_("deleted_at", None)
        .execute()
    )
    return response.data or []
