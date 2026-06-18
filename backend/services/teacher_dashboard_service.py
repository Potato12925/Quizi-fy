import asyncio

from middlewares.auth_middleware import CurrentUser
from repositories.teacher_dashboard_repository import (
    count_active_documents_by_teacher,
    count_active_topics_by_subject_ids,
    list_active_topics_by_subject_ids,
    list_ai_requests_by_document_topic_ids_for_stats,
    list_assigned_subjects_for_teacher,
    list_questions_by_document_topic_ids_for_stats,
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
        class_subject = topic.get("class_subjects") or {}
        subject = class_subject.get("subjects") or {}
        class_ref = class_subject.get("classes") or {}
        document = row.get("documents") or {}
        document_topic_id = _safe_int(row.get("document_topic_id"))
        context_map[document_topic_id] = {
            "document_topic_id": document_topic_id,
            "document_id": _safe_int(row.get("document_id")) or None,
            "document_title": document.get("title"),
            "topic_id": _safe_int(row.get("topic_id")) or None,
            "topic_name": topic.get("topic_name"),
            "class_subject_id": _safe_int(topic.get("class_subject_id")) or None,
            "class_id": _safe_int(class_subject.get("class_id")) or None,
            "class_name": class_ref.get("class_name"),
            "subject_id": _safe_int(class_subject.get("subject_id")) or None,
            "subject_name": subject.get("subject_name"),
        }
    return context_map


def _build_document_topic_ids_by_document(context_by_document_topic_id: dict[int, dict]) -> dict[int, list[int]]:
    ids_by_document: dict[int, list[int]] = {}
    for document_topic_id, context in context_by_document_topic_id.items():
        document_id = context.get("document_id")
        if document_id is None:
            continue
        ids_by_document.setdefault(document_id, []).append(document_topic_id)
    return ids_by_document


def _serialize_difficulty_distribution(items: list[dict] | None) -> list[dict]:
    rows = items or []
    sorted_rows = sorted(
        rows,
        key=lambda item: (int(item.get("created_at") is None), int(item.get("distribution_id") or 0)),
    )
    return [
        {
            "difficulty": item.get("difficulty"),
            "percentage": _safe_int(item.get("percentage")) if item.get("percentage") is not None else None,
            "question_count": _safe_int(item.get("question_count")),
        }
        for item in sorted_rows
    ]


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
        "class_subject_id": context.get("class_subject_id"),
        "class_id": context.get("class_id"),
        "class_name": context.get("class_name"),
        "subject_id": context.get("subject_id"),
        "subject_name": context.get("subject_name"),
        "num_questions": _safe_int(item.get("num_questions")),
        "difficulty_distribution": _serialize_difficulty_distribution(
            item.get("ai_request_difficulty_distribution")
        ),
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
        "class_subject_id": context.get("class_subject_id"),
        "class_id": context.get("class_id"),
        "class_name": context.get("class_name"),
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

    ai_stats_rows_task = list_ai_requests_by_document_topic_ids_for_stats(document_topic_ids)
    question_stats_rows_task = list_questions_by_document_topic_ids_for_stats(teacher_id=teacher_id, document_topic_ids=document_topic_ids)

    recent_ai_task = list_recent_ai_requests_by_document_topic_ids(document_topic_ids=document_topic_ids, limit=recent_limit)
    recent_documents_task = list_recent_documents_by_teacher(teacher_id=teacher_id, limit=recent_limit)
    recent_approved_questions_task = list_recent_approved_questions_by_teacher(teacher_id=teacher_id, limit=recent_limit)

    (
        ai_stats_rows,
        question_stats_rows,
        recent_ai_rows,
        recent_documents,
        recent_approved_questions_rows,
    ) = await asyncio.gather(
        ai_stats_rows_task,
        question_stats_rows_task,
        recent_ai_task,
        recent_documents_task,
        recent_approved_questions_task,
    )

    ai_pending = 0
    ai_processing = 0
    ai_completed = 0
    ai_failed = 0
    ai_cancelled = 0
    ai_status_by_document_topic_id: dict[int, list[dict]] = {}
    for row in ai_stats_rows:
        status = str(row.get("status") or "")
        if status == "pending":
            ai_pending += 1
        elif status == "processing":
            ai_processing += 1
        elif status == "completed":
            ai_completed += 1
        elif status == "failed":
            ai_failed += 1
        elif status == "cancelled":
            ai_cancelled += 1

        document_topic_id = _safe_int(row.get("document_topic_id"))
        if document_topic_id > 0:
            ai_status_by_document_topic_id.setdefault(document_topic_id, []).append(row)
    total_ai_requests = len(ai_stats_rows)

    question_draft = 0
    question_approved = 0
    question_rejected = 0
    question_inactive = 0
    question_recognition = 0
    question_comprehension = 0
    question_application = 0
    question_advanced = 0
    question_count_by_document_topic_id: dict[int, int] = {}
    for row in question_stats_rows:
        status = str(row.get("status") or "")
        if status == "draft":
            question_draft += 1
        elif status == "approved":
            question_approved += 1
        elif status == "rejected":
            question_rejected += 1
        elif status == "inactive":
            question_inactive += 1

        difficulty = str(row.get("difficulty") or "")
        if difficulty == "recognition":
            question_recognition += 1
        elif difficulty == "comprehension":
            question_comprehension += 1
        elif difficulty == "application":
            question_application += 1
        elif difficulty == "advanced":
            question_advanced += 1

        document_topic_id = _safe_int(row.get("document_topic_id"))
        if document_topic_id > 0:
            question_count_by_document_topic_id[document_topic_id] = question_count_by_document_topic_id.get(document_topic_id, 0) + 1
    total_questions = len(question_stats_rows)

    ai_summary_by_document: dict[int, dict] = {}
    question_count_by_document: dict[int, int] = {}
    document_topic_ids_by_document = _build_document_topic_ids_by_document(context_by_document_topic_id)
    for document_id, topic_ids in document_topic_ids_by_document.items():
        latest_created_at = ""
        latest_status = None
        total_count = 0
        question_count = 0

        for topic_id in topic_ids:
            ai_rows = ai_status_by_document_topic_id.get(topic_id) or []
            total_count += len(ai_rows)
            for row in ai_rows:
                created_at = str(row.get("created_at") or "")
                if created_at >= latest_created_at:
                    latest_created_at = created_at
                    latest_status = row.get("status")

            question_count += question_count_by_document_topic_id.get(topic_id, 0)

        ai_summary_by_document[document_id] = {
            "count": total_count,
            "latest_created_at": latest_created_at,
            "latest_status": latest_status,
        }
        question_count_by_document[document_id] = question_count

    topic_name_by_subject: dict[int, dict[int, str]] = {}
    for topic in upload_topics:
        class_subject = topic.get("class_subjects") or {}
        subject_id = _safe_int(class_subject.get("subject_id"))
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
        related_document_topic_ids = document_topic_ids_by_document.get(document_id) or []
        related_contexts = [
            context_by_document_topic_id[document_topic_id]
            for document_topic_id in related_document_topic_ids
            if document_topic_id in context_by_document_topic_id
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
            "recognition": question_recognition,
            "comprehension": question_comprehension,
            "application": question_application,
            "advanced": question_advanced,
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
