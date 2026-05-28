import csv
import io
import json
from collections import Counter, defaultdict
from datetime import datetime
from math import ceil

from middlewares.auth_middleware import CurrentUser
from repositories.report_repository import (
    list_active_subjects,
    list_active_topics,
    list_active_users,
    list_ai_requests,
    list_class_student_counts,
    list_classes,
    list_document_topics,
    list_documents,
    list_question_options,
    list_questions,
    list_teacher_assigned_subject_ids,
    list_user_roles,
    list_users_by_ids,
)
from schemas.report_schema import ReportFilterOptions, ReportQueryParams, TopicCoverageQueryParams

try:
    from openpyxl import Workbook
except ImportError:  # pragma: no cover
    Workbook = None

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
except ImportError:  # pragma: no cover
    colors = None
    landscape = None
    A4 = None
    getSampleStyleSheet = None
    Paragraph = None
    SimpleDocTemplate = None
    Spacer = None
    Table = None
    TableStyle = None


class ReportValidationError(ValueError):
    pass


class ReportAuthorizationError(ValueError):
    pass


ALLOWED_SORT_FIELDS = {
    "question-summary": {
        "question_id",
        "teacher_name",
        "subject_name",
        "topic_name",
        "difficulty",
        "status",
        "source",
        "created_at",
    },
    "ai-summary": {
        "request_id",
        "teacher_name",
        "subject_name",
        "topic_name",
        "status",
        "difficulty",
        "generated_question_count",
        "created_at",
    },
    "document-summary": {
        "document_id",
        "teacher_name",
        "title",
        "status",
        "topic_count",
        "created_at",
    },
    "teacher-activity": {
        "teacher_id",
        "teacher_name",
        "question_count",
        "document_count",
        "ai_request_count",
        "approval_rate_pct",
    },
    "topic-coverage": {
        "topic_id",
        "topic_name",
        "subject_name",
        "question_count",
        "hard_question_count",
        "document_count",
        "ai_generated_question_count",
    },
    "data-quality": {
        "issue_type",
        "entity_type",
        "entity_id",
        "subject_name",
        "topic_name",
        "teacher_name",
        "created_at",
    },
}


def _to_int(value: object, default: int = 0) -> int:
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


def _normalize_text(value: str | None) -> str:
    return " ".join((value or "").strip().lower().split())


def _matches_search(value: str | None, keyword: str | None) -> bool:
    if not keyword:
        return True
    return keyword.lower() in (value or "").lower()


def _sort_rows(rows: list[dict], sort_by: str, sort_order: str, allowed: set[str], fallback: str) -> list[dict]:
    sort_field = sort_by if sort_by in allowed else fallback
    reverse = sort_order == "desc"
    return sorted(
        rows,
        key=lambda item: (
            item.get(sort_field) is None,
            str(item.get(sort_field) or ""),
        ),
        reverse=reverse,
    )


def _paginate(rows: list[dict], page: int, limit: int) -> tuple[list[dict], dict]:
    total = len(rows)
    total_pages = ceil(total / limit) if total > 0 else 1
    start = (page - 1) * limit
    end = start + limit
    return (
        rows[start:end],
        {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
        },
    )


def _group_count(rows: list[dict], key_name: str) -> list[dict]:
    counter = Counter()
    for item in rows:
        key = str(item.get(key_name) or "unknown")
        counter[key] += 1
    return [{"key": key, "label": key, "count": count} for key, count in sorted(counter.items(), key=lambda x: x[0])]


async def _load_users_and_roles() -> tuple[dict[int, dict], dict[int, list[str]]]:
    users = await list_active_users()
    user_ids = [int(item["user_id"]) for item in users if item.get("user_id") is not None]
    roles_by_user_id = await list_user_roles(user_ids)
    user_map = {int(item["user_id"]): item for item in users if item.get("user_id") is not None}
    return user_map, roles_by_user_id


def _is_admin(current_user: CurrentUser) -> bool:
    return "admin" in current_user.roles


def _is_teacher(current_user: CurrentUser) -> bool:
    return "teacher" in current_user.roles


async def _resolve_scope(
    current_user: CurrentUser,
    teacher_id: int | None,
    subject_id: int | None,
    topic_id: int | None,
) -> dict:
    is_admin = _is_admin(current_user)
    is_teacher = _is_teacher(current_user)

    if not is_admin and not is_teacher:
        raise ReportAuthorizationError("Only admin or teacher can access reports")

    allowed_subject_ids: list[int] | None = None
    effective_teacher_id: int | None = teacher_id

    if is_teacher and not is_admin:
        effective_teacher_id = current_user.user_id
        if teacher_id is not None and teacher_id != current_user.user_id:
            raise ReportAuthorizationError("Teacher can only access their own report scope")

        allowed_subject_ids = await list_teacher_assigned_subject_ids(current_user.user_id)
        if subject_id is not None and subject_id not in allowed_subject_ids:
            raise ReportAuthorizationError("Subject is out of teacher scope")

    if topic_id is not None:
        topic_rows = await list_active_topics(topic_ids=[topic_id])
        if not topic_rows:
            raise ReportValidationError("topic_id is invalid")
        topic_subject_id = _to_int(topic_rows[0].get("subject_id"))
        if subject_id is not None and topic_subject_id != subject_id:
            raise ReportValidationError("topic_id does not belong to subject_id")
        if allowed_subject_ids is not None and topic_subject_id not in allowed_subject_ids:
            raise ReportAuthorizationError("Topic is out of teacher scope")

    return {
        "is_admin": is_admin,
        "is_teacher": is_teacher,
        "teacher_id": effective_teacher_id,
        "allowed_subject_ids": allowed_subject_ids,
    }


async def _build_filter_options(scope: dict, selected_subject_id: int | None = None) -> dict:
    user_map, roles_by_user_id = await _load_users_and_roles()

    teachers = []
    for user_id, user in user_map.items():
        if "teacher" not in roles_by_user_id.get(user_id, []):
            continue
        if scope.get("teacher_id") is not None and user_id != scope["teacher_id"]:
            continue
        teachers.append({"id": user_id, "name": str(user.get("full_name") or user.get("username") or "Unknown")})
    teachers.sort(key=lambda item: item["name"])

    subject_ids = scope.get("allowed_subject_ids") if scope.get("allowed_subject_ids") is not None else None
    subjects = await list_active_subjects(subject_ids=subject_ids)
    subject_options = [
        {"id": _to_int(item.get("subject_id")), "name": str(item.get("subject_name") or "Unknown")}
        for item in subjects
    ]

    topic_subject_ids = subject_ids
    if selected_subject_id is not None:
        topic_subject_ids = [selected_subject_id]
    topics = await list_active_topics(subject_ids=topic_subject_ids)
    topic_options = [
        {"id": _to_int(item.get("topic_id")), "name": str(item.get("topic_name") or "Unknown")}
        for item in topics
    ]

    return ReportFilterOptions(
        teachers=teachers,
        subjects=subject_options,
        topics=topic_options,
    ).model_dump()


