from fastapi import APIRouter, Depends, Query

from core.responses import error_response, success_response
from middlewares.auth_middleware import CurrentUser, require_roles
from schemas.class_schema import (
    AssignStudentToClassRequest,
    AssignSubjectToClassRequest,
    ClassCreateRequest,
    ClassListQueryParams,
    ClassUpdateRequest,
)
from services.class_service import (
    assign_student_to_class,
    assign_subject_to_class,
    create_class,
    delete_class,
    get_class_by_id,
    get_class_students,
    get_class_subjects,
    get_classes,
    remove_student_from_class,
    remove_subject_from_class,
    update_class,
)

router = APIRouter(prefix="/classes", tags=["Classes"])


@router.post("", summary="Create class")
async def post_class(
    payload: ClassCreateRequest,
    _: CurrentUser = Depends(require_roles("admin")),
):
    try:
        result = await create_class(payload)
        return success_response(
            data=result,
            message="Class created successfully",
            status_code=201,
        )
    except ValueError as exc:
        return error_response(
            message=str(exc),
            status_code=400,
            error_code="CLASS_CREATE_INVALID",
        )
    except Exception:
        return error_response(
            message="Unable to create class",
            status_code=500,
            error_code="CLASS_CREATE_FAILED",
        )


@router.get("", summary="List classes")
async def get_class_list(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(default=None),
    status: str = Query(default="all"),
    sort_by: str = Query(default="created_at"),
    sort_order: str = Query(default="desc"),
    _: CurrentUser = Depends(require_roles("admin")),
):
    try:
        params = ClassListQueryParams(
            page=page,
            limit=limit,
            search=search,
            status=status,  # type: ignore[arg-type]
            sort_by=sort_by,  # type: ignore[arg-type]
            sort_order=sort_order,  # type: ignore[arg-type]
        )
        result = await get_classes(params=params)

        return success_response(
            data=result["items"],
            meta=result["pagination"],
            message="Classes loaded successfully",
            status_code=200,
        )
    except ValueError as exc:
        return error_response(
            message=str(exc),
            status_code=400,
            error_code="CLASS_LIST_INVALID",
        )
    except Exception:
        return error_response(
            message="Unable to load classes",
            status_code=500,
            error_code="CLASS_LIST_FAILED",
        )

@router.get("/{class_id}", summary="Get class detail")
async def get_class_detail(
    class_id: int,
    _: CurrentUser = Depends(require_roles("admin")),
):
    try:
        result = await get_class_by_id(class_id)
        return success_response(
            data=result,
            message="Class loaded successfully",
            status_code=200,
        )
    except ValueError as exc:
        return error_response(
            message=str(exc),
            status_code=404,
            error_code="CLASS_NOT_FOUND",
        )
    except Exception:
        return error_response(
            message="Unable to load class",
            status_code=500,
            error_code="CLASS_GET_FAILED",
        )


@router.get("/{class_id}/subjects", summary="Get class subjects")
async def get_class_subjects_route(
    class_id: int,
    _: CurrentUser = Depends(require_roles("admin")),
):
    try:
        result = await get_class_subjects(class_id)
        return success_response(
            data=result,
            message="Class subjects loaded successfully",
            status_code=200,
        )
    except ValueError as exc:
        status_code = 404 if str(exc) == "Class not found" else 400
        return error_response(
            message=str(exc),
            status_code=status_code,
            error_code="CLASS_SUBJECTS_GET_INVALID",
        )
    except Exception:
        return error_response(
            message="Unable to load class subjects",
            status_code=500,
            error_code="CLASS_SUBJECTS_GET_FAILED",
        )


@router.get("/{class_id}/students", summary="Get class students")
async def get_class_students_route(
    class_id: int,
    _: CurrentUser = Depends(require_roles("admin")),
):
    try:
        result = await get_class_students(class_id)
        return success_response(
            data=result,
            message="Class students loaded successfully",
            status_code=200,
        )
    except ValueError as exc:
        status_code = 404 if str(exc) == "Class not found" else 400
        return error_response(
            message=str(exc),
            status_code=status_code,
            error_code="CLASS_STUDENTS_GET_INVALID",
        )
    except Exception:
        return error_response(
            message="Unable to load class students",
            status_code=500,
            error_code="CLASS_STUDENTS_GET_FAILED",
        )


