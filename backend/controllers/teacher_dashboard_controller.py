from fastapi import APIRouter, Depends, Query

from core.responses import error_response, success_response
from middlewares.auth_middleware import CurrentUser, require_roles
from services.teacher_dashboard_service import get_teacher_dashboard_stats

router = APIRouter(prefix="/teacher/dashboard", tags=["Teacher Dashboard"])


@router.get("/stats", summary="Get teacher dashboard stats")
async def get_teacher_dashboard_stats_route(
    recent_limit: int = Query(default=5, ge=1, le=20),
    current_user: CurrentUser = Depends(require_roles("teacher")),
):
    try:
        result = await get_teacher_dashboard_stats(
            current_user=current_user,
            recent_limit=recent_limit,
        )
        return success_response(
            data=result,
            message="Teacher dashboard loaded successfully",
            status_code=200,
        )
    except Exception:
        return error_response(
            message="Unable to load teacher dashboard",
            status_code=500,
            error_code="TEACHER_DASHBOARD_LOAD_FAILED",
        )
