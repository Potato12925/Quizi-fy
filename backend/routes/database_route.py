from fastapi import APIRouter

from controllers.database_controller import check_database_connection

router = APIRouter()


@router.get("/databases/connection", summary="Test Supabase database connection")
async def get_database_connection():
    return await check_database_connection()
