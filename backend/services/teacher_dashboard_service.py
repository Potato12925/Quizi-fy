import asyncio

from middlewares.auth_middleware import CurrentUser
from repositories.teacher_dashboard_repository import (
    count_active_documents_by_teacher,
    count_active_topics_by_subject_ids,
    count_ai_requests_by_document_topic_ids,
    count_questions_by_document_topic_ids,
    list_active_topics_by_subject_ids,
    list_ai_requests_by_document_topic_ids_for_summary,
    list_assigned_subjects_for_teacher,
    list_questions_by_document_topic_ids_for_summary,
    list_recent_ai_requests_by_document_topic_ids,
    list_recent_approved_questions_by_teacher,
    list_recent_documents_by_teacher,
    list_teacher_document_topic_context,
)
from schemas.teacher_dashboard_schema import TeacherDashboardResponse


def _safe_int(value: object, default: int = 0) -> int:
    try:
        if value is None:
            return default
        return int(value)
    except (TypeError, ValueError):
        return default


def _safe_pct(numerator: int, denominator: int) -> float:
    if denominator <= 0:
        return 0.0
    return round((numerator / denominator) * 100, 2)


def _build_document_topic_context_map(rows: list[dict]) -> dict[int, dict]:
    context_map: dict[int, dict] = {}
    for row in rows:
        topic = row.get("topics") or {}
        subject = topic.get("subjects") or {}
        document = row.get("documents") or {}
        document_topic_id = _safe_int(row.get("document_topic_id"))
        context_map[document_topic_id] = {
            "document_topic_id": document_topic_id,
            "document_id": _safe_int(row.get("document_id")) or None,
            "document_title": document.get("title"),
            "topic_id": _safe_int(row.get("topic_id")) or None,
            "topic_name": topic.get("topic_name"),
            "subject_id": _safe_int(topic.get("subject_id")) or None,
            "subject_name": subject.get("subject_name"),
        }
    return context_map


def _serialize_recent_ai_request(item: dict, context_by_document_topic_id: dict[int, dict]) -> dict:
    document_topic_id = _safe_int(item.get("document_topic_id"))
    context = context_by_document_topic_id.get(document_topic_id) or {}
    return {
        "request_id": _safe_int(item.get("request_id")),
        "document_topic_id": document_topic_id,
        "document_id": context.get("document_id"),
        "document_title": context.get("document_title"),
        "topic_id": context.get("topic_id"),
        "topic_name": context.get("topic_name"),
        "subject_id": context.get("subject_id"),
        "subject_name": context.get("subject_name"),
        "num_questions": _safe_int(item.get("num_questions")),
        "difficulty": item.get("difficulty"),
        "status": item.get("status"),
        "generated_question_count": _safe_int(item.get("generated_question_count")),
        "is_reviewed": bool(item.get("is_reviewed")),
        "created_at": item.get("created_at"),
        "updated_at": item.get("updated_at"),
    }


def _serialize_recent_approved_question(item: dict, context_by_document_topic_id: dict[int, dict]) -> dict:
    document_topic_id = _safe_int(item.get("document_topic_id"))
    context = context_by_document_topic_id.get(document_topic_id) or {}
    return {
        "question_id": _safe_int(item.get("question_id")),
        "document_topic_id": document_topic_id,
        "ai_request_id": _safe_int(item.get("ai_request_id")) or None,
        "content": item.get("content") or "",
        "difficulty": item.get("difficulty"),
        "source": item.get("source"),
        "status": item.get("status"),
        "document_id": context.get("document_id"),
        "document_title": context.get("document_title"),
        "topic_id": context.get("topic_id"),
        "topic_name": context.get("topic_name"),
        "subject_id": context.get("subject_id"),
        "subject_name": context.get("subject_name"),
        "created_at": item.get("created_at"),
        "updated_at": item.get("updated_at"),
    }


