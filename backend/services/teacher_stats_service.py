from datetime import datetime
from math import ceil

from middlewares.auth_middleware import CurrentUser
from repositories.teacher_stats_repository import (
    list_teacher_assigned_class_subjects,
    list_practice_attempts_by_practice_set_ids,
    list_question_topic_rows,
    list_scoped_practice_sets,
    list_student_answers_by_attempt_ids,
    list_teacher_assigned_topics_scope,
)
from schemas.teacher_stats_schema import TeacherStatsResponse


class TeacherStatsAuthorizationError(ValueError):
    pass


def _safe_int(value: object, default: int = 0) -> int:
    try:
        if value is None:
            return default
        return int(value)
    except (TypeError, ValueError):
        return default


def _safe_float(value: object, default: float = 0.0) -> float:
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _safe_pct(numerator: int, denominator: int) -> float:
    if denominator <= 0:
        return 0.0
    return round((numerator / denominator) * 100, 2)


def _parse_iso_datetime(value: object) -> datetime | None:
    if not isinstance(value, str) or not value:
        return None
    normalized = value.replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(normalized)
    except ValueError:
        return None


def _build_assigned_topic_context(rows: list[dict]) -> dict[int, dict]:
    context: dict[int, dict] = {}
    for row in rows:
        class_subject = row.get("class_subjects") or {}
        topic_id = _safe_int(row.get("topic_id"))
        if topic_id <= 0:
            continue
        context[topic_id] = {
            "topic_id": topic_id,
            "topic_name": row.get("topic_name") or "Unknown topic",
            "class_subject_id": _safe_int(row.get("class_subject_id")),
            "subject_id": _safe_int(class_subject.get("subject_id")),
        }
    return context


def _empty_stats_response() -> dict:
    return TeacherStatsResponse(
        summary={
            "average_score": 0.0,
            "completion_rate_pct": 0.0,
            "total_study_hours": 0,
            "total_answered_questions": 0,
        },
        weak_topics=[],
        student_distribution={
            "active_rate_pct": 0.0,
            "top_student_count": 0,
            "needs_attention_count": 0,
            "total_students": 0,
        },
    ).model_dump()


