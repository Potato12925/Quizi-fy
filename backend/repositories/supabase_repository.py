import asyncio
from urllib import error, request

from core.config import Config

from core.supabase import SupabaseManager


async def check_supabase_connection() -> tuple[bool, str]:
    try:
        supabase = SupabaseManager.get_client()

        await asyncio.to_thread(
            lambda: supabase.table("users").select("user_id").limit(1).execute()
        )

        return True, "Connected to Supabase successfully"

    except Exception as exc:
        return False, f"Unable to connect to Supabase: {exc}"
