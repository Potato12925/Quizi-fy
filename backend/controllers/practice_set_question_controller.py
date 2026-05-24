from fastapi import APIRouter, Depends, Query

from core.responses import error_response, success_response
from middlewares.auth_middleware import CurrentUser, require_roles
from schemas.practice_set_question_schema import PracticeSetQuestionCreateRequest, PracticeSetQuestionUpdateRequest
from services.practice_set_question_service import create_practice_set_question, delete_practice_set_question, get_practice_set_question_by_id, get_practice_set_questions, update_practice_set_question

router = APIRouter(prefix="/practice-set-questions", tags=["PracticeSetQuestions"])


@router.post("", summary="Create practice_set_question")
async def post_practice_set_question(payload: PracticeSetQuestionCreateRequest, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await create_practice_set_question(payload)
        return success_response(data=result, message="PracticeSetQuestion created successfully", status_code=201)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=400, error_code="PRACTICESETQUESTION_CREATE_INVALID")
    except Exception:
        return error_response(message="Unable to create practice_set_question", status_code=500, error_code="PRACTICESETQUESTION_CREATE_FAILED")


@router.get("", summary="List practice-set-questions")
async def get_practice_set_question_list(page: int = Query(default=1, ge=1), limit: int = Query(default=20, ge=1, le=100), _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await get_practice_set_questions(page=page, limit=limit)
        return success_response(data=result["items"], meta=result["pagination"], message="PracticeSetQuestion loaded successfully", status_code=200)
    except Exception:
        return error_response(message="Unable to load practice-set-questions", status_code=500, error_code="PRACTICESETQUESTION_LIST_FAILED")


@router.get("/{record_id}", summary="Get practice_set_question detail")
async def get_practice_set_question_detail(record_id: int, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await get_practice_set_question_by_id(record_id)
        return success_response(data=result, message="PracticeSetQuestion loaded successfully", status_code=200)
    except ValueError as exc:
        return error_response(message=str(exc), status_code=404, error_code="PRACTICESETQUESTION_NOT_FOUND")
    except Exception:
        return error_response(message="Unable to load practice_set_question", status_code=500, error_code="PRACTICESETQUESTION_GET_FAILED")


@router.put("/{record_id}", summary="Update practice_set_question")
async def put_practice_set_question(record_id: int, payload: PracticeSetQuestionUpdateRequest, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await update_practice_set_question(record_id, payload)
        return success_response(data=result, message="PracticeSetQuestion updated successfully", status_code=200)
    except ValueError as exc:
        status_code = 404 if str(exc) == "PracticeSetQuestion not found" else 400
        return error_response(message=str(exc), status_code=status_code, error_code="PRACTICESETQUESTION_UPDATE_INVALID")
    except Exception:
        return error_response(message="Unable to update practice_set_question", status_code=500, error_code="PRACTICESETQUESTION_UPDATE_FAILED")


@router.delete("/{record_id}", summary="Delete practice_set_question")
async def delete_practice_set_question_route(record_id: int, _: CurrentUser = Depends(require_roles("admin"))):
    try:
        result = await delete_practice_set_question(record_id)
        return success_response(data=result, message="PracticeSetQuestion deleted successfully", status_code=200)
    except ValueError as exc:
        status_code = 404 if str(exc) == "PracticeSetQuestion not found" else 400
        return error_response(message=str(exc), status_code=status_code, error_code="PRACTICESETQUESTION_DELETE_INVALID")
    except Exception:
        return error_response(message="Unable to delete practice_set_question", status_code=500, error_code="PRACTICESETQUESTION_DELETE_FAILED")
