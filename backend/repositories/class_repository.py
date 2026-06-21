import asyncio
from collections import defaultdict
from datetime import datetime, timezone

from core.supabase import SupabaseManager


CLASS_SELECT_FIELDS = "class_id,class_code,class_name,description,teacher_id,status,created_at,updated_at,deleted_at"
CLASS_SUBJECT_SELECT_FIELDS = (
    "class_subject_id,class_id,subject_id,assigned_teacher_id,status,created_at,updated_at,deleted_at"
)
CLASS_STUDENT_SELECT_FIELDS = "class_student_id,class_id,student_id,joined_at,deleted_at"
CLASS_TEACHER_SELECT_FIELDS = "class_teacher_id,class_id,teacher_id,joined_at,deleted_at"


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def find_class_by_id(class_id: int, include_deleted: bool = False) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = supabase.table("classes").select(CLASS_SELECT_FIELDS).eq("class_id", class_id)
    if not include_deleted:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.limit(1).execute())
    rows = response.data or []
    return rows[0] if rows else None


async def find_class_by_code(
    class_code: str,
    exclude_class_id: int | None = None,
    include_deleted: bool = False,
) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = supabase.table("classes").select(CLASS_SELECT_FIELDS).eq("class_code", class_code)
    if exclude_class_id is not None:
        query = query.neq("class_id", exclude_class_id)
    if not include_deleted:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.limit(1).execute())
    rows = response.data or []
    return rows[0] if rows else None


async def create_class_record(payload: dict) -> dict:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(lambda: supabase.table("classes").insert(payload).execute())
    rows = response.data or []
    if not rows:
        raise ValueError("Unable to create class")
    return rows[0]


async def list_classes(
    page: int,
    limit: int,
    search: str | None,
    teacher_id: int | None,
    status: str,
    sort_by: str,
    sort_order: str,
) -> tuple[list[dict], int]:
    supabase = SupabaseManager.get_client()
    start = (page - 1) * limit
    end = start + limit - 1

    query = supabase.table("classes").select(CLASS_SELECT_FIELDS, count="exact").is_("deleted_at", None)
    if teacher_id is not None:
        query = query.eq("teacher_id", teacher_id)
    if status in {"active", "inactive"}:
        query = query.eq("status", status)

    if search:
        search_text = search.strip()
        if search_text:
            query = query.or_(f"class_code.ilike.%{search_text}%,class_name.ilike.%{search_text}%")

    if sort_by == "student_count":
        response = await asyncio.to_thread(lambda: query.execute())
        items = response.data or []
        class_ids = [int(item["class_id"]) for item in items if item.get("class_id") is not None]
        student_counts = await list_class_student_counts(class_ids)
        sorted_items = sorted(
            items,
            key=lambda row: (student_counts.get(int(row["class_id"]), 0), int(row["class_id"])),
            reverse=sort_order == "desc",
        )
        paged_items = sorted_items[start : end + 1]
        return paged_items, int(response.count or 0)

    response = await asyncio.to_thread(lambda: query.order(sort_by, desc=sort_order == "desc").range(start, end).execute())
    return response.data or [], int(response.count or 0)


async def update_class_by_id(class_id: int, payload: dict, include_deleted: bool = False) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = supabase.table("classes").update(payload).eq("class_id", class_id)
    if not include_deleted:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.execute())
    rows = response.data or []
    return rows[0] if rows else None


async def soft_delete_class_by_id(class_id: int) -> bool:
    supabase = SupabaseManager.get_client()
    payload = {"deleted_at": _utc_now_iso()}
    response = await asyncio.to_thread(
        lambda: supabase.table("classes")
        .update(payload)
        .eq("class_id", class_id)
        .is_("deleted_at", None)
        .execute()
    )
    rows = response.data or []
    return len(rows) > 0


async def hard_delete_class_teacher_mappings_by_class_id(class_id: int) -> None:
    supabase = SupabaseManager.get_client()
    await asyncio.to_thread(
        lambda: supabase.table("class_teachers")
        .delete()
        .eq("class_id", class_id)
        .execute()
    )


