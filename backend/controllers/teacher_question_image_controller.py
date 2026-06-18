from fastapi import APIRouter, Depends, File, Query, UploadFile

from core.responses import error_response, success_response
from middlewares.auth_middleware import CurrentUser, require_roles
from schemas.image_schema import ImageUpdatePayload
from services.image_service import (
    ImageAuthorizationError,
    ImageValidationError,
    delete_image_service,
    get_image_service,
    list_images_service,
    resolve_question_image_type_or_raise,
    update_image_service,
    upload_image_service,
)

# Compatibility wrapper for legacy frontend routes.
router = APIRouter(prefix="/teacher/question-images", tags=["Teacher Question Images"])


async def _get_question_image_type_id() -> int:
    question_image_type = await resolve_question_image_type_or_raise()
    return int(question_image_type["image_type_id"])


async def _get_question_image_or_raise(current_user: CurrentUser, image_id: int) -> dict:
    result = await get_image_service(current_user=current_user, image_id=image_id)
    if int(result.get("image_type", {}).get("image_type_id") or 0) != await _get_question_image_type_id():
        raise ValueError("Image not found")
    return result


@router.get("", summary="List teacher question images")
async def list_teacher_question_images_route(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: CurrentUser = Depends(require_roles("teacher", "admin")),
):
    try:
        result = await list_images_service(
            current_user=current_user,
            page=page,
            limit=limit,
            image_type_id=await _get_question_image_type_id(),
        )
        return success_response(data=result["items"], meta=result["pagination"], message="Question images loaded successfully", status_code=200)
    except ImageValidationError:
        return error_response(message="Unable to load question images", status_code=500, error_code="QUESTION_IMAGE_LIST_FAILED")
    except Exception:
        return error_response(message="Unable to load question images", status_code=500, error_code="QUESTION_IMAGE_LIST_FAILED")


@router.get("/{image_id}", summary="Get teacher question image detail")
async def get_teacher_question_image_route(
    image_id: int,
    current_user: CurrentUser = Depends(require_roles("teacher", "admin")),
):
    try:
        result = await _get_question_image_or_raise(current_user=current_user, image_id=image_id)
        return success_response(data=result, message="Question image loaded successfully", status_code=200)
    except ImageAuthorizationError as exc:
        return error_response(message=str(exc), status_code=403, error_code="QUESTION_IMAGE_GET_FORBIDDEN")
    except ValueError as exc:
        return error_response(message=str(exc), status_code=404, error_code="QUESTION_IMAGE_NOT_FOUND")
    except Exception:
        return error_response(message="Unable to load question image", status_code=500, error_code="QUESTION_IMAGE_GET_FAILED")


@router.post("/upload", summary="Upload teacher question image")
async def upload_teacher_question_image_route(
    file: UploadFile = File(...),
    current_user: CurrentUser = Depends(require_roles("teacher", "admin")),
):
    try:
        file_bytes = await file.read()
        result = await upload_image_service(
            current_user=current_user,
            image_type_id=await _get_question_image_type_id(),
            file_name=file.filename or "question-image.png",
            file_content_type=file.content_type or "",
            file_bytes=file_bytes,
        )
        return success_response(data=result, message="Question image uploaded successfully", status_code=201)
    except ImageValidationError as exc:
        return error_response(message=str(exc), status_code=400, error_code="QUESTION_IMAGE_UPLOAD_INVALID")
    except Exception:
        return error_response(message="Unable to upload question image", status_code=500, error_code="QUESTION_IMAGE_UPLOAD_FAILED")


@router.patch("/{image_id}", summary="Update teacher question image metadata")
async def update_teacher_question_image_route(
    image_id: int,
    payload: ImageUpdatePayload,
    current_user: CurrentUser = Depends(require_roles("teacher", "admin")),
):
    try:
        await _get_question_image_or_raise(current_user=current_user, image_id=image_id)
        result = await update_image_service(
            current_user=current_user,
            image_id=image_id,
            file_name=payload.file_name,
        )
        return success_response(data=result, message="Question image updated successfully", status_code=200)
    except ImageAuthorizationError as exc:
        return error_response(message=str(exc), status_code=403, error_code="QUESTION_IMAGE_UPDATE_FORBIDDEN")
    except ValueError as exc:
        return error_response(message=str(exc), status_code=404, error_code="QUESTION_IMAGE_NOT_FOUND")
    except Exception:
        return error_response(message="Unable to update question image", status_code=500, error_code="QUESTION_IMAGE_UPDATE_FAILED")


@router.delete("/{image_id}", summary="Delete teacher question image")
async def delete_teacher_question_image_route(
    image_id: int,
    current_user: CurrentUser = Depends(require_roles("teacher", "admin")),
):
    try:
        await _get_question_image_or_raise(current_user=current_user, image_id=image_id)
        result = await delete_image_service(current_user=current_user, image_id=image_id)
        return success_response(data=result, message="Question image deleted successfully", status_code=200)
    except ImageAuthorizationError as exc:
        return error_response(message=str(exc), status_code=403, error_code="QUESTION_IMAGE_DELETE_FORBIDDEN")
    except ValueError as exc:
        return error_response(message=str(exc), status_code=404, error_code="QUESTION_IMAGE_NOT_FOUND")
    except Exception:
        return error_response(message="Unable to delete question image", status_code=500, error_code="QUESTION_IMAGE_DELETE_FAILED")
