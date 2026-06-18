from repositories.image_repository import find_image_by_id, list_images_by_ids


class QuestionImageValidationError(ValueError):
    def __init__(self, message: str, error_code: str, status_code: int = 400):
        super().__init__(message)
        self.error_code = error_code
        self.status_code = status_code


def build_image_info(image_row: dict | None) -> dict | None:
    if not image_row or image_row.get("deleted_at") is not None:
        return None

    image_id = image_row.get("image_id")
    if image_id is None:
        return None

    return {
        "image_id": int(image_id),
        "file_url": image_row.get("file_url"),
        "file_name": image_row.get("file_name"),
        "mime_type": image_row.get("mime_type"),
        "file_size": int(image_row["file_size"]) if image_row.get("file_size") is not None else None,
    }


async def validate_question_image(image_id: int | None, owner_user_id: int | None = None) -> dict | None:
    if image_id is None:
        return None

    image = await find_image_by_id(image_id)
    if not image or image.get("deleted_at") is not None:
        raise QuestionImageValidationError(
            message="Question image not found",
            error_code="QUESTION_IMAGE_NOT_FOUND",
            status_code=400,
        )

    image_type = image.get("image_types") or {}
    if image_type.get("type_code") != "question_image":
        raise QuestionImageValidationError(
            message="Question image must use type question_image",
            error_code="QUESTION_IMAGE_INVALID_TYPE",
            status_code=400,
        )

    if owner_user_id is not None and int(image.get("uploaded_by") or 0) != owner_user_id:
        raise QuestionImageValidationError(
            message="You do not have permission to use this question image",
            error_code="QUESTION_IMAGE_FORBIDDEN",
            status_code=403,
        )

    return image


async def load_question_image_map(items: list[dict]) -> dict[int, dict]:
    image_ids = sorted(
        {
            int(item["image_id"])
            for item in items
            if item.get("image_id") is not None
        }
    )
    if not image_ids:
        return {}

    rows = await list_images_by_ids(image_ids)
    return {
        int(item["image_id"]): item
        for item in rows
        if item.get("image_id") is not None and item.get("deleted_at") is None
    }
