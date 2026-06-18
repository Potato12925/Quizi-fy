from fastapi import APIRouter, Depends, File, Form, Query, UploadFile

from core.responses import error_response, success_response
from middlewares.auth_middleware import CurrentUser, require_roles
from schemas.image_schema import ImageUpdatePayload
from services.image_service import (
    ImageAuthorizationError,
    ImageValidationError,
    delete_image_service,
    get_image_service,
    list_images_service,
    update_image_service,
    upload_image_service,
)

router = APIRouter(prefix="/images", tags=["Images"])


@router.get("", summary="List images")
async def list_images_route(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    image_type_id: int | None = Query(default=None, ge=1),
    current_user: CurrentUser = Depends(require_roles("teacher", "admin")),
):
    try:
        result = await list_images_service(
            current_user=current_user,
            page=page,
            limit=limit,
            image_type_id=image_type_id,
        )
        return success_response(data=result["items"], meta=result["pagination"], message="Images loaded successfully", status_code=200)
    except ImageValidationError as exc:
        return error_response(message=str(exc), status_code=400, error_code="IMAGE_LIST_INVALID")
    except Exception:
        return error_response(message="Unable to load images", status_code=500, error_code="IMAGE_LIST_FAILED")


@router.get("/{image_id}", summary="Get image detail")
async def get_image_route(
    image_id: int,
    current_user: CurrentUser = Depends(require_roles("teacher", "admin")),
):
    try:
        result = await get_image_service(current_user=current_user, image_id=image_id)
        return success_response(data=result, message="Image loaded successfully", status_code=200)
    except ImageAuthorizationError as exc:
        return error_response(message=str(exc), status_code=403, error_code="IMAGE_GET_FORBIDDEN")
    except ValueError as exc:
        return error_response(message=str(exc), status_code=404, error_code="IMAGE_NOT_FOUND")
    except Exception:
        return error_response(message="Unable to load image", status_code=500, error_code="IMAGE_GET_FAILED")


@router.post("/upload", summary="Upload image")
async def upload_image_route(
    image_type_id: int = Form(..., ge=1),
    file: UploadFile = File(...),
    current_user: CurrentUser = Depends(require_roles("teacher", "admin")),
):
    try:
        file_bytes = await file.read()
        result = await upload_image_service(
            current_user=current_user,
            image_type_id=image_type_id,
            file_name=file.filename or "image.png",
            file_content_type=file.content_type or "",
            file_bytes=file_bytes,
        )
        return success_response(data=result, message="Image uploaded successfully", status_code=201)
    except ImageValidationError as exc:
        return error_response(message=str(exc), status_code=400, error_code="IMAGE_UPLOAD_INVALID")
    except Exception:
        return error_response(message="Unable to upload image", status_code=500, error_code="IMAGE_UPLOAD_FAILED")


@router.patch("/{image_id}", summary="Update image metadata")
async def update_image_route(
    image_id: int,
    payload: ImageUpdatePayload,
    current_user: CurrentUser = Depends(require_roles("teacher", "admin")),
):
    try:
        result = await update_image_service(
            current_user=current_user,
            image_id=image_id,
            file_name=payload.file_name,
        )
        return success_response(data=result, message="Image updated successfully", status_code=200)
    except ImageAuthorizationError as exc:
        return error_response(message=str(exc), status_code=403, error_code="IMAGE_UPDATE_FORBIDDEN")
    except ValueError as exc:
        return error_response(message=str(exc), status_code=404, error_code="IMAGE_NOT_FOUND")
    except Exception:
        return error_response(message="Unable to update image", status_code=500, error_code="IMAGE_UPDATE_FAILED")


@router.delete("/{image_id}", summary="Delete image")
async def delete_image_route(
    image_id: int,
    current_user: CurrentUser = Depends(require_roles("teacher", "admin")),
):
    try:
        result = await delete_image_service(current_user=current_user, image_id=image_id)
        return success_response(data=result, message="Image deleted successfully", status_code=200)
    except ImageAuthorizationError as exc:
        return error_response(message=str(exc), status_code=403, error_code="IMAGE_DELETE_FORBIDDEN")
    except ValueError as exc:
        return error_response(message=str(exc), status_code=404, error_code="IMAGE_NOT_FOUND")
    except Exception:
        return error_response(message="Unable to delete image", status_code=500, error_code="IMAGE_DELETE_FAILED")
