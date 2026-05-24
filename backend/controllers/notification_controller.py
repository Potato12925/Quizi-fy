from fastapi import APIRouter, Depends, Query

from core.responses import error_response, success_response
from middlewares.auth_middleware import CurrentUser, require_roles
from schemas.notification_schema import NotificationCreateRequest, NotificationUpdateRequest
from services.notification_service import create_notification, delete_notification, get_notification_by_id, get_notifications, update_notification

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.post("", summary="Create notification")
async def post_notification(payload: NotificationCreateRequest, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await create_notification(payload)
        return success_response(data=result, message="Notification created successfully", status_code=201)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=400, error_code="NOTIFICATION_CREATE_INVALID")
    except Exception:
        return error_response(message="Unable to create notification", status_code=500, error_code="NOTIFICATION_CREATE_FAILED")


@router.get("", summary="List notifications")
async def get_notification_list(page: int = Query(default=1, ge=1), limit: int = Query(default=20, ge=1, le=100), _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await get_notifications(page=page, limit=limit)
        return success_response(data=result["items"], meta=result["pagination"], message="Notification loaded successfully", status_code=200)
    except Exception:
        return error_response(message="Unable to load notifications", status_code=500, error_code="NOTIFICATION_LIST_FAILED")


@router.get("/{record_id}", summary="Get notification detail")
async def get_notification_detail(record_id: int, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await get_notification_by_id(record_id)
        return success_response(data=result, message="Notification loaded successfully", status_code=200)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=404, error_code="NOTIFICATION_NOT_FOUND")
    except Exception:
        return error_response(message="Unable to load notification", status_code=500, error_code="NOTIFICATION_GET_FAILED")


@router.put("/{record_id}", summary="Update notification")
async def put_notification(record_id: int, payload: NotificationUpdateRequest, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await update_notification(record_id, payload)
        return success_response(data=result, message="Notification updated successfully", status_code=200)
    except ValueError as exc:
        status_code = 404 if str(exc) == "Notification not found" else 400
        return error_response(message=str(exc), status_code=status_code, error_code="NOTIFICATION_UPDATE_INVALID")
    except Exception:
        return error_response(message="Unable to update notification", status_code=500, error_code="NOTIFICATION_UPDATE_FAILED")


@router.delete("/{record_id}", summary="Delete notification")
async def delete_notification_route(record_id: int, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await delete_notification(record_id)
        return success_response(data=result, message="Notification deleted successfully", status_code=200)
    except ValueError as exc:
        status_code = 404 if str(exc) == "Notification not found" else 400
        return error_response(message=str(exc), status_code=status_code, error_code="NOTIFICATION_DELETE_INVALID")
    except Exception:
        return error_response(message="Unable to delete notification", status_code=500, error_code="NOTIFICATION_DELETE_FAILED")
