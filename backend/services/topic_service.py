from math import ceil

from middlewares.auth_middleware import CurrentUser
from repositories.subject_repository import list_assigned_subject_ids_by_teacher
from repositories.topic_repository import (
    create_topic_record,
    find_topic_by_id,
    find_topic_by_name_and_subject,
    list_topics,
    list_topics_by_subject_ids,
    soft_delete_topic_by_id,
    update_topic_by_id,
)
from schemas.topic_schema import TopicCreateRequest, TopicUpdateRequest


class TopicValidationError(ValueError):
    pass


class TopicAuthorizationError(ValueError):
    pass


def _is_admin(current_user: CurrentUser) -> bool:
    return "admin" in current_user.roles


async def _get_teacher_subject_ids(current_user: CurrentUser) -> set[int]:
    subject_ids = await list_assigned_subject_ids_by_teacher(current_user.user_id)
    return set(subject_ids)


async def create_topic(payload: TopicCreateRequest, current_user: CurrentUser) -> dict:
    if not _is_admin(current_user):
        teacher_subject_ids = await _get_teacher_subject_ids(current_user)
        if payload.subject_id not in teacher_subject_ids:
            raise TopicAuthorizationError("You can only create topics for your assigned subjects")

    exists = await find_topic_by_name_and_subject(payload.topic_name, payload.subject_id)
    if exists:
        raise TopicValidationError("Topic name already exists in this subject")
    return await create_topic_record({"subject_id": payload.subject_id, "topic_name": payload.topic_name, "description": payload.description})


async def get_topic_by_id(record_id: int) -> dict:
    data = await find_topic_by_id(record_id)
    if not data:
        raise ValueError("Topic not found")
    return data


async def get_topic_by_id_for_user(record_id: int, current_user: CurrentUser) -> dict:
    data = await get_topic_by_id(record_id)
    if _is_admin(current_user):
        return data
    teacher_subject_ids = await _get_teacher_subject_ids(current_user)
    if int(data["subject_id"]) not in teacher_subject_ids:
        raise TopicAuthorizationError("You can only access topics for your assigned subjects")
    return data


async def get_topics(page: int, limit: int, current_user: CurrentUser, subject_id: int | None = None) -> dict:
    if not _is_admin(current_user):
        teacher_subject_ids = await _get_teacher_subject_ids(current_user)
        if subject_id is not None and subject_id not in teacher_subject_ids:
            raise TopicAuthorizationError("You can only view topics for your assigned subjects")
        if subject_id is not None:
            items, total = await list_topics(page=page, limit=limit, subject_id=subject_id)
        else:
            items, total = await list_topics_by_subject_ids(page=page, limit=limit, subject_ids=sorted(teacher_subject_ids))
    else:
        items, total = await list_topics(page=page, limit=limit, subject_id=subject_id)
    total_pages = ceil(total / limit) if total > 0 else 1
    return {"items": items, "pagination": {"page": page, "limit": limit, "total": total, "total_pages": total_pages}}


async def update_topic(record_id: int, payload: TopicUpdateRequest, current_user: CurrentUser) -> dict:
    existing = await get_topic_by_id_for_user(record_id, current_user)
    update_payload = payload.model_dump(exclude_none=True)
    if not update_payload:
        raise ValueError("No fields to update")
    if "topic_name" in update_payload:
        duplicate = await find_topic_by_name_and_subject(update_payload["topic_name"], int(existing["subject_id"]))
        if duplicate and int(duplicate["topic_id"]) != record_id:
            raise TopicValidationError("Topic name already exists in this subject")
    updated = await update_topic_by_id(record_id, update_payload)
    if not updated:
        raise ValueError("Topic not found")
    return updated


async def delete_topic(record_id: int, current_user: CurrentUser) -> dict:
    await get_topic_by_id_for_user(record_id, current_user)
    deleted = await soft_delete_topic_by_id(record_id)
    if not deleted:
        raise ValueError("Topic not found")
    return {"topic_id": record_id, "deleted": True}
