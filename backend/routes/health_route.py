from fastapi import APIRouter

from controllers.health_controller import router as health_controller_router

router = APIRouter()
router.include_router(health_controller_router)
