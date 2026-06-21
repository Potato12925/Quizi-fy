from fastapi import APIRouter, Depends, Query

from core.responses import error_response, success_response
from middlewares.auth_middleware import CurrentUser, require_roles
from schemas.subject_schema import SubjectCreateRequest, SubjectListQueryParams, SubjectUpdateRequest
from services.subject_service import (
    SubjectAssignedToClassError,
    SubjectAuthorizationError,
    SubjectHasPracticeHistoryError,
    SubjectInUseError,
    create_subject,
    delete_subject,
    get_subject_by_id,
    get_subjects,
    update_subject,
)

router = APIRouter(prefix="/subjects", tags=["Subjects"])


@router.post("", summary="Create subject")
async def post_subject(
    payload: SubjectCreateRequest,
    _: CurrentUser = Depends(require_roles("admin")),
):
    try:
        result = await create_subject(payload)
        return success_response(
            data=result,
            message="Subject created successfully",
            status_code=201,
        )
    except ValueError as exc:
        return error_response(
            message=str(exc),
            status_code=400,
            error_code="SUBJECT_CREATE_INVALID",
        )
    except Exception:
        return error_response(
            message="Unable to create subject",
            status_code=500,
            error_code="SUBJECT_CREATE_FAILED",
        )


@router.get("", summary="List subjects")
async def get_subject_list(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=10000),
    search: str | None = Query(default=None),
    status: str = Query(default="all"),
    sort_by: str = Query(default="created_at"),
    sort_order: str = Query(default="desc"),
    current_user: CurrentUser = Depends(require_roles("admin", "teacher")),
):
    try:
        params = SubjectListQueryParams(
            page=page,
            limit=limit,
            search=search,
            status=status,  # type: ignore[arg-type]
            sort_by=sort_by,  # type: ignore[arg-type]
            sort_order=sort_order,  # type: ignore[arg-type]
        )
        result = await get_subjects(params=params, current_user=current_user)
        return success_response(
            data=result["items"],
            meta=result["pagination"],
            message="Subjects loaded successfully",
            status_code=200,
        )
    except ValueError as exc:
        return error_response(
            message=str(exc),
            status_code=400,
            error_code="SUBJECT_LIST_INVALID",
        )
    except Exception:
        return error_response(
            message="Unable to load subjects",
            status_code=500,
            error_code="SUBJECT_LIST_FAILED",
        )


@router.get("/{subject_id}", summary="Get subject detail")
async def get_subject_detail(
    subject_id: int,
    current_user: CurrentUser = Depends(require_roles("admin", "teacher")),
):
    try:
        result = await get_subject_by_id(subject_id, current_user=current_user)
        return success_response(
            data=result,
            message="Subject loaded successfully",
            status_code=200,
        )
    except SubjectAuthorizationError as exc:
        return error_response(
            message=str(exc),
            status_code=403,
            error_code="SUBJECT_GET_FORBIDDEN",
        )
    except ValueError as exc:
        return error_response(
            message=str(exc),
            status_code=404,
            error_code="SUBJECT_NOT_FOUND",
        )
    except Exception:
        return error_response(
            message="Unable to load subject",
            status_code=500,
            error_code="SUBJECT_GET_FAILED",
        )


@router.put("/{subject_id}", summary="Update subject")
async def put_subject(
    subject_id: int,
    payload: SubjectUpdateRequest,
    current_user: CurrentUser = Depends(require_roles("admin")),
):
    try:
        result = await update_subject(subject_id, payload, current_user=current_user)
        return success_response(
            data=result,
            message="Subject updated successfully",
            status_code=200,
        )
    except SubjectAuthorizationError as exc:
        return error_response(
            message=str(exc),
            status_code=403,
            error_code="SUBJECT_UPDATE_FORBIDDEN",
        )
    except ValueError as exc:
        status_code = 404 if str(exc) == "Subject not found" else 400
        return error_response(
            message=str(exc),
            status_code=status_code,
            error_code="SUBJECT_UPDATE_INVALID",
        )
    except Exception:
        return error_response(
            message="Unable to update subject",
            status_code=500,
            error_code="SUBJECT_UPDATE_FAILED",
        )


@router.delete("/{subject_id}", summary="Soft delete subject")
async def delete_subject_route(
    subject_id: int,
    current_user: CurrentUser = Depends(require_roles("admin")),
):
    try:
        result = await delete_subject(subject_id, current_user=current_user)
        return success_response(
            data=result,
            message="Subject deleted successfully",
            status_code=200,
        )
    except SubjectAuthorizationError as exc:
        return error_response(
            message=str(exc),
            status_code=403,
            error_code="SUBJECT_DELETE_FORBIDDEN",
        )
    except SubjectAssignedToClassError as exc:
        return error_response(
            message=str(exc),
            status_code=409,
            error_code="SUBJECT_DELETE_ASSIGNED_TO_CLASS",
        )
    except SubjectHasPracticeHistoryError as exc:
        return error_response(
            message=str(exc),
            status_code=409,
            error_code="SUBJECT_DELETE_HAS_PRACTICE_HISTORY",
        )
    except SubjectInUseError as exc:
        return error_response(
            message=str(exc),
            status_code=409,
            error_code="SUBJECT_DELETE_IN_USE",
        )
    except ValueError as exc:
        status_code = 404 if str(exc) == "Subject not found" else 400
        return error_response(
            message=str(exc),
            status_code=status_code,
            error_code="SUBJECT_DELETE_INVALID",
        )
    except Exception:
        return error_response(
            message="Unable to delete subject",
            status_code=500,
            error_code="SUBJECT_DELETE_FAILED",
        )
