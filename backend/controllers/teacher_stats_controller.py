from fastapi import APIRouter, Depends, Query

from core.responses import error_response, success_response
from middlewares.auth_middleware import CurrentUser, require_roles
from services.teacher_stats_service import (
    TeacherStatsAuthorizationError,
    get_teacher_stats,
)

router = APIRouter(prefix="/teacher", tags=["Teacher Stats"])


@router.get("/stats", summary="Get teacher stats")
async def get_teacher_stats_route(
    class_subject_id: int | None = Query(default=None, ge=1),
    subject_id: int | None = Query(default=None, ge=1),
    topic_id: int | None = Query(default=None, ge=1),
    debug: bool = Query(default=False),
    current_user: CurrentUser = Depends(require_roles("teacher")),
):
    try:
        result = await get_teacher_stats(
            current_user=current_user,
            class_subject_id=class_subject_id,
            subject_id=subject_id,
            topic_id=topic_id,
            debug=debug,
        )
        return success_response(
            data=result,
            message="Teacher stats loaded successfully",
            status_code=200,
        )
    except TeacherStatsAuthorizationError as exc:
        return error_response(
            message=str(exc),
            status_code=403,
            error_code="TEACHER_STATS_FORBIDDEN",
        )
    except ValueError as exc:
        return error_response(
            message=str(exc),
            status_code=400,
            error_code="TEACHER_STATS_INVALID",
        )
    except Exception as exc:
        return error_response(
            message=str(exc),
            status_code=500,
            error_code="TEACHER_STATS_LOAD_FAILED",
        )
