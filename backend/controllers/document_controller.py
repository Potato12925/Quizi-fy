from fastapi import APIRouter, Depends, File, Form, Query, UploadFile

from core.responses import error_response, success_response
from middlewares.auth_middleware import CurrentUser, require_roles
from schemas.document_schema import DocumentCreateRequest, DocumentUpdateRequest, DocumentUploadRequest
from services.document_service import (
    DocumentAuthorizationError,
    DocumentSubjectInactiveError,
    DocumentValidationError,
    create_document,
    delete_document,
    get_document_by_id,
    get_documents,
    update_document,
    upload_teacher_document,
)

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/upload", summary="Upload document for assigned class subject")
async def upload_document_route(
    topic_ids: list[int] = Form(default=[]),
    title: str = Form(..., min_length=1, max_length=500),
    description: str | None = Form(default=None, max_length=1000),
    file: UploadFile = File(...),
    current_user: CurrentUser = Depends(require_roles("admin", "teacher")),
):
    try:
        payload = DocumentUploadRequest(
            topic_ids=topic_ids,
            title=title,
            description=description,
        )
        file_bytes = await file.read()

        result = await upload_teacher_document(
            teacher_id=current_user.user_id,
            payload=payload,
            file_name=file.filename or "document.txt",
            file_content_type=file.content_type or "",
            file_bytes=file_bytes,
        )
        return success_response(data=result, message="Document uploaded successfully", status_code=201)
    except DocumentSubjectInactiveError as exc:
        return error_response(message=str(exc), status_code=409, error_code="DOCUMENT_UPLOAD_SUBJECT_INACTIVE")
    except DocumentAuthorizationError as exc:
        return error_response(message=str(exc), status_code=403, error_code="DOCUMENT_UPLOAD_FORBIDDEN")
    except DocumentValidationError as exc:
        return error_response(message=str(exc), status_code=400, error_code="DOCUMENT_UPLOAD_INVALID")
    except Exception:
        return error_response(message="Unable to upload document", status_code=500, error_code="DOCUMENT_UPLOAD_FAILED")


@router.post("", summary="Create document")
async def post_document(payload: DocumentCreateRequest, current_user: CurrentUser = Depends(require_roles("admin", "teacher"))):
    try:
        result = await create_document(payload, current_user=current_user)
        return success_response(data=result, message="Document created successfully", status_code=201)
    except DocumentSubjectInactiveError as exc:
        return error_response(message=str(exc), status_code=409, error_code="DOCUMENT_CREATE_SUBJECT_INACTIVE")
    except DocumentAuthorizationError as exc:
        return error_response(message=str(exc), status_code=403, error_code="DOCUMENT_CREATE_FORBIDDEN")
    except ValueError as exc:
        return error_response(message=str(exc), status_code=400, error_code="DOCUMENT_CREATE_INVALID")
    except Exception:
        return error_response(message="Unable to create document", status_code=500, error_code="DOCUMENT_CREATE_FAILED")


@router.get("", summary="List documents")
async def get_document_list(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(default=None),
    class_subject_id: int | None = Query(default=None, ge=1),
    topic_id: int | None = Query(default=None, ge=1),
    uploaded_from: str | None = Query(default=None),
    uploaded_to: str | None = Query(default=None),
    status: str | None = Query(default="active"),
    current_user: CurrentUser = Depends(require_roles("admin", "teacher")),
):
    try:
        result = await get_documents(
            page=page,
            limit=limit,
            search=search,
            class_subject_id=class_subject_id,
            topic_id=topic_id,
            uploaded_from=uploaded_from,
            uploaded_to=uploaded_to,
            status=status,
            current_user=current_user,
        )
        return success_response(data=result["items"], meta=result["pagination"], message="Document loaded successfully", status_code=200)
    except Exception as exc:
        return error_response(message=str(exc), status_code=500, error_code="DOCUMENT_LIST_FAILED")


@router.get("/{record_id}", summary="Get document detail")
async def get_document_detail(record_id: int, current_user: CurrentUser = Depends(require_roles("admin", "teacher"))):
    try:
        result = await get_document_by_id(record_id, current_user=current_user)
        return success_response(data=result, message="Document loaded successfully", status_code=200)
    except DocumentAuthorizationError as exc:
        return error_response(message=str(exc), status_code=403, error_code="DOCUMENT_GET_FORBIDDEN")
    except ValueError as exc:
        return error_response(message=str(exc), status_code=404, error_code="DOCUMENT_NOT_FOUND")
    except Exception:
        return error_response(message="Unable to load document", status_code=500, error_code="DOCUMENT_GET_FAILED")


@router.put("/{record_id}", summary="Update document")
async def put_document(
    record_id: int,
    title: str | None = Form(default=None),
    description: str | None = Form(default=None),
    topic_ids: list[int] | None = Form(default=None),
    status: str | None = Form(default=None),
    file: UploadFile | None = File(default=None),
    current_user: CurrentUser = Depends(require_roles("admin", "teacher")),
):
    try:
        payload = DocumentUpdateRequest(
            title=title,
            description=description,
            topic_ids=topic_ids,
            status=status,
        )
        file_bytes = await file.read() if file else None
        result = await update_document(
            record_id,
            payload,
            current_user=current_user,
            file_name=file.filename if file else None,
            file_content_type=file.content_type if file else None,
            file_bytes=file_bytes,
        )
        return success_response(data=result, message="Document updated successfully", status_code=200)
    except DocumentAuthorizationError as exc:
        return error_response(message=str(exc), status_code=403, error_code="DOCUMENT_UPDATE_FORBIDDEN")
    except (DocumentValidationError, ValueError) as exc:
        status_code = 404 if str(exc) == "Document not found" else 400
        return error_response(message=str(exc), status_code=status_code, error_code="DOCUMENT_UPDATE_INVALID")
    except Exception:
        return error_response(message="Unable to update document", status_code=500, error_code="DOCUMENT_UPDATE_FAILED")


@router.delete("/{record_id}", summary="Delete document")
async def delete_document_route(record_id: int, current_user: CurrentUser = Depends(require_roles("admin", "teacher"))):
    try:
        result = await delete_document(record_id, current_user=current_user)
        return success_response(data=result, message="Document deleted successfully", status_code=200)
    except DocumentAuthorizationError as exc:
        return error_response(message=str(exc), status_code=403, error_code="DOCUMENT_DELETE_FORBIDDEN")
    except ValueError as exc:
        status_code = 404 if str(exc) == "Document not found" else 400
        return error_response(message=str(exc), status_code=status_code, error_code="DOCUMENT_DELETE_INVALID")
    except Exception:
        return error_response(message="Unable to delete document", status_code=500, error_code="DOCUMENT_DELETE_FAILED")
