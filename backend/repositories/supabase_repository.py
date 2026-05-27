from core.supabase import SupabaseManager, run_supabase_execute


async def check_supabase_connection() -> tuple[bool, str]:
    try:
        supabase = SupabaseManager.get_client()

        await run_supabase_execute(
            lambda: supabase.table("users").select("user_id").limit(1).execute()
        )

        return True, "Connected to Supabase successfully"

    except Exception as exc:
        return False, f"Unable to connect to Supabase: {exc}"
