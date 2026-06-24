import hashlib
import logging
from datetime import datetime, timedelta, timezone

from repositories.student_ai_chat_repository import (
    find_learning_progress,
    find_recent_exam_results,
    find_recent_wrong_questions,
    find_student_learning_data_version,
    find_wrong_question_summary_by_topic,
)
from utils.student_ai_chat_openai_util import (
    UNSUPPORTED_MESSAGE,
    StudentAiChatOpenAiError,
    classify_student_ai_chat_intent,
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
    classification = classify_student_ai_chat_intent(normalized_message)
    if classification["intent"] == "unsupported":
        _append_history(student_id, "user", normalized_message)
        _append_history(student_id, "assistant", UNSUPPORTED_MESSAGE)
        return {"message": UNSUPPORTED_MESSAGE, "cached": False, "rate_limit_remaining": remaining}

    data_version = await find_student_learning_data_version(student_id)
    cache_key = build_cache_key(student_id, normalized_message, data_version)
    cached_answer = _get_cached_answer(cache_key)
    if cached_answer:
        _append_history(student_id, "user", normalized_message)
        _append_history(student_id, "assistant", cached_answer)
        return {"message": cached_answer, "cached": True, "rate_limit_remaining": remaining}

    learning_data = await _execute_tools(student_id, classification["tools"])
    try:
        answer = generate_student_ai_chat_answer(normalized_message, learning_data)
    except StudentAiChatOpenAiError as exc:
        logger.warning("Student AI chat OpenAI answer generation failed: %s", exc)
        answer = (
            "M\u00ecnh \u0111\u00e3 l\u1ea5y \u0111\u01b0\u1ee3c d\u1eef li\u1ec7u h\u1ecdc t\u1eadp c\u1ee7a b\u1ea1n nh\u01b0ng hi\u1ec7n ch\u01b0a th\u1ec3 k\u1ebft n\u1ed1i AI \u0111\u1ec3 ph\u00e2n t\u00edch chi ti\u1ebft. "
            "B\u1ea1n h\u00e3y th\u1eed l\u1ea1i sau \u00edt ph\u00fat nh\u00e9."
        )

    _set_cached_answer(cache_key, answer)
    _append_history(student_id, "user", normalized_message)
    _append_history(student_id, "assistant", answer)
    return {"message": answer, "cached": False, "rate_limit_remaining": remaining}


async def get_student_ai_chat_history(student_id: int) -> dict:
    return {"messages": _history_store.get(student_id, [])[-MAX_HISTORY_ITEMS:]}


async def clear_student_ai_chat_history(student_id: int) -> dict:
    _history_store.pop(student_id, None)
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
        raise StudentAiChatRateLimitError("B\u1ea1n \u0111\u00e3 g\u1eedi qu\u00e1 nhi\u1ec1u c\u00e2u h\u1ecfi. Vui l\u00f2ng th\u1eed l\u1ea1i sau \u00edt ph\u00fat.")
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


def _append_history(student_id: int, role: str, content: str) -> None:
    messages = _history_store.setdefault(student_id, [])
    messages.append(
        {
            "role": role,
            "content": content,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )
    if len(messages) > MAX_HISTORY_ITEMS:
        del messages[:-MAX_HISTORY_ITEMS]
