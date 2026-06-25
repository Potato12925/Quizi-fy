from fastapi import APIRouter, Depends
import logging

from core.responses import error_response, success_response
from middlewares.auth_middleware import CurrentUser, require_roles
from schemas.student_ai_chat_schema import StudentAiChatMessageRequest
from services.student_ai_chat_service import (
    StudentAiChatRateLimitError,
    clear_student_ai_chat_history,
    get_student_ai_chat_history,
    send_student_ai_chat_message,
)

router = APIRouter(prefix="/student/ai-chat", tags=["Student AI Chat"])

logger = logging.getLogger(__name__)


@router.post("/message", summary="Send message to student AI chat")
async def post_student_ai_chat_message(
    payload: StudentAiChatMessageRequest,
    current_user: CurrentUser = Depends(require_roles("student")),
):
    try:
        result = await send_student_ai_chat_message(current_user.user_id, payload.message)
        return success_response(data=result, message="AI chat response generated", status_code=200)
    except StudentAiChatRateLimitError as exc:
        return error_response(message=str(exc), status_code=429, error_code="STUDENT_AI_CHAT_RATE_LIMITED")
    except ValueError as exc:
        return error_response(message=str(exc), status_code=400, error_code="STUDENT_AI_CHAT_INVALID")
    except Exception:
        logger.exception("Student AI chat error")
        return error_response(message="Unable to process AI chat message", status_code=500, error_code="STUDENT_AI_CHAT_FAILED")


@router.get("/history", summary="Get student AI chat history")
async def get_student_ai_chat_history_route(
    current_user: CurrentUser = Depends(require_roles("student")),
):
    try:
        result = await get_student_ai_chat_history(current_user.user_id)
        return success_response(data=result, message="AI chat history loaded", status_code=200)
    except Exception:
        logger.exception("Student AI chat error")
        return error_response(message="Unable to load AI chat history", status_code=500, error_code="STUDENT_AI_CHAT_HISTORY_FAILED")


@router.delete("/history", summary="Clear student AI chat history")
async def delete_student_ai_chat_history_route(
    current_user: CurrentUser = Depends(require_roles("student")),
):
    try:
        result = await clear_student_ai_chat_history(current_user.user_id)
        return success_response(data=result, message="AI chat history cleared", status_code=200)
    except Exception:
        logger.exception("Student AI chat error")
        return error_response(message="Unable to clear AI chat history", status_code=500, error_code="STUDENT_AI_CHAT_CLEAR_FAILED")