@router.put("/{class_id}", summary="Update class")
async def put_class(
    class_id: int,
    payload: ClassUpdateRequest,
    _: CurrentUser = Depends(require_roles("admin")),
):
    try:
        result = await update_class(class_id, payload)
        return success_response(
            data=result,
            message="Class updated successfully",
            status_code=200,
        )
    except ValueError as exc:
        status_code = 404 if str(exc) == "Class not found" else 400
        return error_response(
            message=str(exc),
            status_code=status_code,
            error_code="CLASS_UPDATE_INVALID",
        )
    except Exception:
        return error_response(
            message="Unable to update class",
            status_code=500,
            error_code="CLASS_UPDATE_FAILED",
        )


@router.post("/{class_id}/subjects", summary="Assign subject to class")
async def post_assign_subject_to_class(
    class_id: int,
    payload: AssignSubjectToClassRequest,
    _: CurrentUser = Depends(require_roles("admin")),
):
    try:
        result = await assign_subject_to_class(class_id, payload)
        return success_response(
            data=result,
            message="Subject assigned to class successfully",
            status_code=201,
        )
    except ValueError as exc:
        status_code = 404 if str(exc) in {"Class not found", "Subject not found"} else 400
        return error_response(
            message=str(exc),
            status_code=status_code,
            error_code="CLASS_SUBJECT_ASSIGN_INVALID",
        )
    except Exception:
        return error_response(
            message="Unable to assign subject to class",
            status_code=500,
            error_code="CLASS_SUBJECT_ASSIGN_FAILED",
        )


@router.delete("/{class_id}/subjects/{subject_id}", summary="Remove subject from class")
async def delete_class_subject_assignment(
    class_id: int,
    subject_id: int,
    _: CurrentUser = Depends(require_roles("admin")),
):
    try:
        result = await remove_subject_from_class(class_id, subject_id)
        return success_response(
            data=result,
            message="Subject removed from class successfully",
            status_code=200,
        )
    except ValueError as exc:
        status_code = 404 if str(exc) in {"Class not found", "Class subject assignment not found"} else 400
        return error_response(
            message=str(exc),
            status_code=status_code,
            error_code="CLASS_SUBJECT_DELETE_INVALID",
        )
    except Exception:
        return error_response(
            message="Unable to remove subject from class",
            status_code=500,
            error_code="CLASS_SUBJECT_DELETE_FAILED",
        )


@router.post("/{class_id}/students", summary="Assign student to class")
async def post_assign_student_to_class(
    class_id: int,
    payload: AssignStudentToClassRequest,
    _: CurrentUser = Depends(require_roles("admin")),
):
    try:
        result = await assign_student_to_class(class_id, payload)
        return success_response(
            data=result,
            message="Student assigned to class successfully",
            status_code=201,
        )
    except ValueError as exc:
        status_code = 404 if str(exc) in {"Class not found", "Student not found"} else 400
        return error_response(
            message=str(exc),
            status_code=status_code,
            error_code="CLASS_STUDENT_ASSIGN_INVALID",
        )
    except Exception:
        return error_response(
            message="Unable to assign student to class",
            status_code=500,
            error_code="CLASS_STUDENT_ASSIGN_FAILED",
        )


@router.delete("/{class_id}/students/{student_id}", summary="Remove student from class")
async def delete_class_student_assignment(
    class_id: int,
    student_id: int,
    _: CurrentUser = Depends(require_roles("admin")),
):
    try:
        result = await remove_student_from_class(class_id, student_id)
        return success_response(
            data=result,
            message="Student removed from class successfully",
            status_code=200,
        )
    except ValueError as exc:
        status_code = 404 if str(exc) in {"Class not found", "Class student assignment not found"} else 400
        return error_response(
            message=str(exc),
            status_code=status_code,
            error_code="CLASS_STUDENT_DELETE_INVALID",
        )
    except Exception:
        return error_response(
            message="Unable to remove student from class",
            status_code=500,
            error_code="CLASS_STUDENT_DELETE_FAILED",
        )


@router.delete("/{class_id}", summary="Soft delete class")
async def delete_class_route(
    class_id: int,
    _: CurrentUser = Depends(require_roles("admin")),
):
    try:
        result = await delete_class(class_id)
        return success_response(
            data=result,
            message="Class deleted successfully",
            status_code=200,
        )
    except ValueError as exc:
        status_code = 404 if str(exc) == "Class not found" else 400
        return error_response(
            message=str(exc),
            status_code=status_code,
            error_code="CLASS_DELETE_INVALID",
        )
    except Exception:
        return error_response(
            message="Unable to delete class",
            status_code=500,
            error_code="CLASS_DELETE_FAILED",
        )

