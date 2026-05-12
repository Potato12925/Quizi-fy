from repositories.supabase_repository import check_supabase_connection


async def test_supabase_connection() -> tuple[bool, str]:
    return await check_supabase_connection()