async def hard_delete_class_by_id(class_id: int) -> bool:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("classes")
        .delete()
        .eq("class_id", class_id)
        .execute()
    )
    rows = response.data or []
    return len(rows) > 0


async def has_any_class_links(class_id: int) -> bool:
    supabase = SupabaseManager.get_client()
    checks = [
        ("class_students", "class_student_id"),
        ("class_subjects", "class_subject_id"),
    ]
    for table_name, pk_name in checks:
        response = await asyncio.to_thread(
            lambda table_name=table_name, pk_name=pk_name: supabase.table(table_name)
            .select(pk_name)
            .eq("class_id", class_id)
            .limit(1)
            .execute()
        )
        if response.data:
            return True
    return False


async def list_user_profiles(user_ids: list[int]) -> dict[int, dict]:
    if not user_ids:
        return {}
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("users")
        .select("user_id,username,full_name,is_active")
        .in_("user_id", user_ids)
        .is_("deleted_at", None)
        .execute()
    )
    rows = response.data or []
    return {
        int(item["user_id"]): {
            "user_id": int(item["user_id"]),
            "username": item.get("username"),
            "full_name": item.get("full_name"),
            "is_active": bool(item.get("is_active", True)),
        }
        for item in rows
        if item.get("user_id") is not None
    }


def _count_by_class_id(rows: list[dict], key: str = "class_id") -> dict[int, int]:
    counts: dict[int, int] = defaultdict(int)
    for item in rows:
        class_id = item.get(key)
        if class_id is None:
            continue
        counts[int(class_id)] += 1
    return dict(counts)


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
    return _count_by_class_id(response.data or [])


async def list_class_teacher_counts(class_ids: list[int]) -> dict[int, int]:
    if not class_ids:
        return {}
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("class_teachers")
        .select("class_id")
        .in_("class_id", class_ids)
        .is_("deleted_at", None)
        .execute()
    )
    return _count_by_class_id(response.data or [])


async def list_class_subject_counts(class_ids: list[int]) -> dict[int, int]:
    if not class_ids:
        return {}
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("class_subjects")
        .select("class_id")
        .in_("class_id", class_ids)
        .eq("status", "active")
        .is_("deleted_at", None)
        .execute()
    )
    return _count_by_class_id(response.data or [])


async def list_class_subjects(class_id: int) -> list[dict]:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("class_subjects")
        .select(CLASS_SUBJECT_SELECT_FIELDS)
        .eq("class_id", class_id)
        .eq("status", "active")
        .is_("deleted_at", None)
        .order("class_subject_id")
        .execute()
    )
    return response.data or []


async def list_class_students(class_id: int) -> list[dict]:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("class_students")
        .select(CLASS_STUDENT_SELECT_FIELDS)
        .eq("class_id", class_id)
        .is_("deleted_at", None)
        .order("class_student_id")
        .execute()
    )
    return response.data or []


async def list_subject_profiles(subject_ids: list[int]) -> dict[int, dict]:
    if not subject_ids:
        return {}
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("subjects")
        .select("subject_id,subject_code,subject_name,status")
        .in_("subject_id", subject_ids)
        .is_("deleted_at", None)
        .execute()
    )
    rows = response.data or []
    return {
        int(item["subject_id"]): item
        for item in rows
        if item.get("subject_id") is not None
    }


async def find_class_subject_mapping(class_id: int, subject_id: int, include_deleted: bool = False) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = (
        supabase.table("class_subjects")
        .select(CLASS_SUBJECT_SELECT_FIELDS)
        .eq("class_id", class_id)
        .eq("subject_id", subject_id)
    )
    if not include_deleted:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.limit(1).execute())
    rows = response.data or []
    return rows[0] if rows else None


async def create_class_subject_mapping(payload: dict) -> dict:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(lambda: supabase.table("class_subjects").insert(payload).execute())
    rows = response.data or []
    if not rows:
        raise ValueError("Unable to assign subject to class")
    return rows[0]


async def update_class_subject_mapping(record_id: int, payload: dict) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("class_subjects")
        .update(payload)
        .eq("class_subject_id", record_id)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


