from datetime import datetime, timezone
from math import ceil

from middlewares.auth_middleware import CurrentUser
from repositories.teacher_question_bank_repository import (
    create_question_record,
    find_teacher_question_by_id,
    list_teacher_document_topic_options,
    list_teacher_questions,
    replace_question_options,
    soft_delete_question_record,
    update_question_record,
)
from schemas.teacher_question_bank_schema import ManualQuestionPayload


class TeacherQuestionBankAuthorizationError(ValueError):
    pass


def _pick_document_topic_id(rows: list[dict], requested_document_topic_id: int | None, requested_topic_id: int | None) -> int:
    if requested_document_topic_id is not None:
        for row in rows:
            if int(row["document_topic_id"]) == requested_document_topic_id:
                return requested_document_topic_id
        raise TeacherQuestionBankAuthorizationError("You can only manage questions under your own document topics")

    if requested_topic_id is not None:
        for row in rows:
            topic = row.get("topics") or {}
            if int(topic.get("topic_id") or 0) == requested_topic_id:
                return int(row["document_topic_id"])
        raise ValueError("Không tìm thấy tài liệu phù hợp cho chương đã chọn")

    if rows:
        return int(rows[0]["document_topic_id"])
    raise ValueError("Bạn chưa có tài liệu nào để gán câu hỏi")


def _serialize_question(item: dict, document_topic_by_id: dict[int, dict]) -> dict:
    dt_id = int(item["document_topic_id"])
    dt = document_topic_by_id.get(dt_id, {})
    topic = dt.get("topics") or {}
    subject = topic.get("subjects") or {}
    document = dt.get("documents") or {}
    options = sorted(item.get("question_options") or [], key=lambda x: int(x.get("order_num") or 0))

    return {
        "question_id": int(item["question_id"]),
        "content": item.get("content"),
        "difficulty": item.get("difficulty"),
        "source": item.get("source"),
        "status": item.get("status"),
        "explanation": item.get("explanation"),
        "created_at": item.get("created_at"),
        "updated_at": item.get("updated_at"),
        "document_topic_id": dt_id,
        "topic_id": topic.get("topic_id"),
        "topic_name": topic.get("topic_name"),
        "subject_id": topic.get("subject_id"),
        "subject_name": subject.get("subject_name"),
        "document_id": document.get("document_id"),
        "document_title": document.get("title"),
        "options": options,
    }


async def get_teacher_question_bank(
    current_user: CurrentUser,
    page: int,
    limit: int,
    subject_id: int | None = None,
    topic_id: int | None = None,
    difficulty: str | None = None,
    status: str | None = None,
    source: str | None = None,
    keyword: str | None = None,
) -> dict:
    document_topics = await list_teacher_document_topic_options(
        teacher_id=current_user.user_id,
        subject_id=subject_id,
        topic_id=topic_id,
    )
    dt_ids = [int(row["document_topic_id"]) for row in document_topics]

    items, total = await list_teacher_questions(
        teacher_id=current_user.user_id,
        document_topic_ids=dt_ids,
        page=page,
        limit=limit,
        difficulty=difficulty,
        status=status,
        source=source,
        keyword=keyword,
    )

    dt_by_id = {int(row["document_topic_id"]): row for row in document_topics}
    serialized = [_serialize_question(item, dt_by_id) for item in items]
    total_pages = ceil(total / limit) if total > 0 else 1

    return {
        "items": serialized,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
        },
    }


async def get_teacher_document_topic_options(current_user: CurrentUser, subject_id: int, topic_id: int | None = None) -> list[dict]:
    rows = await list_teacher_document_topic_options(
        teacher_id=current_user.user_id,
        subject_id=subject_id,
        topic_id=topic_id,
    )
    result = []
    for row in rows:
        topic = row.get("topics") or {}
        subject = topic.get("subjects") or {}
        document = row.get("documents") or {}
        result.append(
            {
                "document_topic_id": int(row["document_topic_id"]),
                "document_id": int(row["document_id"]),
                "document_title": document.get("title"),
                "topic_id": topic.get("topic_id"),
                "topic_name": topic.get("topic_name"),
                "subject_id": topic.get("subject_id"),
                "subject_name": subject.get("subject_name"),
            }
        )
    return result


async def create_teacher_manual_question(current_user: CurrentUser, payload: ManualQuestionPayload) -> dict:
    allowed_rows = await list_teacher_document_topic_options(teacher_id=current_user.user_id)
    resolved_document_topic_id = _pick_document_topic_id(
        rows=allowed_rows,
        requested_document_topic_id=payload.document_topic_id,
        requested_topic_id=payload.topic_id,
    )

    created = await create_question_record(
        {
            "teacher_id": current_user.user_id,
            "document_topic_id": resolved_document_topic_id,
            "content": payload.content,
            "difficulty": payload.difficulty,
            "source": "manual",
            "status": payload.status,
            "explanation": payload.explanation,
        }
    )

    question_id = int(created["question_id"])
    await replace_question_options(question_id, payload.options, payload.correct_option_index)

    refreshed = await find_teacher_question_by_id(question_id, current_user.user_id)
    dt_by_id = {int(item["document_topic_id"]): item for item in allowed_rows}
    return _serialize_question(refreshed or created, dt_by_id)


async def update_teacher_question(current_user: CurrentUser, question_id: int, payload: ManualQuestionPayload) -> dict:
    existing = await find_teacher_question_by_id(question_id, current_user.user_id)
    if not existing:
        raise ValueError("Question not found")

    allowed_rows = await list_teacher_document_topic_options(teacher_id=current_user.user_id)
    resolved_document_topic_id = _pick_document_topic_id(
        rows=allowed_rows,
        requested_document_topic_id=payload.document_topic_id,
        requested_topic_id=payload.topic_id,
    )

    updated = await update_question_record(
        question_id=question_id,
        teacher_id=current_user.user_id,
        payload={
            "document_topic_id": resolved_document_topic_id,
            "content": payload.content,
            "difficulty": payload.difficulty,
            "status": payload.status,
            "explanation": payload.explanation,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        },
    )
    if not updated:
        raise ValueError("Question not found")

    await replace_question_options(question_id, payload.options, payload.correct_option_index)
    refreshed = await find_teacher_question_by_id(question_id, current_user.user_id)
    dt_by_id = {int(item["document_topic_id"]): item for item in allowed_rows}
    return _serialize_question(refreshed or updated, dt_by_id)


async def update_teacher_question_status(current_user: CurrentUser, question_id: int, status: str) -> dict:
    existing = await find_teacher_question_by_id(question_id, current_user.user_id)
    if not existing:
        raise ValueError("Question not found")

    updated = await update_question_record(
        question_id=question_id,
        teacher_id=current_user.user_id,
        payload={"status": status},
    )
    if not updated:
        raise ValueError("Question not found")
    return {"question_id": question_id, "status": status}


async def delete_teacher_question(current_user: CurrentUser, question_id: int) -> dict:
    existing = await find_teacher_question_by_id(question_id, current_user.user_id)
    if not existing:
        raise ValueError("Question not found")

    deleted = await soft_delete_question_record(question_id, current_user.user_id)
    if not deleted:
        raise ValueError("Question not found")
    return {"question_id": question_id, "deleted": True}
