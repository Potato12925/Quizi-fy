from fastapi import APIRouter

from controllers.health_controller import health_check

router = APIRouter()


@router.get("/health", summary="Health check")
async def get_health():
    return await health_check()
