from math import ceil

from repositories.notification_repository import (
    create_notification_record,
    find_notification_by_id,
    list_notifications,
    soft_delete_notification_by_id,
    update_notification_by_id,
)
from schemas.notification_schema import NotificationCreateRequest, NotificationUpdateRequest


async def create_notification(payload: NotificationCreateRequest) -> dict:
    return await create_notification_record({ "user_id": payload.user_id, "is_read": payload.is_read })


async def get_notification_by_id(record_id: int) -> dict:
    data = await find_notification_by_id(record_id)
    if not data:
        raise ValueError("Notification not found")
    return data


async def get_notifications(page: int, limit: int) -> dict:
    items, total = await list_notifications(page=page, limit=limit)
    total_pages = ceil(total / limit) if total > 0 else 1
    return {"items": items, "pagination": {"page": page, "limit": limit, "total": total, "total_pages": total_pages}}


async def update_notification(record_id: int, payload: NotificationUpdateRequest) -> dict:
    existing = await find_notification_by_id(record_id)
    if not existing:
        raise ValueError("Notification not found")
    update_payload = payload.model_dump(exclude_none=True)
    if not update_payload:
        raise ValueError("No fields to update")
    updated = await update_notification_by_id(record_id, update_payload)
    if not updated:
        raise ValueError("Notification not found")
    return updated


async def delete_notification(record_id: int) -> dict:
    existing = await find_notification_by_id(record_id)
    if not existing:
        raise ValueError("Notification not found")
    deleted = await soft_delete_notification_by_id(record_id)
    if not deleted:
        raise ValueError("Notification not found")
    return {"notification_id": record_id, "deleted": True}
