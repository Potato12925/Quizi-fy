from math import ceil

from middlewares.auth_middleware import CurrentUser
from repositories.image_repository import (
    create_image_record,
    find_active_image_by_id,
    find_image_type_by_id,
    find_question_image_type,
    list_images,
    soft_delete_image_record,
    update_image_record,
)
from utils.hash_util import generate_sha256
from utils.question_image_util import build_image_info
from utils.storage_util import upload_question_image_file


class ImageValidationError(ValueError):
    pass


class ImageAuthorizationError(ValueError):
    pass


ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "gif"}
ALLOWED_IMAGE_MIME_TYPES = {
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
}
MAX_IMAGE_BYTES = 5 * 1024 * 1024


def _is_admin(current_user: CurrentUser) -> bool:
    return "admin" in current_user.roles


def _serialize_image(item: dict) -> dict:
    image = build_image_info(item)
    if image is None:
        raise ValueError("Image not found")

    image_type = item.get("image_types") or {}
    return {
        **image,
        "uploaded_by": int(item["uploaded_by"]) if item.get("uploaded_by") is not None else None,
        "created_at": item.get("created_at"),
        "image_type": {
            "image_type_id": int(image_type["image_type_id"]) if image_type.get("image_type_id") is not None else None,
            "type_code": image_type.get("type_code"),
            "type_name": image_type.get("type_name"),
        },
    }


def _ensure_image_access(image: dict, current_user: CurrentUser) -> None:
    if _is_admin(current_user):
        return

    uploaded_by = image.get("uploaded_by")
    if uploaded_by is None or int(uploaded_by) != current_user.user_id:
        raise ImageAuthorizationError("You do not have permission to access this image")


def _validate_image_file(
    *,
    file_name: str,
    file_content_type: str,
    file_bytes: bytes,
) -> tuple[str, int, str]:
    if not file_bytes:
        raise ImageValidationError("Image file is empty")

    file_size = len(file_bytes)
    if file_size > MAX_IMAGE_BYTES:
        raise ImageValidationError("Image file size must be 5MB or less")

    extension = file_name.rsplit(".", maxsplit=1)[-1].lower() if "." in file_name else ""
    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise ImageValidationError("Only PNG, JPG, JPEG, WEBP, and GIF files are allowed")

    mime_type = file_content_type.strip().lower()
    if mime_type not in ALLOWED_IMAGE_MIME_TYPES:
        raise ImageValidationError("Only PNG, JPG, JPEG, WEBP, and GIF files are allowed")

    return mime_type, file_size, generate_sha256(file_bytes)


async def get_image_type_or_raise(image_type_id: int) -> dict:
    image_type = await find_image_type_by_id(image_type_id)
    if not image_type:
        raise ImageValidationError("Image type not found")
    return image_type


async def resolve_question_image_type_or_raise() -> dict:
    image_type = await find_question_image_type()
    if not image_type:
        raise ImageValidationError("Question image type is not configured")
    return image_type


async def list_images_service(
    *,
    current_user: CurrentUser,
    page: int,
    limit: int,
    image_type_id: int | None = None,
) -> dict:
    if image_type_id is not None:
        await get_image_type_or_raise(image_type_id)

    owner_user_id = None if _is_admin(current_user) else current_user.user_id
    items, total = await list_images(
        page=page,
        limit=limit,
        uploaded_by=owner_user_id,
        image_type_id=image_type_id,
    )
    total_pages = ceil(total / limit) if total > 0 else 1
    return {
        "items": [_serialize_image(item) for item in items],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
        },
    }


async def get_image_service(*, current_user: CurrentUser, image_id: int) -> dict:
    record = await find_active_image_by_id(image_id)
    if not record:
        raise ValueError("Image not found")
    _ensure_image_access(record, current_user)
    return _serialize_image(record)


async def upload_image_service(
    *,
    current_user: CurrentUser,
    image_type_id: int,
    file_name: str,
    file_content_type: str,
    file_bytes: bytes,
) -> dict:
    await get_image_type_or_raise(image_type_id)
    mime_type, file_size, file_hash = _validate_image_file(
        file_name=file_name,
        file_content_type=file_content_type,
        file_bytes=file_bytes,
    )
    file_url = await upload_question_image_file(
        teacher_id=current_user.user_id,
        file_name=file_name,
        file_bytes=file_bytes,
        file_content_type=file_content_type,
    )
    created = await create_image_record(
        {
            "image_type_id": image_type_id,
            "uploaded_by": current_user.user_id,
            "file_name": file_name,
            "file_url": file_url,
            "file_hash": file_hash,
            "file_size": file_size,
            "mime_type": mime_type,
        }
    )
    record = await find_active_image_by_id(int(created["image_id"]))
    if not record:
        raise ValueError("Image not found")
    _ensure_image_access(record, current_user)
    return _serialize_image(record)


async def update_image_service(
    *,
    current_user: CurrentUser,
    image_id: int,
    file_name: str,
) -> dict:
    existing = await find_active_image_by_id(image_id)
    if not existing:
        raise ValueError("Image not found")
    _ensure_image_access(existing, current_user)

    updated = await update_image_record(
        image_id=image_id,
        payload={"file_name": file_name},
    )
    if not updated:
        raise ValueError("Image not found")

    record = await find_active_image_by_id(image_id)
    if not record:
        raise ValueError("Image not found")
    _ensure_image_access(record, current_user)
    return _serialize_image(record)


async def delete_image_service(*, current_user: CurrentUser, image_id: int) -> dict:
    existing = await find_active_image_by_id(image_id)
    if not existing:
        raise ValueError("Image not found")
    _ensure_image_access(existing, current_user)

    deleted = await soft_delete_image_record(image_id)
    if not deleted:
        raise ValueError("Image not found")
    return {"image_id": image_id, "deleted": True}
