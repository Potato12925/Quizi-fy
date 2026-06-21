from fastapi import APIRouter, Depends, Query

from core.responses import error_response, success_response
from middlewares.auth_middleware import CurrentUser, require_roles
from schemas.class_student_schema import ClassStudentCreateRequest, ClassStudentUpdateRequest
from services.class_student_service import (
    create_class_student,
    delete_class_student,
    get_class_student_by_id,
    get_class_students,
    get_my_classes,
    update_class_student,
)

router = APIRouter(prefix="/class-students", tags=["ClassStudents"])


# @router.post("", summary="Create class_student")
# async def post_class_student(payload: ClassStudentCreateRequest, _: CurrentUser = Depends(require_roles("admin"))):
#     try:
#         result = await create_class_student(payload)
#         return success_response(data=result, message="ClassStudent created successfully", status_code=201)
#     except ValueError as exc:
#         return error_response(message=str(exc), status_code=400, error_code="CLASSSTUDENT_CREATE_INVALID")
#     except Exception:
#         return error_response(message="Unable to create class_student", status_code=500, error_code="CLASSSTUDENT_CREATE_FAILED")


@router.get("", summary="List class-students")
async def get_class_student_list(page: int = Query(default=1, ge=1), limit: int = Query(default=20, ge=1, le=100), _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await get_class_students(page=page, limit=limit)
        return success_response(data=result["items"], meta=result["pagination"], message="ClassStudent loaded successfully", status_code=200)
    except Exception:
        return error_response(message="Unable to load class-students", status_code=500, error_code="CLASSSTUDENT_LIST_FAILED")


@router.get("/my-classes", summary="List my classes (for student)")
async def get_my_classes_route(current_user: CurrentUser = Depends(require_roles("student"))):
    try:
        result = await get_my_classes(current_user.user_id)
        return success_response(data=result, message="My classes loaded successfully", status_code=200)
    except Exception:
        return error_response(message="Unable to load my classes", status_code=500, error_code="MY_CLASSES_GET_FAILED")


@router.get("/{record_id}", summary="Get class_student detail")
async def get_class_student_detail(record_id: int, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await get_class_student_by_id(record_id)
        return success_response(data=result, message="ClassStudent loaded successfully", status_code=200)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=404, error_code="CLASSSTUDENT_NOT_FOUND")
    except Exception:
        return error_response(message="Unable to load class_student", status_code=500, error_code="CLASSSTUDENT_GET_FAILED")


# @router.put("/{record_id}", summary="Update class_student")
# async def put_class_student(record_id: int, payload: ClassStudentUpdateRequest, _: CurrentUser = Depends(require_roles("admin"))):
#     try:
#         result = await update_class_student(record_id, payload)
#         return success_response(data=result, message="ClassStudent updated successfully", status_code=200)
#     except ValueError as exc:
#         status_code = 404 if str(exc) == "ClassStudent not found" else 400
#         return error_response(message=str(exc), status_code=status_code, error_code="CLASSSTUDENT_UPDATE_INVALID")
#     except Exception:
#         return error_response(message="Unable to update class_student", status_code=500, error_code="CLASSSTUDENT_UPDATE_FAILED")
# 
# 
# @router.delete("/{record_id}", summary="Delete class_student")
# async def delete_class_student_route(record_id: int, _: CurrentUser = Depends(require_roles("admin"))):
#     try:
#         result = await delete_class_student(record_id)
#         return success_response(data=result, message="ClassStudent deleted successfully", status_code=200)
#     except ValueError as exc:
#         status_code = 404 if str(exc) == "ClassStudent not found" else 400
#         return error_response(message=str(exc), status_code=status_code, error_code="CLASSSTUDENT_DELETE_INVALID")
#     except Exception:
#         return error_response(message="Unable to delete class_student", status_code=500, error_code="CLASSSTUDENT_DELETE_FAILED")
