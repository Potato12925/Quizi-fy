from fastapi import APIRouter, Depends, Query

from core.responses import error_response, success_response
from middlewares.auth_middleware import CurrentUser, require_roles
from schemas.document_topic_schema import DocumentTopicCreateRequest, DocumentTopicUpdateRequest
from services.document_topic_service import (
    create_document_topic,
    delete_document_topic,
    get_document_topic_by_id,
    get_document_topics,
    update_document_topic,
)

router = APIRouter(prefix="/document-topics", tags=["DocumentTopics"])


@router.post("", summary="Create document_topic")
async def post_document_topic(payload: DocumentTopicCreateRequest, _: CurrentUser = Depends(require_roles("admin", "teacher"))):
    try:
        result = await create_document_topic(payload)
        return success_response(data=result, message="DocumentTopic created successfully", status_code=201)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=400, error_code="DOCUMENTTOPIC_CREATE_INVALID")
    except Exception:
        return error_response(message="Unable to create document_topic", status_code=500, error_code="DOCUMENTTOPIC_CREATE_FAILED")


@router.get("", summary="List document-topics")
async def get_document_topic_list(page: int = Query(default=1, ge=1), limit: int = Query(default=20, ge=1, le=100), _: CurrentUser = Depends(require_roles("admin", "teacher"))):
    try:
        result = await get_document_topics(page=page, limit=limit)
        return success_response(data=result["items"], meta=result["pagination"], message="DocumentTopic loaded successfully", status_code=200)
    except Exception:
        return error_response(message="Unable to load document-topics", status_code=500, error_code="DOCUMENTTOPIC_LIST_FAILED")


@router.get("/{record_id}", summary="Get document_topic detail")
async def get_document_topic_detail(record_id: int, _: CurrentUser = Depends(require_roles("admin", "teacher"))):
    try:
        result = await get_document_topic_by_id(record_id)
        return success_response(data=result, message="DocumentTopic loaded successfully", status_code=200)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=404, error_code="DOCUMENTTOPIC_NOT_FOUND")
    except Exception:
        return error_response(message="Unable to load document_topic", status_code=500, error_code="DOCUMENTTOPIC_GET_FAILED")


@router.put("/{record_id}", summary="Update document_topic")
async def put_document_topic(record_id: int, payload: DocumentTopicUpdateRequest, _: CurrentUser = Depends(require_roles("admin", "teacher"))):
    try:
        result = await update_document_topic(record_id, payload)
        return success_response(data=result, message="DocumentTopic updated successfully", status_code=200)
    except ValueError as exc:
        status_code = 404 if str(exc) == "DocumentTopic not found" else 400
        return error_response(message=str(exc), status_code=status_code, error_code="DOCUMENTTOPIC_UPDATE_INVALID")
    except Exception:
        return error_response(message="Unable to update document_topic", status_code=500, error_code="DOCUMENTTOPIC_UPDATE_FAILED")


@router.delete("/{record_id}", summary="Delete document_topic")
async def delete_document_topic_route(record_id: int, _: CurrentUser = Depends(require_roles("admin", "teacher"))):
    try:
        result = await delete_document_topic(record_id)
        return success_response(data=result, message="DocumentTopic deleted successfully", status_code=200)
    except ValueError as exc:
        status_code = 404 if str(exc) == "DocumentTopic not found" else 400
        return error_response(message=str(exc), status_code=status_code, error_code="DOCUMENTTOPIC_DELETE_INVALID")
    except Exception:
        return error_response(message="Unable to delete document_topic", status_code=500, error_code="DOCUMENTTOPIC_DELETE_FAILED")