async def get_teacher_stats(
    current_user: CurrentUser,
    class_subject_id: int | None = None,
    subject_id: int | None = None,
    topic_id: int | None = None,
    debug: bool = False,
) -> dict:
    debug_info: dict[str, object] = {"teacher_id": current_user.user_id}

    assigned_class_subject_rows = await list_teacher_assigned_class_subjects(current_user.user_id)
    assigned_topic_rows = await list_teacher_assigned_topics_scope(current_user.user_id)
    assigned_topic_context = _build_assigned_topic_context(assigned_topic_rows)
    teacher_subject_ids = sorted(
        {
            _safe_int(item.get("subject_id"))
            for item in assigned_class_subject_rows
            if _safe_int(item.get("subject_id")) > 0
        }
    )
    teacher_class_subject_ids = sorted(
        {
            _safe_int(item.get("class_subject_id"))
            for item in assigned_class_subject_rows
            if _safe_int(item.get("class_subject_id")) > 0
        }
    )
    teacher_topic_ids = sorted(assigned_topic_context.keys())
    teacher_class_subject_id_set = set(teacher_class_subject_ids)
    teacher_subject_id_set = set(teacher_subject_ids)
    teacher_topic_id_set = set(teacher_topic_ids)

    debug_info["assigned_class_subject_ids"] = teacher_class_subject_ids
    debug_info["assigned_subject_ids"] = teacher_subject_ids
    debug_info["assigned_topic_ids"] = teacher_topic_ids

    if not teacher_subject_ids:
        response = _empty_stats_response()
        if debug:
            debug_info["filtered_topic_ids"] = []
            debug_info["scoped_practice_sets_count"] = 0
            debug_info["practice_sets_with_null_topic_count"] = 0
            debug_info["attempts_count"] = 0
            debug_info["submitted_attempts_count"] = 0
            debug_info["answers_raw_count"] = 0
            debug_info["answers_selected_count"] = 0
            debug_info["mapped_questions_count"] = 0
            debug_info["weak_topics_count"] = 0
            debug_info["students_with_scores_count"] = 0
            response["debug"] = debug_info
        return response

    if class_subject_id is not None and class_subject_id not in teacher_class_subject_id_set:
        raise TeacherStatsAuthorizationError("You can only view stats for your assigned class subjects")
    if subject_id is not None and subject_id not in teacher_subject_id_set:
        raise TeacherStatsAuthorizationError("You can only view stats for your assigned subjects")
    if topic_id is not None and topic_id not in teacher_topic_id_set:
        raise TeacherStatsAuthorizationError("You can only view stats for your assigned topics")
    if class_subject_id is not None and subject_id is not None:
        subject_ids_of_class_subject = {
            _safe_int(item.get("subject_id"))
            for item in assigned_class_subject_rows
            if _safe_int(item.get("class_subject_id")) == class_subject_id
        }
        if subject_id not in subject_ids_of_class_subject:
            raise ValueError("class_subject_id does not belong to subject_id")
    if class_subject_id is not None and topic_id is not None:
        class_subject_ids_of_topic = {
            item["class_subject_id"]
            for item in assigned_topic_context.values()
            if item["topic_id"] == topic_id
        }
        if class_subject_id not in class_subject_ids_of_topic:
            raise ValueError("topic_id does not belong to class_subject_id")
    if subject_id is not None and topic_id is not None:
        subject_ids_of_topic = {
            item["subject_id"]
            for item in assigned_topic_context.values()
            if item["topic_id"] == topic_id
        }
        if subject_id not in subject_ids_of_topic:
            raise ValueError("topic_id does not belong to subject_id")

    filtered_class_subject_ids = sorted(
        {
            _safe_int(item.get("class_subject_id"))
            for item in assigned_class_subject_rows
            if _safe_int(item.get("class_subject_id")) > 0
            and (class_subject_id is None or _safe_int(item.get("class_subject_id")) == class_subject_id)
            and (subject_id is None or _safe_int(item.get("subject_id")) == subject_id)
        }
    )
    filtered_topic_ids = sorted(
        topic_key
        for topic_key, item in assigned_topic_context.items()
        if (class_subject_id is None or item["class_subject_id"] == class_subject_id)
        and (subject_id is None or item["subject_id"] == subject_id)
        and (topic_id is None or item["topic_id"] == topic_id)
    )

    if topic_id is not None and not filtered_topic_ids:
        response = _empty_stats_response()
        if debug:
            debug_info["filtered_topic_ids"] = []
            debug_info["filtered_class_subject_ids"] = []
            debug_info["scoped_practice_sets_count"] = 0
            debug_info["practice_sets_with_null_topic_count"] = 0
            debug_info["attempts_count"] = 0
            debug_info["submitted_attempts_count"] = 0
            debug_info["answers_raw_count"] = 0
            debug_info["answers_selected_count"] = 0
            debug_info["mapped_questions_count"] = 0
            debug_info["weak_topics_count"] = 0
            debug_info["students_with_scores_count"] = 0
            response["debug"] = debug_info
        return response

    debug_info["filtered_class_subject_ids"] = filtered_class_subject_ids
    debug_info["filtered_topic_ids"] = filtered_topic_ids

    if not filtered_class_subject_ids:
        response = _empty_stats_response()
        if debug:
            debug_info["scoped_practice_sets_count"] = 0
            debug_info["practice_sets_with_null_topic_count"] = 0
            debug_info["attempts_count"] = 0
            debug_info["submitted_attempts_count"] = 0
            debug_info["answers_raw_count"] = 0
            debug_info["answers_selected_count"] = 0
            debug_info["mapped_questions_count"] = 0
            debug_info["weak_topics_count"] = 0
            debug_info["students_with_scores_count"] = 0
            response["debug"] = debug_info
        return response

    practice_sets = await list_scoped_practice_sets(
        teacher_id=current_user.user_id,
        scoped_class_subject_ids=filtered_class_subject_ids,
        scoped_topic_ids=filtered_topic_ids if topic_id is not None else [],
    )
    debug_info["scoped_practice_sets_count"] = len(practice_sets)
    debug_info["practice_sets_with_null_topic_count"] = sum(
        1 for item in practice_sets if item.get("topic_id") is None
    )
    if not practice_sets:
        response = _empty_stats_response()
        if debug:
            debug_info["attempts_count"] = 0
            debug_info["submitted_attempts_count"] = 0
            debug_info["answers_raw_count"] = 0
            debug_info["answers_selected_count"] = 0
            debug_info["mapped_questions_count"] = 0
            debug_info["weak_topics_count"] = 0
            debug_info["students_with_scores_count"] = 0
            response["debug"] = debug_info
        return response

    practice_set_ids = []
    student_id_by_practice_set_id: dict[int, int] = {}
    for item in practice_sets:
        practice_set_id = _safe_int(item.get("practice_set_id"))
        student_id = _safe_int(item.get("student_id"))
        if practice_set_id <= 0:
            continue
        practice_set_ids.append(practice_set_id)
        if student_id > 0:
            student_id_by_practice_set_id[practice_set_id] = student_id

    attempts = await list_practice_attempts_by_practice_set_ids(practice_set_ids)
    total_attempts = len(attempts)
    debug_info["attempts_count"] = total_attempts
    submitted_attempts = [item for item in attempts if item.get("status") == "submitted"]

    submitted_attempt_ids = [
        _safe_int(item.get("attempt_id"))
        for item in submitted_attempts
        if _safe_int(item.get("attempt_id")) > 0
    ]
    submitted_attempt_id_set = set(submitted_attempt_ids)
    debug_info["submitted_attempts_count"] = len(submitted_attempts)

    total_score = 0.0
    scored_attempt_count = 0
    total_study_seconds = 0
    student_scores: dict[int, list[float]] = {}

    for item in submitted_attempts:
        score = _safe_float(item.get("score"))
        if score >= 0:
            total_score += score
            scored_attempt_count += 1

        started_at = _parse_iso_datetime(item.get("started_at"))
        submitted_at = _parse_iso_datetime(item.get("submitted_at"))
        if started_at and submitted_at:
            try:
                if submitted_at > started_at:
                    total_study_seconds += int((submitted_at - started_at).total_seconds())
            except TypeError:
                pass

        practice_set_id = _safe_int(item.get("practice_set_id"))
        student_id_for_attempt = student_id_by_practice_set_id.get(practice_set_id)
        if student_id_for_attempt is not None:
            student_scores.setdefault(student_id_for_attempt, []).append(score)

    answers = await list_student_answers_by_attempt_ids(submitted_attempt_ids)
    debug_info["answers_raw_count"] = len(answers)
    answered_rows = [
        item
        for item in answers
        if _safe_int(item.get("attempt_id")) in submitted_attempt_id_set
        and item.get("selected_option_id") is not None
    ]
    total_answered_questions = len(answered_rows)
    debug_info["answers_selected_count"] = total_answered_questions

    question_ids = sorted(
        {
            _safe_int(item.get("question_id"))
            for item in answered_rows
            if _safe_int(item.get("question_id")) > 0
        }
    )
    question_rows = await list_question_topic_rows(question_ids)
    topic_id_by_question_id: dict[int, int] = {}
    for row in question_rows:
        question_id_value = _safe_int(row.get("question_id"))
        question_topic_id = _safe_int(row.get("topic_id"))
        if question_id_value > 0 and question_topic_id > 0:
            topic_id_by_question_id[question_id_value] = question_topic_id
    debug_info["mapped_questions_count"] = len(topic_id_by_question_id)

    weak_topic_accumulator: dict[int, dict] = {}
    for row in answered_rows:
        question_id_value = _safe_int(row.get("question_id"))
        current_topic_id = topic_id_by_question_id.get(question_id_value, 0)
        if current_topic_id <= 0:
            continue
        scope_info = assigned_topic_context.get(current_topic_id)
        if not scope_info:
            continue
        if class_subject_id is not None and _safe_int(scope_info.get("class_subject_id")) != class_subject_id:
            continue
        if subject_id is not None and _safe_int(scope_info.get("subject_id")) != subject_id:
            continue
        if topic_id is not None and current_topic_id != topic_id:
            continue

        entry = weak_topic_accumulator.setdefault(
            current_topic_id,
            {
                "topic_id": current_topic_id,
                "topic_name": scope_info.get("topic_name") or "Unknown topic",
                "total_answers": 0,
                "wrong_answers": 0,
            },
        )
        entry["total_answers"] += 1
        if row.get("is_correct") is False:
            entry["wrong_answers"] += 1

    weak_topics = []
    for entry in weak_topic_accumulator.values():
        total_answers = _safe_int(entry.get("total_answers"))
        wrong_answers = _safe_int(entry.get("wrong_answers"))
        weak_topics.append(
            {
                "topic_id": _safe_int(entry.get("topic_id")),
                "topic_name": entry.get("topic_name") or "Unknown topic",
                "error_rate_pct": _safe_pct(wrong_answers, total_answers),
                "total_answers": total_answers,
                "wrong_answers": wrong_answers,
            }
        )

    weak_topics.sort(
        key=lambda item: (
            -_safe_float(item.get("error_rate_pct")),
            -_safe_int(item.get("wrong_answers")),
            item.get("topic_name") or "",
        )
    )

    average_score_by_student = []
    for scores in student_scores.values():
        if not scores:
            continue
        average_score_by_student.append(sum(scores) / len(scores))

    total_students = len(average_score_by_student)
    active_student_count = sum(1 for score in average_score_by_student if score >= 5.0)
    needs_attention_count = sum(1 for score in average_score_by_student if score < 5.0)
    top_student_count = ceil(total_students * 0.2) if total_students > 0 else 0

    response = TeacherStatsResponse(
        summary={
            "average_score": round(total_score / scored_attempt_count, 2) if scored_attempt_count > 0 else 0.0,
            "completion_rate_pct": _safe_pct(len(submitted_attempts), total_attempts),
            "total_study_hours": round(total_study_seconds / 3600) if total_study_seconds > 0 else 0,
            "total_answered_questions": total_answered_questions,
        },
        weak_topics=weak_topics,
        student_distribution={
            "active_rate_pct": _safe_pct(active_student_count, total_students),
            "top_student_count": top_student_count,
            "needs_attention_count": needs_attention_count,
            "total_students": total_students,
        },
    )
    payload = response.model_dump()
    if debug:
        debug_info["weak_topics_count"] = len(payload.get("weak_topics") or [])
        debug_info["students_with_scores_count"] = total_students
        payload["debug"] = debug_info
    return payload
