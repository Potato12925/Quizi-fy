import hashlib
import logging
from datetime import datetime, timedelta, timezone

from core.config import Config

from repositories.student_ai_chat_repository import (
    find_learning_progress,
    find_recent_exam_results,
    find_recent_wrong_questions,
    find_student_learning_data_version,
    find_wrong_question_summary_by_topic,
)
from repositories.student_ai_chat_message_repository import (
    count_chat_messages_by_student,
    create_chat_message_record,
    find_chat_messages_by_student,
    soft_delete_chat_messages_by_student,
)
from utils.student_ai_chat_openai_util import (
    UNSUPPORTED_MESSAGE,
    StudentAiChatOpenAiError,
    classify_student_ai_chat_intent,
    classify_student_ai_chat_intent_with_tools,
    generate_student_ai_chat_answer,
)


RATE_LIMIT_COUNT = 20
RATE_LIMIT_WINDOW_MINUTES = 10
MAX_HISTORY_ITEMS = 40
CACHE_TTL_MINUTES = 10

_rate_limit_store: dict[int, list[datetime]] = {}
_cache_store: dict[str, tuple[datetime, str]] = {}
_history_store: dict[int, list[dict]] = {}
logger = logging.getLogger(__name__)


class StudentAiChatRateLimitError(ValueError):
    pass


async def send_student_ai_chat_message(student_id: int, message: str) -> dict:
    normalized_message = normalize_message(message)
    remaining = _check_rate_limit(student_id)
    classification = _select_tools(student_id, normalized_message)
    tools_used = classification.get("tools")
    if classification["intent"] == "unsupported":
        await _append_history(student_id, "user", normalized_message, [])
        await _append_history(student_id, "assistant", UNSUPPORTED_MESSAGE, [])
        return {"message": UNSUPPORTED_MESSAGE, "cached": False, "rate_limit_remaining": remaining, "actions": []}

    data_version = await find_student_learning_data_version(student_id)
    cache_key = build_cache_key(student_id, normalized_message, data_version)
    cached_answer = _get_cached_answer(cache_key)
    if cached_answer:
        await _append_history(student_id, "user", normalized_message, [])
        return {"message": cached_answer, "cached": True, "rate_limit_remaining": remaining, "actions": _build_actions(tools_used or [])}
    recent_history = await find_chat_messages_by_student(student_id, limit=6, offset=0)
    recent_history = list(reversed(recent_history or []))
    learning_data = await _execute_tools(student_id, classification["tools"])
    is_fallback = False
    try:
        answer = generate_student_ai_chat_answer(normalized_message, learning_data, recent_history)
    except StudentAiChatOpenAiError as exc:
        logger.warning("Student AI chat OpenAI answer generation failed: %s", exc)
        is_fallback = True
        answer = (
            "M\u00ecnh \u0111\u00e3 l\u1ea5y \u0111\u01b0\u1ee3c d\u1eef li\u1ec7u h\u1ecdc t\u1eadp c\u1ee7a b\u1ea1n nh\u01b0ng hi\u1ec7n ch\u01b0a th\u1ec3 k\u1ebft n\u1ed1i AI \u0111\u1ec3 ph\u00e2n t\u00edch chi ti\u1ebft. "
            "B\u1ea1n h\u00e3y th\u1eed l\u1ea1i sau \u00edt ph\u00fat nh\u00e9."
        )

    if not is_fallback:
        _set_cached_answer(cache_key, answer)
        await _append_history(student_id, "assistant", answer, tools_used)
    return {"message": answer, "cached": False, "rate_limit_remaining": remaining, "actions": _build_actions(tools_used or [])}


async def get_student_ai_chat_history(student_id: int) -> dict:
    """Lấy lịch sử tin nhắn từ database hỗ trợ phân trang."""
    messages = await find_chat_messages_by_student(student_id, limit=40, offset=0)
    return {"messages": messages}


async def clear_student_ai_chat_history(student_id: int) -> dict:
    """Xóa mềm lịch sử chat dưới database."""
    await soft_delete_chat_messages_by_student(student_id)
    return {"cleared": True}


def normalize_message(message: str) -> str:
    return " ".join(message.strip().split())[:1000]


def build_cache_key(student_id: int, message: str, data_version: str) -> str:
    raw = f"{student_id}:{message.lower()}:{data_version}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


async def _execute_tools(student_id: int, tools: list[str]) -> dict:
    data: dict = {}
    for tool in tools:
        if tool == "get_recent_wrong_questions":
            data[tool] = await find_recent_wrong_questions(student_id, limit=20)
        elif tool == "get_wrong_question_summary_by_topic":
            data[tool] = await find_wrong_question_summary_by_topic(student_id)
        elif tool == "get_recent_exam_results":
            data[tool] = await find_recent_exam_results(student_id, limit=10)
        elif tool == "get_learning_progress":
            data[tool] = await find_learning_progress(student_id)
    return data


def _check_rate_limit(student_id: int) -> int:
    now = datetime.now(timezone.utc)
    window_start = now - timedelta(minutes=RATE_LIMIT_WINDOW_MINUTES)
    requests = [item for item in _rate_limit_store.get(student_id, []) if item >= window_start]
    if len(requests) >= RATE_LIMIT_COUNT:
        raise StudentAiChatRateLimitError("Đã gửi quá nhiều câu hỏi. Vui lòng thử lại sau ít phút.")
    requests.append(now)
    _rate_limit_store[student_id] = requests
    return RATE_LIMIT_COUNT - len(requests)


def _get_cached_answer(cache_key: str) -> str | None:
    cached = _cache_store.get(cache_key)
    if not cached:
        return None
    created_at, answer = cached
    if created_at < datetime.now(timezone.utc) - timedelta(minutes=CACHE_TTL_MINUTES):
        _cache_store.pop(cache_key, None)
        return None
    return answer


def _set_cached_answer(cache_key: str, answer: str) -> None:
    _cache_store[cache_key] = (datetime.now(timezone.utc), answer)


async def _append_history(student_id: int, role: str, content: str, tools_used: list[str]) -> None:
    payload = {
        "student_id": student_id,
        "role": role,
        "content": content,
        "tools_used": tools_used or [],
        "cached": False
    }
    await create_chat_message_record(payload)


def _build_actions(tools_used: list[str]) -> list[dict]:
    """Build action chips from the tools that were executed."""
    actions: list[dict] = []
    if "get_wrong_question_summary_by_topic" in tools_used:
        actions.append({
            "label": "Ôn tập chủ đề yếu nhất",
            "type": "review_topic",
            "target": None,
        })
    if "get_recent_wrong_questions" in tools_used:
        actions.append({
            "label": "Xem lại câu sai",
            "type": "review_wrong_questions",
            "target": None,
        })
    if "get_learning_progress" in tools_used:
        actions.append({
            "label": "Xem tiến độ",
            "type": "view_progress",
            "target": None,
        })
    return actions


def _select_tools(student_id: int, message: str) -> dict:
    """Hybrid tool selection.

    When an OpenAI API key is available, prefer function calling for better intent understanding.
    On any OpenAI error, fall back to the deterministic rule-based classifier so the chatbot still works.
    When there is no key, use the rule-based classifier directly (offline demo friendly).
    """
    if not Config.OPENAI_API_KEY:
        return classify_student_ai_chat_intent(message)
    try:
        return classify_student_ai_chat_intent_with_tools(message)
    except StudentAiChatOpenAiError as exc:
        logger.warning("Student AI chat tool selection via function calling failed: %s", exc)
        return classify_student_ai_chat_intent(message)
