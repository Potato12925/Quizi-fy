import asyncio
from datetime import datetime, timezone

from core.supabase import SupabaseManager


USER_SELECT_FIELDS = "user_id,username,full_name,is_active,must_change_password"


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
        .select(USER_SELECT_FIELDS)
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
        .select(USER_SELECT_FIELDS)
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


async def list_users(page: int, limit: int) -> tuple[list[dict], int]:
    supabase = SupabaseManager.get_client()
    start = (page - 1) * limit
    end = start + limit - 1

    response = await asyncio.to_thread(
        lambda: supabase.table("users")
        .select(USER_SELECT_FIELDS, count="exact")
        .is_("deleted_at", None)
        .order("user_id")
        .range(start, end)
        .execute()
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
    payload = {"deleted_at": datetime.now(timezone.utc).isoformat()}

    response = await asyncio.to_thread(
        lambda: supabase.table("users")
        .update(payload)
        .eq("user_id", user_id)
        .is_("deleted_at", None)
        .execute()
    )

    rows = response.data or []
    return len(rows) > 0
