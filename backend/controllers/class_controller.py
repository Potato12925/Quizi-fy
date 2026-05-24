from fastapi import APIRouter, Depends, Query

from core.responses import error_response, success_response
from middlewares.auth_middleware import CurrentUser, require_roles
from schemas.class_schema import ClassCreateRequest, ClassUpdateRequest
from services.class_service import (
    create_class,
    delete_class,
    get_class_by_id,
    get_classes,
    update_class,
)

router = APIRouter(prefix="/classes", tags=["Classes"])


@router.post("", summary="Create class")
async def post_class(
    payload: ClassCreateRequest,
    _: CurrentUser = Depends(require_roles("admin")),
):
    try:
        result = await create_class(payload)
        return success_response(
            data=result,
            message="Class created successfully",
            status_code=201,
        )
    except ValueError as exc:
        return error_response(
            message=str(exc),
            status_code=400,
            error_code="CLASS_CREATE_INVALID",
        )
    except Exception:
        return error_response(
            message="Unable to create class",
            status_code=500,
            error_code="CLASS_CREATE_FAILED",
        )


@router.get("", summary="List classes")
async def get_class_list(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    _: CurrentUser = Depends(require_roles("admin")),
):
    try:
        result = await get_classes(page=page, limit=limit)
        return success_response(
            data=result["items"],
            meta=result["pagination"],
            message="Classes loaded successfully",
            status_code=200,
        )
    except Exception:
        return error_response(
            message="Unable to load classes",
            status_code=500,
            error_code="CLASS_LIST_FAILED",
        )


@router.get("/{class_id}", summary="Get class detail")
async def get_class_detail(
    class_id: int,
    _: CurrentUser = Depends(require_roles("admin")),
):
    try:
        result = await get_class_by_id(class_id)
        return success_response(
            data=result,
            message="Class loaded successfully",
            status_code=200,
        )
    except ValueError as exc:
        return error_response(
            message=str(exc),
            status_code=404,
            error_code="CLASS_NOT_FOUND",
        )
    except Exception:
        return error_response(
            message="Unable to load class",
            status_code=500,
            error_code="CLASS_GET_FAILED",
        )


@router.put("/{class_id}", summary="Update class")
async def put_class(
    class_id: int,
    payload: ClassUpdateRequest,
    _: CurrentUser = Depends(require_roles("admin")),
):
    try:
        result = await update_class(class_id, payload)
        return success_response(
            data=result,
            message="Class updated successfully",
            status_code=200,
        )
    except ValueError as exc:
        status_code = 404 if str(exc) == "Class not found" else 400
        return error_response(
            message=str(exc),
            status_code=status_code,
            error_code="CLASS_UPDATE_INVALID",
        )
    except Exception:
        return error_response(
            message="Unable to update class",
            status_code=500,
            error_code="CLASS_UPDATE_FAILED",
        )


@router.delete("/{class_id}", summary="Soft delete class")
async def delete_class_route(
    class_id: int,
    _: CurrentUser = Depends(require_roles("admin")),
):
    try:
        result = await delete_class(class_id)
        return success_response(
            data=result,
            message="Class deleted successfully",
            status_code=200,
        )
    except ValueError as exc:
        status_code = 404 if str(exc) == "Class not found" else 400
        return error_response(
            message=str(exc),
            status_code=status_code,
            error_code="CLASS_DELETE_INVALID",
        )
    except Exception:
        return error_response(
            message="Unable to delete class",
            status_code=500,
            error_code="CLASS_DELETE_FAILED",
        )

