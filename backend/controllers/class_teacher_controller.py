from fastapi import APIRouter, Depends, Query

from core.responses import error_response, success_response
from middlewares.auth_middleware import CurrentUser, require_roles
from schemas.class_teacher_schema import ClassTeacherCreateRequest, ClassTeacherUpdateRequest
from services.class_teacher_service import create_class_teacher, delete_class_teacher, get_class_teacher_by_id, get_class_teachers, update_class_teacher

router = APIRouter(prefix="/class-teachers", tags=["ClassTeachers"])


# @router.post("", summary="Create class_teacher")
# async def post_class_teacher(payload: ClassTeacherCreateRequest, _: CurrentUser = Depends(require_roles("admin"))):
#     try:
#         result = await create_class_teacher(payload)
#         return success_response(data=result, message="ClassTeacher created successfully", status_code=201)
#     except ValueError as exc:
#         return error_response(message=str(exc), status_code=400, error_code="CLASSTEACHER_CREATE_INVALID")
#     except Exception:
#         return error_response(message="Unable to create class_teacher", status_code=500, error_code="CLASSTEACHER_CREATE_FAILED")


@router.get("", summary="List class-teachers")
async def get_class_teacher_list(page: int = Query(default=1, ge=1), limit: int = Query(default=20, ge=1, le=100), _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await get_class_teachers(page=page, limit=limit)
        return success_response(data=result["items"], meta=result["pagination"], message="ClassTeacher loaded successfully", status_code=200)
    except Exception:
        return error_response(message="Unable to load class-teachers", status_code=500, error_code="CLASSTEACHER_LIST_FAILED")


@router.get("/{record_id}", summary="Get class_teacher detail")
async def get_class_teacher_detail(record_id: int, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await get_class_teacher_by_id(record_id)
        return success_response(data=result, message="ClassTeacher loaded successfully", status_code=200)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=404, error_code="CLASSTEACHER_NOT_FOUND")
    except Exception:
        return error_response(message="Unable to load class_teacher", status_code=500, error_code="CLASSTEACHER_GET_FAILED")


# @router.put("/{record_id}", summary="Update class_teacher")
# async def put_class_teacher(record_id: int, payload: ClassTeacherUpdateRequest, _: CurrentUser = Depends(require_roles("admin"))):
#     try:
#         result = await update_class_teacher(record_id, payload)
#         return success_response(data=result, message="ClassTeacher updated successfully", status_code=200)
#     except ValueError as exc:
#         status_code = 404 if str(exc) == "ClassTeacher not found" else 400
#         return error_response(message=str(exc), status_code=status_code, error_code="CLASSTEACHER_UPDATE_INVALID")
#     except Exception:
#         return error_response(message="Unable to update class_teacher", status_code=500, error_code="CLASSTEACHER_UPDATE_FAILED")
# 
# 
# @router.delete("/{record_id}", summary="Delete class_teacher")
# async def delete_class_teacher_route(record_id: int, _: CurrentUser = Depends(require_roles("admin"))):
#     try:
#         result = await delete_class_teacher(record_id)
#         return success_response(data=result, message="ClassTeacher deleted successfully", status_code=200)
#     except ValueError as exc:
#         status_code = 404 if str(exc) == "ClassTeacher not found" else 400
#         return error_response(message=str(exc), status_code=status_code, error_code="CLASSTEACHER_DELETE_INVALID")
#     except Exception:
#         return error_response(message="Unable to delete class_teacher", status_code=500, error_code="CLASSTEACHER_DELETE_FAILED")
