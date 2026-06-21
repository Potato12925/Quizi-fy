from math import ceil

from middlewares.auth_middleware import CurrentUser
from repositories.subject_repository import (
    count_class_assignments_by_subject,
    count_practice_attempts_by_subject,
    count_practice_sets_by_subject,
    create_subject_record,
    find_subject_by_code,
    find_subject_by_code_excluding_id,
    find_subject_by_id,
    is_teacher_assigned_to_subject,
    list_subjects,
    list_subjects_by_teacher,
    soft_delete_subject_by_id,
    update_subject_by_id,
)
from schemas.subject_schema import SubjectCreateRequest, SubjectListQueryParams, SubjectUpdateRequest


class SubjectAuthorizationError(ValueError):
    pass


class SubjectInUseError(ValueError):
    pass


class SubjectAssignedToClassError(SubjectInUseError):
    pass


class SubjectHasPracticeHistoryError(SubjectInUseError):
    pass


def _is_admin(current_user: CurrentUser) -> bool:
    return "admin" in current_user.roles


async def _ensure_subject_access(subject_id: int, current_user: CurrentUser) -> None:
    if _is_admin(current_user):
        return
    is_assigned = await is_teacher_assigned_to_subject(subject_id=subject_id, teacher_id=current_user.user_id)
    if not is_assigned:
        raise SubjectAuthorizationError("You can only access your assigned subjects")


async def create_subject(payload: SubjectCreateRequest) -> dict:
    existing_subject = await find_subject_by_code(payload.subject_code)
    if existing_subject:
        raise ValueError("Subject code already exists")

    created = await create_subject_record(
        {
            "subject_code": payload.subject_code,
            "subject_name": payload.subject_name,
            "description": payload.description,
            "status": "active",
        }
    )
    return created


async def get_subject_by_id(subject_id: int, current_user: CurrentUser) -> dict:
    subject = await find_subject_by_id(subject_id)
    if not subject:
        raise ValueError("Subject not found")
    await _ensure_subject_access(subject_id, current_user)
    return subject


async def get_subjects(params: SubjectListQueryParams, current_user: CurrentUser) -> dict:
    if _is_admin(current_user):
        items, total = await list_subjects(
            page=params.page,
            limit=params.limit,
            search=params.search,
            status=params.status,
            sort_by=params.sort_by,
            sort_order=params.sort_order,
        )
    else:
        items, total = await list_subjects_by_teacher(
            page=params.page,
            limit=params.limit,
            teacher_id=current_user.user_id,
            search=params.search,
            status=params.status,
            sort_by=params.sort_by,
            sort_order=params.sort_order,
        )
    total_pages = ceil(total / params.limit) if total > 0 else 1
    return {
        "items": items,
        "pagination": {
            "page": params.page,
            "limit": params.limit,
            "total": total,
            "total_pages": total_pages,
        },
    }


async def update_subject(subject_id: int, payload: SubjectUpdateRequest, current_user: CurrentUser) -> dict:
    existing_subject = await find_subject_by_id(subject_id)
    if not existing_subject:
        raise ValueError("Subject not found")
    await _ensure_subject_access(subject_id, current_user)

    update_payload: dict = {}
    if payload.subject_code is not None:
        if payload.subject_code != existing_subject["subject_code"]:
            code_exists = await find_subject_by_code_excluding_id(payload.subject_code, subject_id=subject_id)
            if code_exists:
                raise ValueError("Subject code already exists")
        update_payload["subject_code"] = payload.subject_code
    if payload.subject_name is not None:
        update_payload["subject_name"] = payload.subject_name
    if payload.status is not None:
        update_payload["status"] = payload.status
    if payload.description is not None:
        update_payload["description"] = payload.description

    if not update_payload:
        raise ValueError("No fields to update")

    updated = await update_subject_by_id(subject_id, update_payload)
    if not updated:
        raise ValueError("Subject not found")
    return updated


async def delete_subject(subject_id: int, current_user: CurrentUser) -> dict:
    existing_subject = await find_subject_by_id(subject_id)
    if not existing_subject:
        raise ValueError("Subject not found")
    await _ensure_subject_access(subject_id, current_user)

    class_assignment_count = await count_class_assignments_by_subject(subject_id)
    if class_assignment_count > 0:
        raise SubjectAssignedToClassError(
            "Môn học đã được gán vào lớp và không thể xóa. Vui lòng chuyển sang trạng thái tạm khóa."
        )

    practice_set_count = await count_practice_sets_by_subject(subject_id)
    practice_attempt_count = await count_practice_attempts_by_subject(subject_id)
    if practice_set_count > 0 or practice_attempt_count > 0:
        raise SubjectHasPracticeHistoryError(
            "Môn học đã có dữ liệu practice/history nên không thể xóa. Vui lòng chuyển sang trạng thái tạm khóa."
        )

    deleted = await soft_delete_subject_by_id(subject_id)
    if not deleted:
        raise ValueError("Subject not found")

    return {"subject_id": subject_id, "deleted": True}
