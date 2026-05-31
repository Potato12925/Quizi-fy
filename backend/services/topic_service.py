from math import ceil

from middlewares.auth_middleware import CurrentUser
from repositories.topic_repository import (
    create_topic_record,
    find_topic_by_id,
    find_topic_by_name_and_class_subject,
    list_assigned_class_subject_ids_by_teacher,
    list_topics,
    list_topics_by_class_subject_ids,
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


def _serialize_topic(item: dict) -> dict:
    class_subject = item.get("class_subjects") or {}
    class_ref = class_subject.get("classes") or {}
    subject_ref = class_subject.get("subjects") or {}
    return {
        "topic_id": int(item["topic_id"]),
        "topic_name": item.get("topic_name"),
        "description": item.get("description"),
        "class_subject_id": int(item["class_subject_id"]) if item.get("class_subject_id") is not None else None,
        "class_id": int(class_subject["class_id"]) if class_subject.get("class_id") is not None else None,
        "class_name": class_ref.get("class_name"),
        "subject_id": int(class_subject["subject_id"]) if class_subject.get("subject_id") is not None else None,
        "subject_name": subject_ref.get("subject_name"),
        "assigned_teacher_id": int(class_subject["assigned_teacher_id"]) if class_subject.get("assigned_teacher_id") is not None else None,
        "created_at": item.get("created_at"),
        "updated_at": item.get("updated_at"),
    }


async def _get_teacher_class_subject_ids(current_user: CurrentUser) -> set[int]:
    class_subject_ids = await list_assigned_class_subject_ids_by_teacher(current_user.user_id)
    return set(class_subject_ids)


async def create_topic(payload: TopicCreateRequest, current_user: CurrentUser) -> dict:
    if not _is_admin(current_user):
        teacher_class_subject_ids = await _get_teacher_class_subject_ids(current_user)
        if payload.class_subject_id not in teacher_class_subject_ids:
            raise TopicAuthorizationError("You can only create topics for your assigned class subjects")

    exists = await find_topic_by_name_and_class_subject(payload.topic_name, payload.class_subject_id)
    if exists:
        raise TopicValidationError("Topic name already exists in this class subject")
    created = await create_topic_record({"class_subject_id": payload.class_subject_id, "topic_name": payload.topic_name, "description": payload.description})
    return _serialize_topic(created)


async def get_topic_by_id(record_id: int) -> dict:
    data = await find_topic_by_id(record_id)
    if not data:
        raise ValueError("Topic not found")
    return data


async def get_topic_by_id_for_user(record_id: int, current_user: CurrentUser) -> dict:
    data = await get_topic_by_id(record_id)
    if _is_admin(current_user):
        return data
    teacher_class_subject_ids = await _get_teacher_class_subject_ids(current_user)
    if int(data["class_subject_id"]) not in teacher_class_subject_ids:
        raise TopicAuthorizationError("You can only access topics for your assigned class subjects")
    return _serialize_topic(data)


async def get_topics(
    page: int,
    limit: int,
    current_user: CurrentUser,
    class_subject_id: int | None = None,
    subject_id: int | None = None,
) -> dict:
    if not _is_admin(current_user):
        teacher_class_subject_ids = await _get_teacher_class_subject_ids(current_user)
        if class_subject_id is not None and class_subject_id not in teacher_class_subject_ids:
            raise TopicAuthorizationError("You can only view topics for your assigned class subjects")
        if class_subject_id is not None:
            items, total = await list_topics(
                page=page,
                limit=limit,
                class_subject_id=class_subject_id,
                subject_id=subject_id,
            )
        else:
            items, total = await list_topics_by_class_subject_ids(
                page=page,
                limit=limit,
                class_subject_ids=sorted(teacher_class_subject_ids),
                subject_id=subject_id,
            )
    else:
        items, total = await list_topics(
            page=page,
            limit=limit,
            class_subject_id=class_subject_id,
            subject_id=subject_id,
        )
    total_pages = ceil(total / limit) if total > 0 else 1
    return {
        "items": [_serialize_topic(item) for item in items],
        "pagination": {"page": page, "limit": limit, "total": total, "total_pages": total_pages},
    }


async def update_topic(record_id: int, payload: TopicUpdateRequest, current_user: CurrentUser) -> dict:
    existing = await get_topic_by_id_for_user(record_id, current_user)
    update_payload = payload.model_dump(exclude_none=True)
    if not update_payload:
        raise ValueError("No fields to update")
    if "topic_name" in update_payload:
        duplicate = await find_topic_by_name_and_class_subject(update_payload["topic_name"], int(existing["class_subject_id"]))
        if duplicate and int(duplicate["topic_id"]) != record_id:
            raise TopicValidationError("Topic name already exists in this class subject")
    updated = await update_topic_by_id(record_id, update_payload)
    if not updated:
        raise ValueError("Topic not found")
    return _serialize_topic(updated)


async def delete_topic(record_id: int, current_user: CurrentUser) -> dict:
    await get_topic_by_id_for_user(record_id, current_user)
    deleted = await soft_delete_topic_by_id(record_id)
    if not deleted:
        raise ValueError("Topic not found")
    return {"topic_id": record_id, "deleted": True}