async def soft_delete_class_subject_mapping(class_id: int, subject_id: int) -> bool:
    supabase = SupabaseManager.get_client()
    payload = {"deleted_at": _utc_now_iso()}
    response = await asyncio.to_thread(
        lambda: supabase.table("class_subjects")
        .update(payload)
        .eq("class_id", class_id)
        .eq("subject_id", subject_id)
        .is_("deleted_at", None)
        .execute()
    )
    rows = response.data or []
    return len(rows) > 0


async def find_class_subject_by_record_id(class_id: int, class_subject_id: int, include_deleted: bool = False) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = (
        supabase.table("class_subjects")
        .select(CLASS_SUBJECT_SELECT_FIELDS)
        .eq("class_id", class_id)
        .eq("class_subject_id", class_subject_id)
    )
    if not include_deleted:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.limit(1).execute())
    rows = response.data or []
    return rows[0] if rows else None


async def soft_delete_class_subject_mapping_by_record_id(class_id: int, class_subject_id: int) -> bool:
    supabase = SupabaseManager.get_client()
    payload = {"deleted_at": _utc_now_iso()}
    response = await asyncio.to_thread(
        lambda: supabase.table("class_subjects")
        .update(payload)
        .eq("class_id", class_id)
        .eq("class_subject_id", class_subject_id)
        .is_("deleted_at", None)
        .execute()
    )
    rows = response.data or []
    return len(rows) > 0


async def summarize_class_subject_usage(class_id: int, class_subject_id: int, subject_id: int) -> dict[str, int]:
    supabase = SupabaseManager.get_client()

    # Count usage across all mappings of the same class+subject pair,
    # including historical mappings that may have been soft-deleted.
    class_subjects_resp = await asyncio.to_thread(
        lambda: supabase.table("class_subjects")
        .select("class_subject_id")
        .eq("class_id", class_id)
        .eq("subject_id", subject_id)
        .execute()
    )
    related_class_subject_ids = sorted(
        {
            int(item["class_subject_id"])
            for item in (class_subjects_resp.data or [])
            if item.get("class_subject_id") is not None
        }
    )
    if not related_class_subject_ids:
        related_class_subject_ids = [class_subject_id]

    topics_resp = await asyncio.to_thread(
        lambda: supabase.table("topics")
        .select("topic_id")
        .in_("class_subject_id", related_class_subject_ids)
        .execute()
    )
    topic_ids = [int(item["topic_id"]) for item in (topics_resp.data or []) if item.get("topic_id") is not None]

    document_count = 0
    question_count = 0
    practice_set_ids: set[int] = set()

    if topic_ids:
        document_topics_resp = await asyncio.to_thread(
            lambda: supabase.table("document_topics")
            .select("document_id")
            .in_("topic_id", topic_ids)
            .execute()
        )
        document_ids = sorted(
            {int(item["document_id"]) for item in (document_topics_resp.data or []) if item.get("document_id") is not None}
        )
        if document_ids:
            documents_resp = await asyncio.to_thread(
                lambda: supabase.table("documents")
                .select("document_id", count="exact")
                .in_("document_id", document_ids)
                .execute()
            )
            document_count = int(documents_resp.count or 0)

        questions_resp = await asyncio.to_thread(
            lambda: supabase.table("questions")
            .select("question_id", count="exact")
            .in_("topic_id", topic_ids)
            .execute()
        )
        question_count = int(questions_resp.count or 0)

        topic_practice_sets_resp = await asyncio.to_thread(
            lambda: supabase.table("practice_sets")
            .select("practice_set_id")
            .in_("topic_id", topic_ids)
            .execute()
        )
        practice_set_ids.update(
            int(item["practice_set_id"])
            for item in (topic_practice_sets_resp.data or [])
            if item.get("practice_set_id") is not None
        )

    class_students_resp = await asyncio.to_thread(
        lambda: supabase.table("class_students")
        .select("student_id")
        .eq("class_id", class_id)
        .execute()
    )
    student_ids = [int(item["student_id"]) for item in (class_students_resp.data or []) if item.get("student_id") is not None]
    if student_ids:
        subject_practice_sets_resp = await asyncio.to_thread(
            lambda: supabase.table("practice_sets")
            .select("practice_set_id")
            .eq("subject_id", subject_id)
            .in_("student_id", student_ids)
            .execute()
        )
        practice_set_ids.update(
            int(item["practice_set_id"])
            for item in (subject_practice_sets_resp.data or [])
            if item.get("practice_set_id") is not None
        )

    attempt_count = 0
    if practice_set_ids:
        attempts_resp = await asyncio.to_thread(
            lambda: supabase.table("practice_attempts")
            .select("attempt_id", count="exact")
            .in_("practice_set_id", sorted(practice_set_ids))
            .execute()
        )
        attempt_count = int(attempts_resp.count or 0)

    return {
        "topics": len(topic_ids),
        "documents": document_count,
        "questions": question_count,
        "practice_sets": len(practice_set_ids),
        "practice_attempts": attempt_count,
    }


