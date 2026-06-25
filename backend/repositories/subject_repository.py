import asyncio
from datetime import datetime, timezone

from core.supabase import SupabaseManager


SUBJECT_SELECT_FIELDS = "subject_id,subject_code,subject_name,description,status,created_at, updated_at, deleted_at"


async def find_subject_by_id(subject_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("subjects")
        .select(SUBJECT_SELECT_FIELDS)
        .eq("subject_id", subject_id)
        .is_("deleted_at", None)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


async def is_subject_active(subject_id: int) -> bool:
    subject = await find_subject_by_id(subject_id)
    return bool(subject and subject.get("status") == "active")


async def find_subject_by_class_subject_id(class_subject_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("class_subjects")
        .select("class_subject_id,subjects!inner(subject_id,subject_code,subject_name,status,deleted_at)")
        .eq("class_subject_id", class_subject_id)
        .is_("deleted_at", None)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    if not rows:
        return None

    subject = rows[0].get("subjects") or {}
    if subject.get("deleted_at") is not None:
        return None
    return subject


async def find_subject_by_topic_id(topic_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("topics")
        .select(
            "topic_id,class_subjects!inner(subjects!inner(subject_id,subject_code,subject_name,status,deleted_at))"
        )
        .eq("topic_id", topic_id)
        .is_("deleted_at", None)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    if not rows:
        return None

    class_subject = rows[0].get("class_subjects") or {}
    subject = class_subject.get("subjects") or {}
    if subject.get("deleted_at") is not None:
        return None
    return subject


async def find_subject_by_document_topic_id(document_topic_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("document_topics")
        .select(
            "document_topic_id,topics!inner(class_subjects!inner(subjects!inner(subject_id,subject_code,subject_name,status,deleted_at)))"
        )
        .eq("document_topic_id", document_topic_id)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    if not rows:
        return None

    topic = rows[0].get("topics") or {}
    class_subject = topic.get("class_subjects") or {}
    subject = class_subject.get("subjects") or {}
    if subject.get("deleted_at") is not None:
        return None
    return subject


async def find_subject_by_code(subject_code: str) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("subjects")
        .select(SUBJECT_SELECT_FIELDS)
        .eq("subject_code", subject_code)
        .is_("deleted_at", None)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


async def find_subject_by_code_excluding_id(subject_code: str, subject_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("subjects")
        .select(SUBJECT_SELECT_FIELDS)
        .eq("subject_code", subject_code)
        .neq("subject_id", subject_id)
        .is_("deleted_at", None)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


async def create_subject_record(payload: dict) -> dict:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("subjects")
        .insert(payload)
        .execute()
    )
    rows = response.data or []
    if not rows:
        raise ValueError("Unable to create subject")
    return rows[0]


def _apply_subject_filters(query, search: str | None, status: str):
    if status in {"active", "inactive"}:
        query = query.eq("status", status)
    if search:
        search_text = search.strip()
        if search_text:
            query = query.or_(f"subject_code.ilike.%{search_text}%,subject_name.ilike.%{search_text}%")
    return query


async def list_subjects(
    page: int,
    limit: int,
    search: str | None = None,
    status: str = "all",
    sort_by: str = "created_at",
    sort_order: str = "desc",
) -> tuple[list[dict], int]:
    supabase = SupabaseManager.get_client()
    start = (page - 1) * limit
    end = start + limit - 1

    query = supabase.table("subjects").select(SUBJECT_SELECT_FIELDS, count="exact").is_("deleted_at", None)
    query = _apply_subject_filters(query, search=search, status=status)
    response = await asyncio.to_thread(
        lambda: query.order(sort_by, desc=sort_order == "desc").range(start, end).execute()
    )
    return response.data or [], int(response.count or 0)


async def list_subjects_by_teacher(
    page: int,
    limit: int,
    teacher_id: int,
    search: str | None = None,
    status: str = "all",
    sort_by: str = "created_at",
    sort_order: str = "desc",
) -> tuple[list[dict], int]:
    supabase = SupabaseManager.get_client()
    start = (page - 1) * limit
    end = start + limit - 1

    query = (
        supabase.table("class_subjects")
        .select(
            "class_subject_id,class_id,subject_id,assigned_teacher_id,status,created_at,updated_at,"
            "classes!inner(class_id,class_code,class_name,status,deleted_at),"
            "subjects!inner(subject_id,subject_code,subject_name,description,status,created_at,updated_at,deleted_at)",
            count="exact",
        )
        .eq("assigned_teacher_id", teacher_id)
        .eq("status", "active")
        .is_("deleted_at", None)
        .eq("classes.status", "active")
        .is_("classes.deleted_at", None)
        .eq("subjects.status", "active")
        .is_("subjects.deleted_at", None)
    )
    if search:
        search_text = search.strip()
        if search_text:
            query = query.or_(
                f"subject_code.ilike.%{search_text}%,subject_name.ilike.%{search_text}%",
                reference_table="subjects",
            )

    order_column = {
        "subject_name": "subject_name",
        "subject_code": "subject_code",
        "created_at": "class_subject_id",
    }.get(sort_by, "class_subject_id")
    order_table = "subjects" if sort_by in {"subject_name", "subject_code"} else None

    if order_table is not None:
        response = await asyncio.to_thread(
            lambda: query.order(order_column, desc=sort_order == "desc", foreign_table=order_table).range(start, end).execute()
        )
    else:
        response = await asyncio.to_thread(
            lambda: query.order(order_column, desc=sort_order == "desc").range(start, end).execute()
        )
    rows = response.data or []
    items: list[dict] = []
    for row in rows:
        subject = row.get("subjects") or {}
        class_ref = row.get("classes") or {}
        items.append(
            {
                "subject_id": int(subject["subject_id"]) if subject.get("subject_id") is not None else None,
                "subject_code": subject.get("subject_code"),
                "subject_name": subject.get("subject_name"),
                "description": subject.get("description"),
                "status": subject.get("status"),
                "created_at": subject.get("created_at"),
                "updated_at": subject.get("updated_at"),
                "deleted_at": subject.get("deleted_at"),
                "class_subject_id": int(row["class_subject_id"]) if row.get("class_subject_id") is not None else None,
                "class_id": int(row["class_id"]) if row.get("class_id") is not None else None,
                "class_code": class_ref.get("class_code"),
                "class_name": class_ref.get("class_name"),
                "assigned_teacher_id": int(row["assigned_teacher_id"]) if row.get("assigned_teacher_id") is not None else None,
            }
        )
    return items, int(response.count or 0)


async def is_teacher_assigned_to_subject(subject_id: int, teacher_id: int) -> bool:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("class_subjects")
        .select("class_subject_id")
        .eq("subject_id", subject_id)
        .eq("assigned_teacher_id", teacher_id)
        .eq("status", "active")
        .is_("deleted_at", None)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    return len(rows) > 0


async def list_assigned_subject_ids_by_teacher(teacher_id: int) -> list[int]:
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


async def count_class_assignments_by_subject(subject_id: int) -> int:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("class_subjects")
        .select("class_subject_id", count="exact")
        .eq("subject_id", subject_id)
        .execute()
    )
    return int(response.count or 0)


async def count_practice_sets_by_subject(subject_id: int) -> int:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("practice_sets")
        .select("practice_set_id", count="exact")
        .eq("subject_id", subject_id)
        .is_("deleted_at", None)
        .execute()
    )
    return int(response.count or 0)


async def count_practice_attempts_by_subject(subject_id: int) -> int:
    supabase = SupabaseManager.get_client()
    practice_sets_response = await asyncio.to_thread(
        lambda: supabase.table("practice_sets")
        .select("practice_set_id")
        .eq("subject_id", subject_id)
        .is_("deleted_at", None)
        .execute()
    )
    practice_set_rows = practice_sets_response.data or []
    practice_set_ids = [int(item["practice_set_id"]) for item in practice_set_rows if item.get("practice_set_id") is not None]
    if not practice_set_ids:
        return 0

    attempts_response = await asyncio.to_thread(
        lambda: supabase.table("practice_attempts")
        .select("attempt_id", count="exact")
        .in_("practice_set_id", practice_set_ids)
        .is_("deleted_at", None)
        .execute()
    )
    return int(attempts_response.count or 0)


async def update_subject_by_id(subject_id: int, payload: dict) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("subjects")
        .update(payload)
        .eq("subject_id", subject_id)
        .is_("deleted_at", None)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


async def soft_delete_subject_by_id(subject_id: int) -> bool:
    supabase = SupabaseManager.get_client()
    payload = {"deleted_at": datetime.now(timezone.utc).isoformat()}

    response = await asyncio.to_thread(
        lambda: supabase.table("subjects")
        .update(payload)
        .eq("subject_id", subject_id)
        .is_("deleted_at", None)
        .execute()
    )
    rows = response.data or []
    return len(rows) > 0