async def _load_topic_subject_maps(scope: dict) -> tuple[dict[int, dict], dict[int, dict]]:
    subject_ids = scope.get("allowed_subject_ids") if scope.get("allowed_subject_ids") is not None else None
    subject_rows = await list_active_subjects(subject_ids=subject_ids)
    subject_map = {
        _to_int(item.get("subject_id")): {
            "subject_id": _to_int(item.get("subject_id")),
            "subject_name": str(item.get("subject_name") or "Unknown"),
            "subject_code": item.get("subject_code"),
        }
        for item in subject_rows
    }

    topic_rows = await list_active_topics(subject_ids=list(subject_map.keys()) if subject_map else subject_ids)
    topic_map = {
        _to_int(item.get("topic_id")): {
            "topic_id": _to_int(item.get("topic_id")),
            "topic_name": str(item.get("topic_name") or "Unknown"),
            "subject_id": _to_int(item.get("subject_id")),
        }
        for item in topic_rows
    }
    return topic_map, subject_map


async def get_dashboard_report(current_user: CurrentUser, params: ReportQueryParams) -> dict:
    scope = await _resolve_scope(
        current_user=current_user,
        teacher_id=params.teacher_id,
        subject_id=params.subject_id,
        topic_id=params.topic_id,
    )

    user_map, roles_by_user_id = await _load_users_and_roles()
    teacher_users = [
        user for user_id, user in user_map.items()
        if "teacher" in roles_by_user_id.get(user_id, [])
    ]

    topic_map, subject_map = await _load_topic_subject_maps(scope)
    selected_topic_ids = set(topic_map.keys())
    if params.subject_id is not None:
        selected_topic_ids = {
            topic_id
            for topic_id, topic in topic_map.items()
            if _to_int(topic.get("subject_id")) == params.subject_id
        }
    if params.topic_id is not None:
        selected_topic_ids = {params.topic_id}

    documents = await list_documents(
        teacher_id=scope.get("teacher_id"),
        date_from=params.date_from,
        date_to=params.date_to,
    )
    document_ids = [_to_int(item.get("document_id")) for item in documents]

    document_topics = await list_document_topics(document_ids=document_ids)
    if selected_topic_ids:
        document_topics = [
            item for item in document_topics if _to_int(item.get("topic_id")) in selected_topic_ids
        ]

    scoped_document_ids = sorted({_to_int(item.get("document_id")) for item in document_topics})
    if scoped_document_ids:
        documents = [item for item in documents if _to_int(item.get("document_id")) in scoped_document_ids]
    else:
        documents = []

    scoped_document_topic_ids = sorted({_to_int(item.get("document_topic_id")) for item in document_topics})

    questions = await list_questions(
        teacher_id=scope.get("teacher_id"),
        date_from=params.date_from,
        date_to=params.date_to,
    )
    questions = [
        item for item in questions
        if _to_int(item.get("document_topic_id")) in set(scoped_document_topic_ids)
    ]

    ai_requests = await list_ai_requests(
        document_topic_ids=scoped_document_topic_ids,
        date_from=params.date_from,
        date_to=params.date_to,
    )

    pending_approvals = sum(1 for item in questions if item.get("status") == "draft")

    question_by_status = _group_count(questions, "status")
    question_by_difficulty = _group_count(questions, "difficulty")
    question_by_source = _group_count(questions, "source")
    ai_by_status = _group_count(ai_requests, "status")

    document_map = {_to_int(item.get("document_id")): item for item in documents}
    doc_topic_map = {_to_int(item.get("document_topic_id")): item for item in document_topics}

    recent_ai = []
    for item in ai_requests[:10]:
        document_topic_id = _to_int(item.get("document_topic_id"))
        doc_topic = doc_topic_map.get(document_topic_id) or {}
        topic_id = _to_int(doc_topic.get("topic_id"))
        topic = topic_map.get(topic_id) or {}
        subject = subject_map.get(_to_int(topic.get("subject_id"))) or {}
        document = document_map.get(_to_int(doc_topic.get("document_id"))) or {}
        teacher = user_map.get(_to_int(document.get("teacher_id"))) or {}

        recent_ai.append(
            {
                "request_id": _to_int(item.get("request_id")),
                "status": item.get("status"),
                "difficulty": item.get("difficulty"),
                "generated_question_count": _to_int(item.get("generated_question_count")),
                "num_questions": _to_int(item.get("num_questions")),
                "created_at": item.get("created_at"),
                "teacher_id": _to_int(document.get("teacher_id")) or None,
                "teacher_name": teacher.get("full_name") or teacher.get("username"),
                "subject_id": subject.get("subject_id"),
                "subject_name": subject.get("subject_name"),
                "topic_id": topic.get("topic_id"),
                "topic_name": topic.get("topic_name"),
                "document_id": _to_int(doc_topic.get("document_id")) or None,
                "document_title": document.get("title"),
            }
        )

    recent_questions = []
    for item in questions[:10]:
        document_topic_id = _to_int(item.get("document_topic_id"))
        doc_topic = doc_topic_map.get(document_topic_id) or {}
        topic_id = _to_int(doc_topic.get("topic_id"))
        topic = topic_map.get(topic_id) or {}
        subject = subject_map.get(_to_int(topic.get("subject_id"))) or {}
        teacher = user_map.get(_to_int(item.get("teacher_id"))) or {}
        document = document_map.get(_to_int(doc_topic.get("document_id"))) or {}

        recent_questions.append(
            {
                "question_id": _to_int(item.get("question_id")),
                "content": item.get("content"),
                "status": item.get("status"),
                "difficulty": item.get("difficulty"),
                "source": item.get("source"),
                "created_at": item.get("created_at"),
                "teacher_id": _to_int(item.get("teacher_id")) or None,
                "teacher_name": teacher.get("full_name") or teacher.get("username"),
                "subject_id": subject.get("subject_id"),
                "subject_name": subject.get("subject_name"),
                "topic_id": topic.get("topic_id"),
                "topic_name": topic.get("topic_name"),
                "document_id": _to_int(doc_topic.get("document_id")) or None,
                "document_title": document.get("title"),
            }
        )

    recent_documents = []
    for item in documents[:10]:
        current_document_id = _to_int(item.get("document_id"))
        teacher = user_map.get(_to_int(item.get("teacher_id"))) or {}

        topic_ids = [
            _to_int(doc_topic.get("topic_id"))
            for doc_topic in document_topics
            if _to_int(doc_topic.get("document_id")) == current_document_id
        ]
        topics = [topic_map.get(topic_id) or {} for topic_id in topic_ids]
        subject_names = sorted({
            (subject_map.get(_to_int(topic.get("subject_id"))) or {}).get("subject_name")
            for topic in topics
            if _to_int(topic.get("subject_id")) in subject_map
        })

        recent_documents.append(
            {
                "document_id": current_document_id,
                "title": item.get("title"),
                "status": item.get("status"),
                "created_at": item.get("created_at"),
                "teacher_id": _to_int(item.get("teacher_id")) or None,
                "teacher_name": teacher.get("full_name") or teacher.get("username"),
                "topic_names": [topic.get("topic_name") for topic in topics if topic.get("topic_name")],
                "subject_names": [name for name in subject_names if name],
            }
        )

    recent_activity = []
    for item in recent_ai[:5]:
        recent_activity.append(
            {
                "activity_type": "ai_request",
                "activity_id": item.get("request_id"),
                "title": f"AI request #{item.get('request_id')} ({item.get('status')})",
                "created_at": item.get("created_at"),
            }
        )
    for item in recent_questions[:5]:
        recent_activity.append(
            {
                "activity_type": "question",
                "activity_id": item.get("question_id"),
                "title": f"Question #{item.get('question_id')} ({item.get('status')})",
                "created_at": item.get("created_at"),
            }
        )
    for item in recent_documents[:5]:
        recent_activity.append(
            {
                "activity_type": "document",
                "activity_id": item.get("document_id"),
                "title": f"Document: {item.get('title')}",
                "created_at": item.get("created_at"),
            }
        )
    recent_activity = sorted(recent_activity, key=lambda x: str(x.get("created_at") or ""), reverse=True)[:15]

    recent_users = []
    sorted_users = sorted(user_map.values(), key=lambda item: str(item.get("created_at") or ""), reverse=True)
    for user in sorted_users[:20]:
        user_id = _to_int(user.get("user_id"))
        roles = roles_by_user_id.get(user_id, [])
        primary_role = roles[0] if roles else "unknown"
        recent_users.append(
            {
                "id": user_id,
                "name": user.get("full_name") or user.get("username"),
                "email": user.get("username"),
                "role": primary_role,
                "status": "active" if user.get("is_active") else "inactive",
            }
        )

    class_rows = await list_classes(teacher_id=scope.get("teacher_id"))
    class_ids = [_to_int(item.get("class_id")) for item in class_rows]
    class_student_counts = await list_class_student_counts(class_ids)
    classes_overview = []
    for item in class_rows:
        owner_id = _to_int(item.get("teacher_id"))
        owner = user_map.get(owner_id) or {}
        class_id = _to_int(item.get("class_id"))
        classes_overview.append(
            {
                "id": class_id,
                "code": item.get("class_code"),
                "name": item.get("class_name"),
                "owner_id": owner_id,
                "owner_name": owner.get("full_name") or owner.get("username") or "Unknown",
                "students": class_student_counts.get(class_id, 0),
                "status": "Hoat dong" if item.get("status") == "active" else "Tam khoa",
            }
        )

    filter_options = await _build_filter_options(scope=scope, selected_subject_id=params.subject_id)

    total_teachers = len(teacher_users) if scope.get("teacher_id") is None else 1
    total_subjects = len(subject_map)
    total_topics = len(topic_map)

    return {
        "summary": {
            "total_teachers": total_teachers,
            "total_subjects": total_subjects,
            "total_topics": total_topics,
            "total_documents": len(documents),
            "total_questions": len(questions),
            "total_ai_requests": len(ai_requests),
            "pending_approvals": pending_approvals,
        },
        "questions": {
            "by_status": question_by_status,
            "by_difficulty": question_by_difficulty,
            "by_source": question_by_source,
            "recent": recent_questions,
        },
        "ai_requests": {
            "by_status": ai_by_status,
            "recent": recent_ai,
        },
        "documents": {
            "recent": recent_documents,
        },
        "recent_activity": recent_activity,
        "recent_users": recent_users,
        "classes_overview": classes_overview,
        "filter_options": filter_options,
    }