async def get_teacher_dashboard_stats(current_user: CurrentUser, recent_limit: int = 5) -> dict:
    teacher_id = current_user.user_id
    assigned_subjects = await list_assigned_subjects_for_teacher(teacher_id)
    subject_ids = sorted({_safe_int(item.get("subject_id")) for item in assigned_subjects if item.get("subject_id") is not None})

    topic_count_task = count_active_topics_by_subject_ids(subject_ids)
    document_count_task = count_active_documents_by_teacher(teacher_id)
    upload_topics_task = list_active_topics_by_subject_ids(subject_ids)
    document_topic_rows_task = list_teacher_document_topic_context(teacher_id)
    (
        total_topics,
        total_documents,
        upload_topics,
        document_topic_rows,
    ) = await asyncio.gather(
        topic_count_task,
        document_count_task,
        upload_topics_task,
        document_topic_rows_task,
    )

    context_by_document_topic_id = _build_document_topic_context_map(document_topic_rows)
    document_topic_ids = sorted(context_by_document_topic_id.keys())

    ai_total_task = count_ai_requests_by_document_topic_ids(document_topic_ids)
    ai_pending_task = count_ai_requests_by_document_topic_ids(document_topic_ids, status="pending")
    ai_processing_task = count_ai_requests_by_document_topic_ids(document_topic_ids, status="processing")
    ai_completed_task = count_ai_requests_by_document_topic_ids(document_topic_ids, status="completed")
    ai_failed_task = count_ai_requests_by_document_topic_ids(document_topic_ids, status="failed")
    ai_cancelled_task = count_ai_requests_by_document_topic_ids(document_topic_ids, status="cancelled")

    question_total_task = count_questions_by_document_topic_ids(teacher_id=teacher_id, document_topic_ids=document_topic_ids)
    question_draft_task = count_questions_by_document_topic_ids(teacher_id=teacher_id, document_topic_ids=document_topic_ids, status="draft")
    question_approved_task = count_questions_by_document_topic_ids(teacher_id=teacher_id, document_topic_ids=document_topic_ids, status="approved")
    question_rejected_task = count_questions_by_document_topic_ids(teacher_id=teacher_id, document_topic_ids=document_topic_ids, status="rejected")
    question_inactive_task = count_questions_by_document_topic_ids(teacher_id=teacher_id, document_topic_ids=document_topic_ids, status="inactive")

    question_easy_task = count_questions_by_document_topic_ids(teacher_id=teacher_id, document_topic_ids=document_topic_ids, difficulty="easy")
    question_medium_task = count_questions_by_document_topic_ids(teacher_id=teacher_id, document_topic_ids=document_topic_ids, difficulty="medium")
    question_hard_task = count_questions_by_document_topic_ids(teacher_id=teacher_id, document_topic_ids=document_topic_ids, difficulty="hard")

    recent_ai_task = list_recent_ai_requests_by_document_topic_ids(document_topic_ids=document_topic_ids, limit=recent_limit)
    recent_documents_task = list_recent_documents_by_teacher(teacher_id=teacher_id, limit=recent_limit)
    recent_approved_questions_task = list_recent_approved_questions_by_teacher(teacher_id=teacher_id, limit=recent_limit)

    (
        total_ai_requests,
        ai_pending,
        ai_processing,
        ai_completed,
        ai_failed,
        ai_cancelled,
        total_questions,
        question_draft,
        question_approved,
        question_rejected,
        question_inactive,
        question_easy,
        question_medium,
        question_hard,
        recent_ai_rows,
        recent_documents,
        recent_approved_questions_rows,
    ) = await asyncio.gather(
        ai_total_task,
        ai_pending_task,
        ai_processing_task,
        ai_completed_task,
        ai_failed_task,
        ai_cancelled_task,
        question_total_task,
        question_draft_task,
        question_approved_task,
        question_rejected_task,
        question_inactive_task,
        question_easy_task,
        question_medium_task,
        question_hard_task,
        recent_ai_task,
        recent_documents_task,
        recent_approved_questions_task,
    )

    recent_document_ids = sorted({_safe_int(item.get("document_id")) for item in recent_documents if item.get("document_id") is not None})
    recent_doc_topic_ids = [
        dt_id
        for dt_id, context in context_by_document_topic_id.items()
        if context.get("document_id") in recent_document_ids
    ]
    recent_ai_summary_rows, recent_question_summary_rows = await asyncio.gather(
        list_ai_requests_by_document_topic_ids_for_summary(recent_doc_topic_ids),
        list_questions_by_document_topic_ids_for_summary(teacher_id=teacher_id, document_topic_ids=recent_doc_topic_ids),
    )

    ai_summary_by_document: dict[int, dict] = {}
    for row in recent_ai_summary_rows:
        context = context_by_document_topic_id.get(_safe_int(row.get("document_topic_id"))) or {}
        document_id = context.get("document_id")
        if document_id is None:
            continue
        entry = ai_summary_by_document.setdefault(
            document_id,
            {"count": 0, "latest_created_at": "", "latest_status": None},
        )
        entry["count"] += 1
        created_at = str(row.get("created_at") or "")
        if created_at >= str(entry["latest_created_at"] or ""):
            entry["latest_created_at"] = created_at
            entry["latest_status"] = row.get("status")

    question_count_by_document: dict[int, int] = {}
    for row in recent_question_summary_rows:
        context = context_by_document_topic_id.get(_safe_int(row.get("document_topic_id"))) or {}
        document_id = context.get("document_id")
        if document_id is None:
            continue
        question_count_by_document[document_id] = question_count_by_document.get(document_id, 0) + 1

    topic_name_by_subject: dict[int, dict[int, str]] = {}
    for topic in upload_topics:
        subject_id = _safe_int(topic.get("subject_id"))
        topic_id = _safe_int(topic.get("topic_id"))
        if subject_id <= 0 or topic_id <= 0:
            continue
        topic_name_by_subject.setdefault(subject_id, {})[topic_id] = topic.get("topic_name") or "Unknown topic"

    upload_subjects = []
    for subject in assigned_subjects:
        subject_id = _safe_int(subject.get("subject_id"))
        topic_map = topic_name_by_subject.get(subject_id) or {}
        upload_subjects.append(
            {
                "subject_id": subject_id,
                "subject_name": subject.get("subject_name") or "Unknown subject",
                "topics": [
                    {"topic_id": topic_id, "topic_name": topic_name}
                    for topic_id, topic_name in sorted(topic_map.items(), key=lambda item: item[0])
                ],
            }
        )

    recent_documents_serialized = []
    for row in recent_documents:
        document_id = _safe_int(row.get("document_id"))
        related_contexts = [
            context
            for context in context_by_document_topic_id.values()
            if context.get("document_id") == document_id
        ]
        topic_ids = sorted({context.get("topic_id") for context in related_contexts if context.get("topic_id") is not None})
        topic_names = sorted({context.get("topic_name") for context in related_contexts if context.get("topic_name")})
        subject_id = related_contexts[0].get("subject_id") if related_contexts else None
        subject_name = related_contexts[0].get("subject_name") if related_contexts else None
        ai_summary = ai_summary_by_document.get(document_id) or {}

        recent_documents_serialized.append(
            {
                "document_id": document_id,
                "title": row.get("title") or "",
                "status": row.get("status") or "active",
                "file_type": row.get("file_type"),
                "file_size": _safe_int(row.get("file_size")),
                "created_at": row.get("created_at"),
                "updated_at": row.get("updated_at"),
                "subject_id": subject_id,
                "subject_name": subject_name,
                "topic_ids": topic_ids,
                "topic_names": topic_names,
                "ai_request_count": _safe_int(ai_summary.get("count")),
                "question_count": question_count_by_document.get(document_id, 0),
                "latest_ai_status": ai_summary.get("latest_status"),
            }
        )

    response_payload = {
        "teacher": {
            "user_id": current_user.user_id,
            "username": current_user.username,
        },
        "summary": {
            "total_assigned_subjects": len(assigned_subjects),
            "total_topics": total_topics,
            "total_documents": total_documents,
            "total_ai_requests": total_ai_requests,
            "total_questions": total_questions,
        },
        "ai_request_statuses": {
            "pending": ai_pending,
            "processing": ai_processing,
            "completed": ai_completed,
            "failed": ai_failed,
            "cancelled": ai_cancelled,
        },
        "question_statuses": {
            "draft": question_draft,
            "approved": question_approved,
            "rejected": question_rejected,
            "inactive": question_inactive,
        },
        "question_difficulty": {
            "easy": question_easy,
            "medium": question_medium,
            "hard": question_hard,
        },
        "insights": {
            "ai_completion_rate_pct": _safe_pct(ai_completed, total_ai_requests),
            "question_approval_rate_pct": _safe_pct(question_approved, total_questions),
            "pending_ai_requests": ai_pending + ai_processing,
            "draft_questions": question_draft,
        },
        "recent_ai_requests": [
            _serialize_recent_ai_request(item, context_by_document_topic_id)
            for item in recent_ai_rows
        ],
        "recent_documents": recent_documents_serialized,
        "recent_approved_questions": [
            _serialize_recent_approved_question(item, context_by_document_topic_id)
            for item in recent_approved_questions_rows
        ],
        "upload_subjects": upload_subjects,
    }

    return TeacherDashboardResponse(**response_payload).model_dump()
