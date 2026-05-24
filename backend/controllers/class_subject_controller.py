from fastapi import APIRouter, Depends, Query

from core.responses import error_response, success_response
from middlewares.auth_middleware import CurrentUser, require_roles
from schemas.class_subject_schema import ClassSubjectCreateRequest, ClassSubjectUpdateRequest
from services.class_subject_service import create_class_subject, delete_class_subject, get_class_subject_by_id, get_class_subjects, update_class_subject

router = APIRouter(prefix="/class-subjects", tags=["ClassSubjects"])


@router.post("", summary="Create class_subject")
async def post_class_subject(payload: ClassSubjectCreateRequest, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await create_class_subject(payload)
        return success_response(data=result, message="ClassSubject created successfully", status_code=201)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=400, error_code="CLASSSUBJECT_CREATE_INVALID")
    except Exception:
        return error_response(message="Unable to create class_subject", status_code=500, error_code="CLASSSUBJECT_CREATE_FAILED")


@router.get("", summary="List class-subjects")
async def get_class_subject_list(page: int = Query(default=1, ge=1), limit: int = Query(default=20, ge=1, le=100), _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await get_class_subjects(page=page, limit=limit)
        return success_response(data=result["items"], meta=result["pagination"], message="ClassSubject loaded successfully", status_code=200)
    except Exception:
        return error_response(message="Unable to load class-subjects", status_code=500, error_code="CLASSSUBJECT_LIST_FAILED")


@router.get("/{record_id}", summary="Get class_subject detail")
async def get_class_subject_detail(record_id: int, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await get_class_subject_by_id(record_id)
        return success_response(data=result, message="ClassSubject loaded successfully", status_code=200)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=404, error_code="CLASSSUBJECT_NOT_FOUND")
    except Exception:
        return error_response(message="Unable to load class_subject", status_code=500, error_code="CLASSSUBJECT_GET_FAILED")


@router.put("/{record_id}", summary="Update class_subject")
async def put_class_subject(record_id: int, payload: ClassSubjectUpdateRequest, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await update_class_subject(record_id, payload)
        return success_response(data=result, message="ClassSubject updated successfully", status_code=200)
    except ValueError as exc:
        status_code = 404 if str(exc) == "ClassSubject not found" else 400
        return error_response(message=str(exc), status_code=status_code, error_code="CLASSSUBJECT_UPDATE_INVALID")
    except Exception:
        return error_response(message="Unable to update class_subject", status_code=500, error_code="CLASSSUBJECT_UPDATE_FAILED")


@router.delete("/{record_id}", summary="Delete class_subject")
async def delete_class_subject_route(record_id: int, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await delete_class_subject(record_id)
        return success_response(data=result, message="ClassSubject deleted successfully", status_code=200)
    except ValueError as exc:
        status_code = 404 if str(exc) == "ClassSubject not found" else 400
        return error_response(message=str(exc), status_code=status_code, error_code="CLASSSUBJECT_DELETE_INVALID")
    except Exception:
        return error_response(message="Unable to delete class_subject", status_code=500, error_code="CLASSSUBJECT_DELETE_FAILED")