async def _build_question_rows(current_user: CurrentUser, params: ReportQueryParams) -> tuple[list[dict], dict]:
    scope = await _resolve_scope(
        current_user=current_user,
        teacher_id=params.teacher_id,
        subject_id=params.subject_id,
        topic_id=params.topic_id,
    )

    questions = await list_questions(
        teacher_id=scope.get("teacher_id"),
        status=params.status,
        difficulty=params.difficulty,
        source=params.source,
        date_from=params.date_from,
        date_to=params.date_to,
        search=params.search,
    )

    question_teacher_ids = sorted({_to_int(item.get("teacher_id")) for item in questions if item.get("teacher_id") is not None})
    users = await list_users_by_ids(question_teacher_ids)
    user_map = {_to_int(item.get("user_id")): item for item in users}

    document_topic_ids = sorted({_to_int(item.get("document_topic_id")) for item in questions if item.get("document_topic_id") is not None})
    document_topics = await list_document_topics(document_topic_ids=document_topic_ids)
    document_topic_map = {_to_int(item.get("document_topic_id")): item for item in document_topics}

    topic_ids = sorted({_to_int(item.get("topic_id")) for item in document_topics if item.get("topic_id") is not None})
    topics = await list_active_topics(topic_ids=topic_ids)
    topic_map = {_to_int(item.get("topic_id")): item for item in topics}

    subject_ids = sorted({_to_int(item.get("subject_id")) for item in topics if item.get("subject_id") is not None})
    subjects = await list_active_subjects(subject_ids=subject_ids)
    subject_map = {_to_int(item.get("subject_id")): item for item in subjects}

    document_ids = sorted({_to_int(item.get("document_id")) for item in document_topics if item.get("document_id") is not None})
    documents = await list_documents(teacher_id=scope.get("teacher_id"), document_ids=document_ids)
    document_map = {_to_int(item.get("document_id")): item for item in documents}

    rows = []
    for item in questions:
        document_topic = document_topic_map.get(_to_int(item.get("document_topic_id"))) or {}
        topic = topic_map.get(_to_int(document_topic.get("topic_id"))) or {}
        subject = subject_map.get(_to_int(topic.get("subject_id"))) or {}

        if params.subject_id is not None and _to_int(subject.get("subject_id")) != params.subject_id:
            continue
        if params.topic_id is not None and _to_int(topic.get("topic_id")) != params.topic_id:
            continue

        teacher = user_map.get(_to_int(item.get("teacher_id"))) or {}
        document = document_map.get(_to_int(document_topic.get("document_id"))) or {}

        row = {
            "question_id": _to_int(item.get("question_id")),
            "teacher_id": _to_int(item.get("teacher_id")) or None,
            "teacher_name": teacher.get("full_name") or teacher.get("username") or "Unknown",
            "subject_id": _to_int(subject.get("subject_id")) or None,
            "subject_name": subject.get("subject_name") or "Unknown",
            "topic_id": _to_int(topic.get("topic_id")) or None,
            "topic_name": topic.get("topic_name") or "Unknown",
            "document_id": _to_int(document.get("document_id")) or None,
            "document_title": document.get("title"),
            "difficulty": item.get("difficulty"),
            "status": item.get("status"),
            "source": item.get("source"),
            "content": item.get("content"),
            "created_at": item.get("created_at"),
            "updated_at": item.get("updated_at"),
            "explanation": item.get("explanation"),
        }

        if params.search and not (
            _matches_search(row.get("content"), params.search)
            or _matches_search(row.get("teacher_name"), params.search)
            or _matches_search(row.get("subject_name"), params.search)
            or _matches_search(row.get("topic_name"), params.search)
        ):
            continue

        rows.append(row)

    return rows, scope


async def get_question_summary_report(current_user: CurrentUser, params: ReportQueryParams, export_mode: bool = False) -> dict:
    rows, scope = await _build_question_rows(current_user=current_user, params=params)
    sorted_rows = _sort_rows(
        rows,
        sort_by=params.sort_by,
        sort_order=params.sort_order,
        allowed=ALLOWED_SORT_FIELDS["question-summary"],
        fallback="created_at",
    )

    by_subject = _group_count(sorted_rows, "subject_name")
    by_topic = _group_count(sorted_rows, "topic_name")
    by_teacher = _group_count(sorted_rows, "teacher_name")
    by_difficulty = _group_count(sorted_rows, "difficulty")
    by_status = _group_count(sorted_rows, "status")
    by_source = _group_count(sorted_rows, "source")

    if export_mode:
        return {
            "summary": {
                "total_questions": len(sorted_rows),
            },
            "table_rows": sorted_rows,
        }

    paged_rows, pagination = _paginate(sorted_rows, page=params.page, limit=params.limit)
    filter_options = await _build_filter_options(scope=scope, selected_subject_id=params.subject_id)

    return {
        "summary": {
            "total_questions": len(sorted_rows),
            "grouped": {
                "by_subject": by_subject,
                "by_topic": by_topic,
                "by_teacher": by_teacher,
                "by_difficulty": by_difficulty,
                "by_status": by_status,
                "by_source": by_source,
            },
        },
        "table": {
            "items": paged_rows,
            "meta": pagination,
        },
        "filter_options": filter_options,
    }


