import asyncio

from core.supabase import SupabaseManager


async def find_user_by_username(
    username: str,
) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("users")
        .select(
            "user_id,username,password_hash,full_name,is_active,must_change_password"
        )
        .eq("username", username)
        .is_("deleted_at", None)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


async def find_user_by_id(
    user_id: int,
) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("users")
        .select(
            "user_id,username,password_hash,full_name,is_active,must_change_password,created_at,updated_at,deleted_at"
        )
        .eq("user_id", user_id)
        .is_("deleted_at", None)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


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


async def add_user_role(
    user_id: int,
    role_id: int,
) -> None:
    supabase = SupabaseManager.get_client()
    await asyncio.to_thread(
        lambda: supabase.table("user_roles")
        .insert({"user_id": user_id, "role_id": role_id})
        .execute()
    )


async def has_user_role(
    user_id: int,
    role_id: int,
) -> bool:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("user_roles")
        .select("user_role_id")
        .eq("user_id", user_id)
        .eq("role_id", role_id)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    return len(rows) > 0


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
