from core.responses import error_response, success_response
from services.supabase_service import test_supabase_connection


async def check_database_connection():
    is_connected, message = await test_supabase_connection()

    if not is_connected:
        return error_response(
            message=message,
            status_code=500,
            error_code="SUPABASE_CONNECTION_FAILED",
        )

    return success_response(
        data={"provider": "supabase", "connected": True},
        message=message,
        status_code=200,
    )