async def _build_ai_rows(current_user: CurrentUser, params: ReportQueryParams) -> tuple[list[dict], dict]:
    scope = await _resolve_scope(
        current_user=current_user,
        teacher_id=params.teacher_id,
        subject_id=params.subject_id,
        topic_id=params.topic_id,
    )

    ai_rows = await list_ai_requests(
        status=params.status,
        date_from=params.date_from,
        date_to=params.date_to,
    )

    document_topic_ids = sorted({_to_int(item.get("document_topic_id")) for item in ai_rows if item.get("document_topic_id") is not None})
    document_topics = await list_document_topics(document_topic_ids=document_topic_ids)
    document_topic_map = {_to_int(item.get("document_topic_id")): item for item in document_topics}

    topic_ids = sorted({_to_int(item.get("topic_id")) for item in document_topics if item.get("topic_id") is not None})
    topics = await list_active_topics(topic_ids=topic_ids)
    topic_map = {_to_int(item.get("topic_id")): item for item in topics}

    subject_ids = sorted({_to_int(item.get("subject_id")) for item in topics if item.get("subject_id") is not None})
    subjects = await list_active_subjects(subject_ids=subject_ids)
    subject_map = {_to_int(item.get("subject_id")): item for item in subjects}

    document_ids = sorted({_to_int(item.get("document_id")) for item in document_topics if item.get("document_id") is not None})
    documents = await list_documents(document_ids=document_ids)
    document_map = {_to_int(item.get("document_id")): item for item in documents}

    teacher_ids = sorted({_to_int(item.get("teacher_id")) for item in documents if item.get("teacher_id") is not None})
    users = await list_users_by_ids(teacher_ids)
    user_map = {_to_int(item.get("user_id")): item for item in users}

    rows = []
    for item in ai_rows:
        document_topic = document_topic_map.get(_to_int(item.get("document_topic_id"))) or {}
        topic = topic_map.get(_to_int(document_topic.get("topic_id"))) or {}
        subject = subject_map.get(_to_int(topic.get("subject_id"))) or {}
        document = document_map.get(_to_int(document_topic.get("document_id"))) or {}
        teacher_id = _to_int(document.get("teacher_id"))
        teacher = user_map.get(teacher_id) or {}

        if scope.get("teacher_id") is not None and teacher_id != scope.get("teacher_id"):
            continue
        if params.teacher_id is not None and teacher_id != params.teacher_id:
            continue
        if params.subject_id is not None and _to_int(subject.get("subject_id")) != params.subject_id:
            continue
        if params.topic_id is not None and _to_int(topic.get("topic_id")) != params.topic_id:
            continue
        if params.difficulty is not None and str(item.get("difficulty")) != params.difficulty:
            continue

        row = {
            "request_id": _to_int(item.get("request_id")),
            "teacher_id": teacher_id,
            "teacher_name": teacher.get("full_name") or teacher.get("username") or "Unknown",
            "subject_id": _to_int(subject.get("subject_id")) or None,
            "subject_name": subject.get("subject_name") or "Unknown",
            "topic_id": _to_int(topic.get("topic_id")) or None,
            "topic_name": topic.get("topic_name") or "Unknown",
            "document_id": _to_int(document.get("document_id")) or None,
            "document_title": document.get("title"),
            "num_questions": _to_int(item.get("num_questions")),
            "generated_question_count": _to_int(item.get("generated_question_count")),
            "difficulty": item.get("difficulty"),
            "status": item.get("status"),
            "is_reviewed": bool(item.get("is_reviewed")),
            "created_at": item.get("created_at"),
            "updated_at": item.get("updated_at"),
        }

        if params.search and not (
            _matches_search(row.get("teacher_name"), params.search)
            or _matches_search(row.get("subject_name"), params.search)
            or _matches_search(row.get("topic_name"), params.search)
            or _matches_search(row.get("document_title"), params.search)
        ):
            continue

        rows.append(row)

    return rows, scope


async def get_ai_summary_report(current_user: CurrentUser, params: ReportQueryParams, export_mode: bool = False) -> dict:
    rows, scope = await _build_ai_rows(current_user=current_user, params=params)
    sorted_rows = _sort_rows(
        rows,
        sort_by=params.sort_by,
        sort_order=params.sort_order,
        allowed=ALLOWED_SORT_FIELDS["ai-summary"],
        fallback="created_at",
    )

    status_counts = _group_count(sorted_rows, "status")
    total_generated_questions = sum(_to_int(item.get("generated_question_count")) for item in sorted_rows)

    request_ids = [_to_int(item.get("request_id")) for item in sorted_rows]
    ai_linked_questions = await list_questions(ai_request_ids=request_ids) if request_ids else []
    approved_count = sum(1 for item in ai_linked_questions if item.get("status") == "approved")
    rejected_count = sum(1 for item in ai_linked_questions if item.get("status") == "rejected")
    reviewed_total = approved_count + rejected_count

    teacher_counter = Counter()
    topic_counter = Counter()
    topic_generated_counter = Counter()
    for item in sorted_rows:
        teacher_counter[str(item.get("teacher_name") or "Unknown")] += 1
        topic_name = str(item.get("topic_name") or "Unknown")
        topic_counter[topic_name] += 1
        topic_generated_counter[topic_name] += _to_int(item.get("generated_question_count"))

    most_active_teachers = [
        {"teacher_name": teacher_name, "request_count": count}
        for teacher_name, count in teacher_counter.most_common(10)
    ]
    most_generated_topics = [
        {
            "topic_name": topic_name,
            "request_count": topic_counter.get(topic_name, 0),
            "generated_question_count": count,
        }
        for topic_name, count in topic_generated_counter.most_common(10)
    ]

    if export_mode:
        return {
            "summary": {
                "total_ai_requests": len(sorted_rows),
            },
            "table_rows": sorted_rows,
        }

    paged_rows, pagination = _paginate(sorted_rows, page=params.page, limit=params.limit)
    filter_options = await _build_filter_options(scope=scope, selected_subject_id=params.subject_id)

    return {
        "summary": {
            "total_ai_requests": len(sorted_rows),
            "status_counts": status_counts,
            "generated_question_count": total_generated_questions,
            "approved_rate_pct": _safe_pct(approved_count, reviewed_total),
            "rejected_rate_pct": _safe_pct(rejected_count, reviewed_total),
            "most_active_teachers": most_active_teachers,
            "most_generated_topics": most_generated_topics,
        },
        "table": {
            "items": paged_rows,
            "meta": pagination,
        },
        "filter_options": filter_options,
    }


