from fastapi import APIRouter

from core.responses import success_response

router = APIRouter()

@router.get("/health", summary="Health check")
async def get_health():
    return success_response(
        data={"status": "ok"},
        message="Backend is running",
        status_code=200,
    )
