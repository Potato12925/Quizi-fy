from fastapi import APIRouter, Depends, Query

from core.responses import error_response, success_response
from middlewares.auth_middleware import CurrentUser, require_roles
from schemas.topic_schema import TopicCreateRequest, TopicUpdateRequest
from services.topic_service import (
    TopicAuthorizationError,
    TopicValidationError,
    create_topic,
    delete_topic,
    get_topic_by_id_for_user,
    get_topics,
    update_topic,
)

router = APIRouter(prefix="/topics", tags=["Topics"])


@router.post("", summary="Create topic")
async def post_topic(payload: TopicCreateRequest, current_user: CurrentUser = Depends(require_roles("admin", "teacher"))):
    try:
        result = await create_topic(payload, current_user=current_user)
        return success_response(data=result, message="Topic created successfully", status_code=201)
    except TopicAuthorizationError as exc:
        return error_response(message=str(exc), status_code=403, error_code="TOPIC_CREATE_FORBIDDEN")
    except (ValueError, TopicValidationError) as exc:
        return error_response(message=str(exc), status_code=400, error_code="TOPIC_CREATE_INVALID")
    except Exception:
        return error_response(message="Unable to create topic", status_code=500, error_code="TOPIC_CREATE_FAILED")


@router.get("", summary="List topics")
async def get_topic_list(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=200),
    subject_id: int | None = Query(default=None, ge=1),
    current_user: CurrentUser = Depends(require_roles("admin", "teacher")),
):
    try:
        result = await get_topics(page=page, limit=limit, current_user=current_user, subject_id=subject_id)
        return success_response(data=result["items"], meta=result["pagination"], message="Topic loaded successfully", status_code=200)
    except TopicAuthorizationError as exc:
        return error_response(message=str(exc), status_code=403, error_code="TOPIC_LIST_FORBIDDEN")
    except Exception:
        return error_response(message="Unable to load topics", status_code=500, error_code="TOPIC_LIST_FAILED")


@router.get("/{record_id}", summary="Get topic detail")
async def get_topic_detail(record_id: int, current_user: CurrentUser = Depends(require_roles("admin", "teacher"))):
    try:
        result = await get_topic_by_id_for_user(record_id, current_user=current_user)
        return success_response(data=result, message="Topic loaded successfully", status_code=200)
    except TopicAuthorizationError as exc:
        return error_response(message=str(exc), status_code=403, error_code="TOPIC_GET_FORBIDDEN")
    except ValueError as exc:
        return error_response(message=str(exc), status_code=404, error_code="TOPIC_NOT_FOUND")
    except Exception:
        return error_response(message="Unable to load topic", status_code=500, error_code="TOPIC_GET_FAILED")


@router.put("/{record_id}", summary="Update topic")
async def put_topic(record_id: int, payload: TopicUpdateRequest, current_user: CurrentUser = Depends(require_roles("admin", "teacher"))):
    try:
        result = await update_topic(record_id, payload, current_user=current_user)
        return success_response(data=result, message="Topic updated successfully", status_code=200)
    except TopicAuthorizationError as exc:
        return error_response(message=str(exc), status_code=403, error_code="TOPIC_UPDATE_FORBIDDEN")
    except (ValueError, TopicValidationError) as exc:
        status_code = 404 if str(exc) == "Topic not found" else 400
        return error_response(message=str(exc), status_code=status_code, error_code="TOPIC_UPDATE_INVALID")
    except Exception:
        return error_response(message="Unable to update topic", status_code=500, error_code="TOPIC_UPDATE_FAILED")


@router.delete("/{record_id}", summary="Delete topic")
async def delete_topic_route(record_id: int, current_user: CurrentUser = Depends(require_roles("admin", "teacher"))):
    try:
        result = await delete_topic(record_id, current_user=current_user)
        return success_response(data=result, message="Topic deleted successfully", status_code=200)
    except TopicAuthorizationError as exc:
        return error_response(message=str(exc), status_code=403, error_code="TOPIC_DELETE_FORBIDDEN")
    except ValueError as exc:
        status_code = 404 if str(exc) == "Topic not found" else 400
        return error_response(message=str(exc), status_code=status_code, error_code="TOPIC_DELETE_INVALID")
    except Exception:
        return error_response(message="Unable to delete topic", status_code=500, error_code="TOPIC_DELETE_FAILED")