async def _build_document_rows(current_user: CurrentUser, params: ReportQueryParams) -> tuple[list[dict], dict, dict, dict, dict]:
    scope = await _resolve_scope(
        current_user=current_user,
        teacher_id=params.teacher_id,
        subject_id=params.subject_id,
        topic_id=params.topic_id,
    )

    topic_map, subject_map = await _load_topic_subject_maps(scope)
    selected_topic_ids = set(topic_map.keys())
    if params.subject_id is not None:
        selected_topic_ids = {
            topic_id
            for topic_id, topic in topic_map.items()
            if _to_int(topic.get("subject_id")) == params.subject_id
        }
    if params.topic_id is not None:
        selected_topic_ids = {params.topic_id}

    documents = await list_documents(
        teacher_id=scope.get("teacher_id"),
        date_from=params.date_from,
        date_to=params.date_to,
    )
    document_ids = [_to_int(item.get("document_id")) for item in documents]

    document_topics = await list_document_topics(document_ids=document_ids)
    if selected_topic_ids:
        document_topics = [
            item for item in document_topics if _to_int(item.get("topic_id")) in selected_topic_ids
        ]

    doc_topic_ids_by_document: dict[int, list[int]] = defaultdict(list)
    for item in document_topics:
        doc_topic_ids_by_document[_to_int(item.get("document_id"))].append(_to_int(item.get("topic_id")))

    users = await list_users_by_ids(sorted({_to_int(item.get("teacher_id")) for item in documents if item.get("teacher_id") is not None}))
    user_map = {_to_int(item.get("user_id")): item for item in users}

    rows = []
    for item in documents:
        document_id = _to_int(item.get("document_id"))
        topic_ids = doc_topic_ids_by_document.get(document_id, [])

        if selected_topic_ids and not topic_ids:
            continue

        topic_names = []
        subject_names = []
        subject_ids = set()
        for topic_id in topic_ids:
            topic = topic_map.get(topic_id) or {}
            topic_names.append(str(topic.get("topic_name") or "Unknown"))
            subject_id = _to_int(topic.get("subject_id"))
            if subject_id > 0:
                subject_ids.add(subject_id)
                subject = subject_map.get(subject_id) or {}
                subject_names.append(str(subject.get("subject_name") or "Unknown"))

        teacher = user_map.get(_to_int(item.get("teacher_id"))) or {}
        row = {
            "document_id": document_id,
            "teacher_id": _to_int(item.get("teacher_id")) or None,
            "teacher_name": teacher.get("full_name") or teacher.get("username") or "Unknown",
            "title": item.get("title"),
            "status": item.get("status"),
            "subject_ids": sorted(subject_ids),
            "subject_names": sorted({name for name in subject_names if name}),
            "topic_ids": sorted(set(topic_ids)),
            "topic_names": sorted({name for name in topic_names if name}),
            "topic_count": len(set(topic_ids)),
            "created_at": item.get("created_at"),
            "updated_at": item.get("updated_at"),
        }

        if params.search and not (
            _matches_search(row.get("title"), params.search)
            or _matches_search(row.get("teacher_name"), params.search)
            or any(_matches_search(name, params.search) for name in row.get("subject_names", []))
            or any(_matches_search(name, params.search) for name in row.get("topic_names", []))
        ):
            continue

        rows.append(row)

    return rows, scope, topic_map, subject_map, doc_topic_ids_by_document


async def get_document_summary_report(current_user: CurrentUser, params: ReportQueryParams, export_mode: bool = False) -> dict:
    rows, scope, topic_map, subject_map, doc_topic_ids_by_document = await _build_document_rows(
        current_user=current_user,
        params=params,
    )

    sorted_rows = _sort_rows(
        rows,
        sort_by=params.sort_by,
        sort_order=params.sort_order,
        allowed=ALLOWED_SORT_FIELDS["document-summary"],
        fallback="created_at",
    )

    by_teacher_counter = Counter()
    by_subject_counter = Counter()
    by_topic_counter = Counter()

    missing_topic_mapping = []
    for item in sorted_rows:
        by_teacher_counter[item.get("teacher_name") or "Unknown"] += 1
        for subject_name in item.get("subject_names", []):
            by_subject_counter[subject_name] += 1
        for topic_name in item.get("topic_names", []):
            by_topic_counter[topic_name] += 1

        if not item.get("topic_ids"):
            missing_topic_mapping.append(item)

    topics_without_documents = []
    topic_document_count = Counter()
    for topic_ids in doc_topic_ids_by_document.values():
        for topic_id in set(topic_ids):
            topic_document_count[topic_id] += 1

    for topic_id, topic in topic_map.items():
        if topic_document_count.get(topic_id, 0) == 0:
            subject = subject_map.get(_to_int(topic.get("subject_id"))) or {}
            topics_without_documents.append(
                {
                    "topic_id": topic_id,
                    "topic_name": topic.get("topic_name") or "Unknown",
                    "subject_id": _to_int(topic.get("subject_id")) or None,
                    "subject_name": subject.get("subject_name") or "Unknown",
                }
            )

    if export_mode:
        export_rows = []
        for item in sorted_rows:
            export_rows.append(
                {
                    "document_id": item.get("document_id"),
                    "teacher_name": item.get("teacher_name"),
                    "title": item.get("title"),
                    "status": item.get("status"),
                    "subjects": ", ".join(item.get("subject_names", [])),
                    "topics": ", ".join(item.get("topic_names", [])),
                    "created_at": item.get("created_at"),
                }
            )
        return {
            "summary": {
                "total_documents": len(sorted_rows),
            },
            "table_rows": export_rows,
        }

    paged_rows, pagination = _paginate(sorted_rows, page=params.page, limit=params.limit)
    filter_options = await _build_filter_options(scope=scope, selected_subject_id=params.subject_id)

    return {
        "summary": {
            "total_documents": len(sorted_rows),
            "by_teacher": [{"teacher_name": key, "count": count} for key, count in by_teacher_counter.most_common()],
            "by_subject": [{"subject_name": key, "count": count} for key, count in by_subject_counter.most_common()],
            "by_topic": [{"topic_name": key, "count": count} for key, count in by_topic_counter.most_common()],
            "missing_topic_mapping_count": len(missing_topic_mapping),
            "topics_without_documents_count": len(topics_without_documents),
        },
        "table": {
            "items": paged_rows,
            "meta": pagination,
        },
        "missing_topic_mapping": missing_topic_mapping,
        "topics_without_documents": topics_without_documents,
        "filter_options": filter_options,
    }


