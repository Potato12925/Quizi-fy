from fastapi import APIRouter, Depends

from core.responses import error_response, success_response
from middlewares.auth_middleware import CurrentUser, require_roles
from schemas.teacher_topic_management_schema import (
    TeacherAddDocumentTopicRequest,
    TeacherUpdateTopicRequest,
)
from services.teacher_topic_management_service import (
    TeacherTopicAuthorizationError,
    TeacherTopicValidationError,
    add_topic_to_teacher_document,
    get_teacher_subject_documents_topics,
    remove_topic_from_teacher_document,
    update_teacher_topic,
)

router = APIRouter(prefix="/teacher", tags=["Teacher Topic Management"])


@router.get("/subjects/documents-topics", summary="Get teacher subjects with documents and topics")
async def get_teacher_subjects_documents_topics_route(current_user: CurrentUser = Depends(require_roles("teacher"))):
    try:
        result = await get_teacher_subject_documents_topics(current_user)
        return success_response(data=result, message="Teacher subjects loaded successfully", status_code=200)
    except Exception:
        return error_response(
            message="Unable to load teacher subjects",
            status_code=500,
            error_code="TEACHER_SUBJECTS_LOAD_FAILED",
        )


@router.post("/documents/{document_id}/topics", summary="Add topic to teacher document")
async def add_topic_to_document_route(
    document_id: int,
    payload: TeacherAddDocumentTopicRequest,
    current_user: CurrentUser = Depends(require_roles("teacher")),
):
    try:
        result = await add_topic_to_teacher_document(document_id=document_id, payload=payload, current_user=current_user)
        return success_response(data=result, message="Topic added to document successfully", status_code=201)
    except TeacherTopicAuthorizationError as exc:
        return error_response(message=str(exc), status_code=403, error_code="TEACHER_DOCUMENT_FORBIDDEN")
    except TeacherTopicValidationError as exc:
        return error_response(message=str(exc), status_code=400, error_code="TEACHER_TOPIC_ADD_INVALID")
    except ValueError as exc:
        return error_response(message=str(exc), status_code=404, error_code="TEACHER_DOCUMENT_NOT_FOUND")
    except Exception:
        return error_response(message="Unable to add topic to document", status_code=500, error_code="TEACHER_TOPIC_ADD_FAILED")


@router.put("/topics/{topic_id}", summary="Update teacher topic")
async def update_teacher_topic_route(
    topic_id: int,
    payload: TeacherUpdateTopicRequest,
    current_user: CurrentUser = Depends(require_roles("teacher")),
):
    try:
        result = await update_teacher_topic(topic_id=topic_id, payload=payload, current_user=current_user)
        return success_response(data=result, message="Topic updated successfully", status_code=200)
    except TeacherTopicAuthorizationError as exc:
        return error_response(message=str(exc), status_code=403, error_code="TEACHER_TOPIC_UPDATE_FORBIDDEN")
    except TeacherTopicValidationError as exc:
        return error_response(message=str(exc), status_code=400, error_code="TEACHER_TOPIC_UPDATE_INVALID")
    except ValueError as exc:
        return error_response(message=str(exc), status_code=404, error_code="TEACHER_TOPIC_NOT_FOUND")
    except Exception:
        return error_response(message="Unable to update topic", status_code=500, error_code="TEACHER_TOPIC_UPDATE_FAILED")


@router.delete("/documents/{document_id}/topics/{topic_id}", summary="Remove topic from teacher document")
async def remove_topic_from_document_route(
    document_id: int,
    topic_id: int,
    current_user: CurrentUser = Depends(require_roles("teacher")),
):
    try:
        result = await remove_topic_from_teacher_document(document_id=document_id, topic_id=topic_id, current_user=current_user)
        return success_response(data=result, message="Topic removed from document successfully", status_code=200)
    except TeacherTopicAuthorizationError as exc:
        return error_response(message=str(exc), status_code=403, error_code="TEACHER_DOCUMENT_FORBIDDEN")
    except ValueError as exc:
        return error_response(message=str(exc), status_code=404, error_code="TEACHER_TOPIC_RELATION_NOT_FOUND")
    except Exception:
        return error_response(message="Unable to remove topic from document", status_code=500, error_code="TEACHER_TOPIC_REMOVE_FAILED")
