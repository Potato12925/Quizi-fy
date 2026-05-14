from fastapi import APIRouter

from controllers.database_controller import router as database_controller_router

router = APIRouter()
router.include_router(database_controller_router)