async def get_teacher_activity_report(current_user: CurrentUser, params: ReportQueryParams, export_mode: bool = False) -> dict:
    scope = await _resolve_scope(
        current_user=current_user,
        teacher_id=params.teacher_id,
        subject_id=params.subject_id,
        topic_id=params.topic_id,
    )

    users = await list_active_users()
    user_ids = [_to_int(item.get("user_id")) for item in users if item.get("user_id") is not None]
    roles_by_user_id = await list_user_roles(user_ids)

    teacher_rows = [item for item in users if "teacher" in roles_by_user_id.get(_to_int(item.get("user_id")), [])]
    if scope.get("teacher_id") is not None:
        teacher_rows = [item for item in teacher_rows if _to_int(item.get("user_id")) == scope.get("teacher_id")]

    teacher_map = {_to_int(item.get("user_id")): item for item in teacher_rows}
    teacher_ids = sorted(teacher_map.keys())

    documents = await list_documents(
        date_from=params.date_from,
        date_to=params.date_to,
    )
    documents = [item for item in documents if _to_int(item.get("teacher_id")) in set(teacher_ids)]

    questions = await list_questions(
        date_from=params.date_from,
        date_to=params.date_to,
    )
    questions = [item for item in questions if _to_int(item.get("teacher_id")) in set(teacher_ids)]

    document_ids = [_to_int(item.get("document_id")) for item in documents]
    document_topics = await list_document_topics(document_ids=document_ids)
    topic_ids = sorted({_to_int(item.get("topic_id")) for item in document_topics if item.get("topic_id") is not None})
    topics = await list_active_topics(topic_ids=topic_ids)
    topic_map = {_to_int(item.get("topic_id")): item for item in topics}

    if params.subject_id is not None or params.topic_id is not None:
        allowed_document_ids = set()
        for item in document_topics:
            topic = topic_map.get(_to_int(item.get("topic_id"))) or {}
            if params.topic_id is not None and _to_int(topic.get("topic_id")) != params.topic_id:
                continue
            if params.subject_id is not None and _to_int(topic.get("subject_id")) != params.subject_id:
                continue
            allowed_document_ids.add(_to_int(item.get("document_id")))

        documents = [item for item in documents if _to_int(item.get("document_id")) in allowed_document_ids]
        allowed_document_topic_ids = {
            _to_int(item.get("document_topic_id"))
            for item in document_topics
            if _to_int(item.get("document_id")) in allowed_document_ids
        }
        questions = [item for item in questions if _to_int(item.get("document_topic_id")) in allowed_document_topic_ids]
        ai_requests = await list_ai_requests(
            document_topic_ids=sorted(allowed_document_topic_ids),
            status=params.status,
            date_from=params.date_from,
            date_to=params.date_to,
        )
    else:
        ai_requests = await list_ai_requests(
            status=params.status,
            date_from=params.date_from,
            date_to=params.date_to,
        )

    if params.difficulty is not None:
        questions = [item for item in questions if str(item.get("difficulty")) == params.difficulty]
    if params.source is not None:
        questions = [item for item in questions if str(item.get("source")) == params.source]
    if params.status is not None:
        questions = [item for item in questions if str(item.get("status")) == params.status]

    document_ids_by_teacher: dict[int, int] = defaultdict(int)
    question_count_by_teacher: dict[int, int] = defaultdict(int)
    approved_count_by_teacher: dict[int, int] = defaultdict(int)

    for item in documents:
        document_ids_by_teacher[_to_int(item.get("teacher_id"))] += 1

    for item in questions:
        teacher_id = _to_int(item.get("teacher_id"))
        question_count_by_teacher[teacher_id] += 1
        if item.get("status") == "approved":
            approved_count_by_teacher[teacher_id] += 1

    ai_requests_by_teacher: dict[int, int] = defaultdict(int)
    ai_document_topic_ids = sorted({_to_int(item.get("document_topic_id")) for item in ai_requests if item.get("document_topic_id") is not None})
    ai_doc_topics = await list_document_topics(document_topic_ids=ai_document_topic_ids)
    ai_doc_topic_map = {_to_int(item.get("document_topic_id")): item for item in ai_doc_topics}

    document_map = {_to_int(item.get("document_id")): item for item in documents}
    for item in ai_requests:
        document_topic = ai_doc_topic_map.get(_to_int(item.get("document_topic_id"))) or {}
        document = document_map.get(_to_int(document_topic.get("document_id")))
        if not document:
            continue
        teacher_id = _to_int(document.get("teacher_id"))
        ai_requests_by_teacher[teacher_id] += 1

    table_rows = []
    for teacher_id in teacher_ids:
        teacher = teacher_map.get(teacher_id) or {}
        question_total = question_count_by_teacher.get(teacher_id, 0)
        approved_total = approved_count_by_teacher.get(teacher_id, 0)
        row = {
            "teacher_id": teacher_id,
            "teacher_name": teacher.get("full_name") or teacher.get("username") or "Unknown",
            "question_count": question_total,
            "document_count": document_ids_by_teacher.get(teacher_id, 0),
            "ai_request_count": ai_requests_by_teacher.get(teacher_id, 0),
            "approval_rate_pct": _safe_pct(approved_total, question_total),
        }

        if params.search and not _matches_search(row.get("teacher_name"), params.search):
            continue

        table_rows.append(row)

    sorted_rows = _sort_rows(
        table_rows,
        sort_by=params.sort_by,
        sort_order=params.sort_order,
        allowed=ALLOWED_SORT_FIELDS["teacher-activity"],
        fallback="teacher_name",
    )

    recent_activity = []
    for item in sorted(questions, key=lambda x: str(x.get("created_at") or ""), reverse=True)[:20]:
        recent_activity.append(
            {
                "activity_type": "question",
                "teacher_id": _to_int(item.get("teacher_id")) or None,
                "teacher_name": (teacher_map.get(_to_int(item.get("teacher_id"))) or {}).get("full_name"),
                "entity_id": _to_int(item.get("question_id")),
                "status": item.get("status"),
                "created_at": item.get("created_at"),
            }
        )
    for item in sorted(documents, key=lambda x: str(x.get("created_at") or ""), reverse=True)[:20]:
        recent_activity.append(
            {
                "activity_type": "document",
                "teacher_id": _to_int(item.get("teacher_id")) or None,
                "teacher_name": (teacher_map.get(_to_int(item.get("teacher_id"))) or {}).get("full_name"),
                "entity_id": _to_int(item.get("document_id")),
                "title": item.get("title"),
                "created_at": item.get("created_at"),
            }
        )

    recent_activity = sorted(recent_activity, key=lambda x: str(x.get("created_at") or ""), reverse=True)[:30]

    if export_mode:
        return {
            "summary": {
                "total_teachers": len(sorted_rows),
            },
            "table_rows": sorted_rows,
        }

    paged_rows, pagination = _paginate(sorted_rows, page=params.page, limit=params.limit)
    filter_options = await _build_filter_options(scope=scope, selected_subject_id=params.subject_id)

    return {
        "summary": {
            "total_teachers": len(sorted_rows),
            "total_questions": sum(item.get("question_count", 0) for item in sorted_rows),
            "total_documents": sum(item.get("document_count", 0) for item in sorted_rows),
            "total_ai_requests": sum(item.get("ai_request_count", 0) for item in sorted_rows),
        },
        "table": {
            "items": paged_rows,
            "meta": pagination,
        },
        "recent_activity": recent_activity,
        "filter_options": filter_options,
    }