async def find_class_student_mapping(class_id: int, student_id: int, include_deleted: bool = False) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = (
        supabase.table("class_students")
        .select(CLASS_STUDENT_SELECT_FIELDS)
        .eq("class_id", class_id)
        .eq("student_id", student_id)
    )
    if not include_deleted:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.limit(1).execute())
    rows = response.data or []
    return rows[0] if rows else None


async def find_any_active_class_of_student(student_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("class_students")
        .select(CLASS_STUDENT_SELECT_FIELDS)
        .eq("student_id", student_id)
        .is_("deleted_at", None)
        .order("class_student_id")
        .limit(1)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


async def create_class_student_mapping(payload: dict) -> dict:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(lambda: supabase.table("class_students").insert(payload).execute())
    rows = response.data or []
    if not rows:
        raise ValueError("Unable to assign student to class")
    return rows[0]


async def update_class_student_mapping(record_id: int, payload: dict) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("class_students")
        .update(payload)
        .eq("class_student_id", record_id)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


async def soft_delete_class_student_mapping(class_id: int, student_id: int) -> bool:
    supabase = SupabaseManager.get_client()
    payload = {"deleted_at": _utc_now_iso()}
    response = await asyncio.to_thread(
        lambda: supabase.table("class_students")
        .update(payload)
        .eq("class_id", class_id)
        .eq("student_id", student_id)
        .is_("deleted_at", None)
        .execute()
    )
    rows = response.data or []
    return len(rows) > 0


async def find_class_teacher_mapping(class_id: int, teacher_id: int, include_deleted: bool = False) -> dict | None:
    supabase = SupabaseManager.get_client()
    query = (
        supabase.table("class_teachers")
        .select(CLASS_TEACHER_SELECT_FIELDS)
        .eq("class_id", class_id)
        .eq("teacher_id", teacher_id)
    )
    if not include_deleted:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.limit(1).execute())
    rows = response.data or []
    return rows[0] if rows else None


async def create_class_teacher_mapping(payload: dict) -> dict:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(lambda: supabase.table("class_teachers").insert(payload).execute())
    rows = response.data or []
    if not rows:
        raise ValueError("Unable to assign teacher to class")
    return rows[0]


async def update_class_teacher_mapping(record_id: int, payload: dict) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("class_teachers")
        .update(payload)
        .eq("class_teacher_id", record_id)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


async def list_class_teachers(class_id: int) -> list[dict]:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("class_teachers")
        .select(CLASS_TEACHER_SELECT_FIELDS)
        .eq("class_id", class_id)
        .is_("deleted_at", None)
        .order("class_teacher_id")
        .execute()
    )
    return response.data or []


async def soft_delete_class_teacher_mapping(class_id: int, teacher_id: int) -> bool:
    supabase = SupabaseManager.get_client()
    payload = {"deleted_at": _utc_now_iso()}
    response = await asyncio.to_thread(
        lambda: supabase.table("class_teachers")
        .update(payload)
        .eq("class_id", class_id)
        .eq("teacher_id", teacher_id)
        .is_("deleted_at", None)
        .execute()
    )
    rows = response.data or []
    return len(rows) > 0
