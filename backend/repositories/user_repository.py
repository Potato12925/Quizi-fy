import asyncio
from datetime import datetime, timezone

from core.supabase import SupabaseManager


USER_SELECT_FIELDS = "user_id,username,full_name,is_active,must_change_password"
USER_SELECT_FIELDS_WITH_AUDIT = "user_id,username,full_name,is_active,must_change_password,created_at,updated_at,deleted_at"


async def find_role_id_by_code(role_code: str) -> int | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("roles")
        .select("role_id")
        .eq("role_code", role_code)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    if not rows:
        return None
    return int(rows[0]["role_id"])


async def create_user_record(payload: dict) -> dict:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("users")
        .insert(payload)
        .execute()
    )
    rows = response.data or []
    if not rows:
        raise ValueError("Unable to create user")
    return rows[0]


async def assign_role_to_user(user_id: int, role_id: int) -> None:
    supabase = SupabaseManager.get_client()
    await asyncio.to_thread(
        lambda: supabase.table("user_roles")
        .insert({"user_id": user_id, "role_id": role_id})
        .execute()
    )


async def find_user_by_username(username: str) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("users")
        .select(USER_SELECT_FIELDS_WITH_AUDIT)
        .eq("username", username)
        .is_("deleted_at", None)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


async def find_user_by_id(user_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("users")
        .select(USER_SELECT_FIELDS_WITH_AUDIT)
        .eq("user_id", user_id)
        .is_("deleted_at", None)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


async def find_role_codes_by_user_id(user_id: int) -> list[str]:
    supabase = SupabaseManager.get_client()
    user_roles = await asyncio.to_thread(
        lambda: supabase.table("user_roles")
        .select("role_id")
        .eq("user_id", user_id)
        .execute()
    )
    role_rows = user_roles.data or []
    role_ids = [row["role_id"] for row in role_rows]

    if not role_ids:
        return []

    roles = await asyncio.to_thread(
        lambda: supabase.table("roles")
        .select("role_code")
        .in_("role_id", role_ids)
        .execute()
    )
    role_data = roles.data or []
    return [row["role_code"] for row in role_data]


async def find_role_codes_by_user_ids(user_ids: list[int]) -> dict[int, list[str]]:
    if not user_ids:
        return {}

    supabase = SupabaseManager.get_client()

    user_roles_response = await asyncio.to_thread(
        lambda: supabase.table("user_roles")
        .select("user_id,role_id")
        .in_("user_id", user_ids)
        .execute()
    )
    user_role_rows = user_roles_response.data or []
    role_ids = sorted({int(row["role_id"]) for row in user_role_rows})

    if not role_ids:
        return {user_id: [] for user_id in user_ids}

    roles_response = await asyncio.to_thread(
        lambda: supabase.table("roles")
        .select("role_id,role_code")
        .in_("role_id", role_ids)
        .execute()
    )
    role_rows = roles_response.data or []

    role_map = {
        int(row["role_id"]): row["role_code"]
        for row in role_rows
    }

    user_roles_map = {user_id: [] for user_id in user_ids}
    for row in user_role_rows:
        current_user_id = int(row["user_id"])
        role_code = role_map.get(int(row["role_id"]))
        if role_code is not None:
            user_roles_map.setdefault(current_user_id, []).append(role_code)

    return user_roles_map


async def list_users(
    page: int,
    limit: int,
    status: str = "all",
    search: str | None = None,
    include_deleted: bool = False,
    user_ids: list[int] | None = None,
) -> tuple[list[dict], int]:
    supabase = SupabaseManager.get_client()
    start = (page - 1) * limit
    end = start + limit - 1

    response = await asyncio.to_thread(
        lambda: (
            _build_list_users_query(
                supabase=supabase,
                status=status,
                search=search,
                include_deleted=include_deleted,
                user_ids=user_ids,
            )
            .order("user_id")
            .range(start, end)
            .execute()
        )
    )

    return response.data or [], int(response.count or 0)


async def update_user_by_id(user_id: int, payload: dict) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("users")
        .update(payload)
        .eq("user_id", user_id)
        .is_("deleted_at", None)
        .execute()
    )

    rows = response.data or []
    return rows[0] if rows else None


async def soft_delete_user_by_id(user_id: int) -> bool:
    supabase = SupabaseManager.get_client()
    payload = {
        "deleted_at": datetime.now(timezone.utc).isoformat(),
        "is_active": False,
    }

    response = await asyncio.to_thread(
        lambda: supabase.table("users")
        .update(payload)
        .eq("user_id", user_id)
        .is_("deleted_at", None)
        .execute()
    )

    rows = response.data or []
    return len(rows) > 0


def _build_list_users_query(
    supabase,
    status: str,
    search: str | None,
    include_deleted: bool,
    user_ids: list[int] | None = None,
):
    query = supabase.table("users").select(USER_SELECT_FIELDS_WITH_AUDIT, count="exact")
    if not include_deleted:
        query = query.is_("deleted_at", None)

    if status == "active":
        query = query.eq("is_active", True)
    if status == "inactive":
        query = query.eq("is_active", False)

    if search:
        search_text = search.strip()
        if search_text:
            query = query.or_(f"username.ilike.%{search_text}%,full_name.ilike.%{search_text}%")

    return query


async def find_user_ids_by_role_code(role_code: str) -> list[int]:
    supabase = SupabaseManager.get_client()
    role_response = await asyncio.to_thread(
        lambda: supabase.table("roles")
        .select("role_id")
        .eq("role_code", role_code)
        .limit(1)
        .execute()
    )
    role_rows = role_response.data or []
    if not role_rows:
        return []

    role_id = int(role_rows[0]["role_id"])
    user_role_response = await asyncio.to_thread(
        lambda: supabase.table("user_roles")
        .select("user_id")
        .eq("role_id", role_id)
        .execute()
    )
    user_role_rows = user_role_response.data or []
    return [int(row["user_id"]) for row in user_role_rows]


async def find_active_class_student_mapping(class_id: int, student_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("class_students")
        .select("class_student_id,class_id,student_id")
        .eq("class_id", class_id)
        .eq("student_id", student_id)
        .is_("deleted_at", None)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


async def create_class_student_mapping(class_id: int, student_id: int, invited_by: int) -> dict:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("class_students")
        .insert({"class_id": class_id, "student_id": student_id, "invited_by": invited_by})
        .execute()
    )
    rows = response.data or []
    if not rows:
        raise ValueError("Unable to assign student to class")
    return rows[0]


async def find_active_class_teacher_mapping(class_id: int, teacher_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("class_teachers")
        .select("class_teacher_id,class_id,teacher_id")
        .eq("class_id", class_id)
        .eq("teacher_id", teacher_id)
        .is_("deleted_at", None)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


async def create_class_teacher_mapping(class_id: int, teacher_id: int, added_by: int) -> dict:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("class_teachers")
        .insert({"class_id": class_id, "teacher_id": teacher_id, "added_by": added_by})
        .execute()
    )
    rows = response.data or []
    if not rows:
        raise ValueError("Unable to assign teacher to class")
    return rows[0]
    if user_ids is not None:
        if not user_ids:
            return query.in_("user_id", [-1])
        query = query.in_("user_id", user_ids)