async def get_topic_coverage_report(
    current_user: CurrentUser,
    params: TopicCoverageQueryParams,
    export_mode: bool = False,
) -> dict:
    scope = await _resolve_scope(
        current_user=current_user,
        teacher_id=params.teacher_id,
        subject_id=params.subject_id,
        topic_id=params.topic_id,
    )

    topic_map, subject_map = await _load_topic_subject_maps(scope)

    if params.subject_id is not None:
        topic_map = {
            topic_id: topic
            for topic_id, topic in topic_map.items()
            if _to_int(topic.get("subject_id")) == params.subject_id
        }
    if params.topic_id is not None:
        topic_map = {
            topic_id: topic
            for topic_id, topic in topic_map.items()
            if topic_id == params.topic_id
        }

    documents = await list_documents(teacher_id=scope.get("teacher_id"), date_from=params.date_from, date_to=params.date_to)
    document_ids = [_to_int(item.get("document_id")) for item in documents]
    document_topics = await list_document_topics(document_ids=document_ids)

    valid_topic_ids = set(topic_map.keys())
    document_topics = [item for item in document_topics if _to_int(item.get("topic_id")) in valid_topic_ids]

    document_topic_ids = sorted({_to_int(item.get("document_topic_id")) for item in document_topics})
    questions = await list_questions(
        teacher_id=scope.get("teacher_id"),
        date_from=params.date_from,
        date_to=params.date_to,
    )
    questions = [item for item in questions if _to_int(item.get("document_topic_id")) in set(document_topic_ids)]

    questions_by_doc_topic: dict[int, list[dict]] = defaultdict(list)
    for item in questions:
        questions_by_doc_topic[_to_int(item.get("document_topic_id"))].append(item)

    document_count_by_topic: dict[int, int] = defaultdict(int)
    for item in document_topics:
        document_count_by_topic[_to_int(item.get("topic_id"))] += 1

    question_count_by_topic: dict[int, int] = defaultdict(int)
    hard_question_count_by_topic: dict[int, int] = defaultdict(int)
    ai_question_count_by_topic: dict[int, int] = defaultdict(int)

    for item in document_topics:
        topic_id = _to_int(item.get("topic_id"))
        for question in questions_by_doc_topic.get(_to_int(item.get("document_topic_id")), []):
            question_count_by_topic[topic_id] += 1
            if question.get("difficulty") == "hard":
                hard_question_count_by_topic[topic_id] += 1
            if question.get("source") == "ai":
                ai_question_count_by_topic[topic_id] += 1

    table_rows = []
    for topic_id, topic in topic_map.items():
        subject = subject_map.get(_to_int(topic.get("subject_id"))) or {}
        row = {
            "topic_id": topic_id,
            "topic_name": topic.get("topic_name") or "Unknown",
            "subject_id": _to_int(topic.get("subject_id")) or None,
            "subject_name": subject.get("subject_name") or "Unknown",
            "question_count": question_count_by_topic.get(topic_id, 0),
            "hard_question_count": hard_question_count_by_topic.get(topic_id, 0),
            "document_count": document_count_by_topic.get(topic_id, 0),
            "ai_generated_question_count": ai_question_count_by_topic.get(topic_id, 0),
            "without_enough_questions": question_count_by_topic.get(topic_id, 0) < params.min_questions,
            "without_hard_questions": hard_question_count_by_topic.get(topic_id, 0) == 0,
            "without_documents": document_count_by_topic.get(topic_id, 0) == 0,
            "without_ai_generated_questions": ai_question_count_by_topic.get(topic_id, 0) == 0,
        }

        if params.search and not (
            _matches_search(row.get("topic_name"), params.search)
            or _matches_search(row.get("subject_name"), params.search)
        ):
            continue

        table_rows.append(row)

    sorted_rows = _sort_rows(
        table_rows,
        sort_by=params.sort_by,
        sort_order=params.sort_order,
        allowed=ALLOWED_SORT_FIELDS["topic-coverage"],
        fallback="topic_name",
    )

    without_enough_questions = [item for item in sorted_rows if item.get("without_enough_questions")]
    without_hard_questions = [item for item in sorted_rows if item.get("without_hard_questions")]
    without_documents = [item for item in sorted_rows if item.get("without_documents")]
    without_ai_questions = [item for item in sorted_rows if item.get("without_ai_generated_questions")]

    if export_mode:
        return {
            "summary": {
                "total_topics": len(sorted_rows),
            },
            "table_rows": sorted_rows,
        }

    paged_rows, pagination = _paginate(sorted_rows, page=params.page, limit=params.limit)
    filter_options = await _build_filter_options(scope=scope, selected_subject_id=params.subject_id)

    return {
        "summary": {
            "total_topics": len(sorted_rows),
            "topics_without_enough_questions": len(without_enough_questions),
            "topics_without_hard_questions": len(without_hard_questions),
            "topics_without_documents": len(without_documents),
            "topics_without_ai_generated_questions": len(without_ai_questions),
            "min_questions_threshold": params.min_questions,
        },
        "table": {
            "items": paged_rows,
            "meta": pagination,
        },
        "details": {
            "without_enough_questions": without_enough_questions,
            "without_hard_questions": without_hard_questions,
            "without_documents": without_documents,
            "without_ai_generated_questions": without_ai_questions,
        },
        "filter_options": filter_options,
    }


async def get_data_quality_report(current_user: CurrentUser, params: ReportQueryParams, export_mode: bool = False) -> dict:
    scope = await _resolve_scope(
        current_user=current_user,
        teacher_id=params.teacher_id,
        subject_id=params.subject_id,
        topic_id=params.topic_id,
    )

    issue_rows = []
    question_rows: list[dict] = []
    try:
        question_rows, _ = await _build_question_rows(current_user=current_user, params=params)
        question_ids = [_to_int(item.get("question_id")) for item in question_rows]
        options = await list_question_options(question_ids)

        option_map: dict[int, list[dict]] = defaultdict(list)
        for item in options:
            option_map[_to_int(item.get("question_id"))].append(item)

        for question in question_rows:
            question_id = _to_int(question.get("question_id"))
            question_options = option_map.get(question_id, [])

            if not question_options:
                issue_rows.append(
                    {
                        "issue_type": "question_without_options",
                        "entity_type": "question",
                        "entity_id": question_id,
                        "teacher_name": question.get("teacher_name"),
                        "subject_name": question.get("subject_name"),
                        "topic_name": question.get("topic_name"),
                        "details": "Question has no options",
                        "created_at": question.get("created_at"),
                    }
                )

            if question_options and not any(bool(item.get("is_correct")) for item in question_options):
                issue_rows.append(
                    {
                        "issue_type": "question_without_correct_answer",
                        "entity_type": "question",
                        "entity_id": question_id,
                        "teacher_name": question.get("teacher_name"),
                        "subject_name": question.get("subject_name"),
                        "topic_name": question.get("topic_name"),
                        "details": "Question has options but no correct answer",
                        "created_at": question.get("created_at"),
                    }
                )

            explanation = str(question.get("explanation") or "").strip()
            if not explanation:
                issue_rows.append(
                    {
                        "issue_type": "question_missing_explanation",
                        "entity_type": "question",
                        "entity_id": question_id,
                        "teacher_name": question.get("teacher_name"),
                        "subject_name": question.get("subject_name"),
                        "topic_name": question.get("topic_name"),
                        "details": "Question explanation is missing",
                        "created_at": question.get("created_at"),
                    }
                )

        duplicate_map: dict[str, list[dict]] = defaultdict(list)
        for question in question_rows:
            key = _normalize_text(str(question.get("content") or ""))
            if key:
                duplicate_map[key].append(question)

        for duplicated_rows in duplicate_map.values():
            if len(duplicated_rows) < 2:
                continue
            duplicate_ids = sorted({_to_int(item.get("question_id")) for item in duplicated_rows})
            for question in duplicated_rows:
                issue_rows.append(
                    {
                        "issue_type": "duplicate_question",
                        "entity_type": "question",
                        "entity_id": _to_int(question.get("question_id")),
                        "teacher_name": question.get("teacher_name"),
                        "subject_name": question.get("subject_name"),
                        "topic_name": question.get("topic_name"),
                        "details": f"Duplicate question IDs: {duplicate_ids}",
                        "created_at": question.get("created_at"),
                    }
                )
    except Exception as exc:
        issue_rows.append(
            {
                "issue_type": "data_quality_runtime_warning",
                "entity_type": "system",
                "entity_id": 0,
                "teacher_name": None,
                "subject_name": None,
                "topic_name": None,
                "details": f"Question checks partially failed: {str(exc)}",
                "created_at": datetime.utcnow().isoformat(),
            }
        )

    try:
        ai_rows, _ = await _build_ai_rows(current_user=current_user, params=params)
        ai_rows_by_request_id = {_to_int(item.get("request_id")): item for item in ai_rows}
        ai_request_ids = list(ai_rows_by_request_id.keys())

        ai_questions = await list_questions(ai_request_ids=ai_request_ids) if ai_request_ids else []
        ai_question_count_by_request: dict[int, int] = defaultdict(int)
        for item in ai_questions:
            request_id = item.get("ai_request_id")
            if request_id is None:
                continue
            ai_question_count_by_request[_to_int(request_id)] += 1

        for request_id, row in ai_rows_by_request_id.items():
            generated_question_count = _to_int(row.get("generated_question_count"))
            actual_question_count = ai_question_count_by_request.get(request_id, 0)
            if generated_question_count <= 0 or actual_question_count <= 0:
                issue_rows.append(
                    {
                        "issue_type": "ai_request_without_generated_questions",
                        "entity_type": "ai_request",
                        "entity_id": request_id,
                        "teacher_name": row.get("teacher_name"),
                        "subject_name": row.get("subject_name"),
                        "topic_name": row.get("topic_name"),
                        "details": (
                            "AI request has no generated questions"
                            f" (generated_count={generated_question_count}, actual_questions={actual_question_count})"
                        ),
                        "created_at": row.get("created_at"),
                    }
                )
    except Exception as exc:
        issue_rows.append(
            {
                "issue_type": "data_quality_runtime_warning",
                "entity_type": "system",
                "entity_id": 0,
                "teacher_name": None,
                "subject_name": None,
                "topic_name": None,
                "details": f"AI checks partially failed: {str(exc)}",
                "created_at": datetime.utcnow().isoformat(),
            }
        )

    try:
        sorted_rows = _sort_rows(
            issue_rows,
            sort_by=params.sort_by,
            sort_order=params.sort_order,
            allowed=ALLOWED_SORT_FIELDS["data-quality"],
            fallback="created_at",
        )

        issue_summary = Counter(item.get("issue_type") or "unknown" for item in sorted_rows)

        if export_mode:
            return {
                "summary": {
                    "total_issues": len(sorted_rows),
                },
                "table_rows": sorted_rows,
            }

        paged_rows, pagination = _paginate(sorted_rows, page=params.page, limit=params.limit)
        filter_options = await _build_filter_options(scope=scope, selected_subject_id=params.subject_id)

        return {
            "summary": {
                "total_issues": len(sorted_rows),
                "by_issue_type": [
                    {
                        "issue_type": issue_type,
                        "count": count,
                    }
                    for issue_type, count in issue_summary.items()
                ],
            },
            "table": {
                "items": paged_rows,
                "meta": pagination,
            },
            "filter_options": filter_options,
        }
    except Exception as exc:
        fallback_warning = {
            "issue_type": "data_quality_runtime_warning",
            "entity_type": "system",
            "entity_id": 0,
            "teacher_name": None,
            "subject_name": None,
            "topic_name": None,
            "details": f"Data quality report failed to finalize: {str(exc)}",
            "created_at": datetime.utcnow().isoformat(),
        }
        if export_mode:
            return {
                "summary": {
                    "total_issues": 1,
                },
                "table_rows": [fallback_warning],
            }

        fallback_rows, pagination = _paginate([fallback_warning], page=params.page, limit=params.limit)
        return {
            "summary": {
                "total_issues": 1,
                "by_issue_type": [
                    {
                        "issue_type": "data_quality_runtime_warning",
                        "count": 1,
                    }
                ],
            },
            "table": {
                "items": fallback_rows,
                "meta": pagination,
            },
            "filter_options": {
                "teachers": [],
                "subjects": [],
                "topics": [],
            },
        }


def _rows_to_csv_bytes(rows: list[dict]) -> bytes:
    if not rows:
        return b""

    output = io.StringIO()
    fieldnames = list(rows[0].keys())
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    for row in rows:
        serialized = {
            key: json.dumps(value, ensure_ascii=False) if isinstance(value, (list, dict)) else value
            for key, value in row.items()
        }
        writer.writerow(serialized)
    return output.getvalue().encode("utf-8")


def _rows_to_xlsx_bytes(rows: list[dict]) -> bytes:
    if Workbook is None:
        raise RuntimeError("openpyxl is required for xlsx export")

    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Report"

    if rows:
        headers = list(rows[0].keys())
        sheet.append(headers)
        for row in rows:
            sheet.append(
                [json.dumps(row.get(header), ensure_ascii=False) if isinstance(row.get(header), (list, dict)) else row.get(header) for header in headers]
            )

    buffer = io.BytesIO()
    workbook.save(buffer)
    return buffer.getvalue()


def _rows_to_pdf_bytes(title: str, rows: list[dict]) -> bytes:
    if SimpleDocTemplate is None:
        raise RuntimeError("reportlab is required for pdf export")

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4))
    styles = getSampleStyleSheet()

    story = [Paragraph(title, styles["Title"]), Spacer(1, 12)]

    if not rows:
        story.append(Paragraph("No data", styles["Normal"]))
    else:
        headers = list(rows[0].keys())
        table_data = [headers]
        for row in rows:
            table_data.append(
                [
                    str(json.dumps(row.get(header), ensure_ascii=False) if isinstance(row.get(header), (list, dict)) else row.get(header) or "")
                    for header in headers
                ]
            )

        table = Table(table_data, repeatRows=1)
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#9B0F06")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                    ("FONTSIZE", (0, 0), (-1, -1), 8),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ]
            )
        )
        story.append(table)

    doc.build(story)
    return buffer.getvalue()


async def export_report_data(
    report_key: str,
    export_format: str,
    current_user: CurrentUser,
    params: ReportQueryParams,
) -> tuple[bytes, str, str]:
    if report_key == "question-summary":
        payload = await get_question_summary_report(current_user=current_user, params=params, export_mode=True)
        title = "Question Summary Report"
    elif report_key == "ai-summary":
        payload = await get_ai_summary_report(current_user=current_user, params=params, export_mode=True)
        title = "AI Summary Report"
    elif report_key == "document-summary":
        payload = await get_document_summary_report(current_user=current_user, params=params, export_mode=True)
        title = "Document Summary Report"
    elif report_key == "teacher-activity":
        payload = await get_teacher_activity_report(current_user=current_user, params=params, export_mode=True)
        title = "Teacher Activity Report"
    elif report_key == "topic-coverage":
        topic_params = TopicCoverageQueryParams(**params.model_dump(), min_questions=5)
        payload = await get_topic_coverage_report(current_user=current_user, params=topic_params, export_mode=True)
        title = "Topic Coverage Report"
    elif report_key == "data-quality":
        payload = await get_data_quality_report(current_user=current_user, params=params, export_mode=True)
        title = "Data Quality Report"
    else:
        raise ReportValidationError("Unsupported report key")

    rows = payload.get("table_rows") or []

    if export_format == "csv":
        file_bytes = _rows_to_csv_bytes(rows)
        media_type = "text/csv"
        extension = "csv"
    elif export_format == "xlsx":
        file_bytes = _rows_to_xlsx_bytes(rows)
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        extension = "xlsx"
    elif export_format == "pdf":
        file_bytes = _rows_to_pdf_bytes(title=title, rows=rows)
        media_type = "application/pdf"
        extension = "pdf"
    else:
        raise ReportValidationError("Unsupported export format")

    filename = f"{report_key}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.{extension}"
    return file_bytes, media_type, filename
