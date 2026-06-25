import asyncio
from datetime import datetime, timezone

from core.supabase import SupabaseManager

UNKNOWN_TOPIC_NAME = "Chưa phân loại"
UNKNOWN_SUBJECT_NAME = "Môn học khác"
MAX_ANALYTICS_ROWS = 1000


async def find_recent_wrong_questions(student_id: int, limit: int = 20) -> list[dict]:
    practice_sets = await _find_student_practice_sets(student_id)
    practice_set_ids = [row["practice_set_id"] for row in practice_sets]
    if not practice_set_ids:
        return []

    attempt_ids = await _find_submitted_attempt_ids_by_practice_set_ids(practice_set_ids)
    if not attempt_ids:
        return []

    supabase = SupabaseManager.get_client()
    answer_response = await asyncio.to_thread(
        lambda: supabase.table("student_answers")
        .select(
            "answer_id,attempt_id,question_id,selected_option_id,is_correct,answered_at,"
            "questions(question_id,content,explanation,difficulty,topics(topic_id,topic_name))"
        )
        .in_("attempt_id", attempt_ids)
        .eq("is_correct", False)
        .is_("deleted_at", None)
        .order("answered_at", desc=True)
        .limit(limit)
        .execute()
    )
    rows = answer_response.data or []
    question_ids = [row["question_id"] for row in rows if row.get("question_id")]
    option_map = await _find_question_options_by_question_ids(question_ids)

    results: list[dict] = []
    for row in rows:
        question = row.get("questions") or {}
        options = option_map.get(row.get("question_id"), [])
        correct_option = next((opt for opt in options if opt.get("is_correct")), None)
        selected_option = next(
            (opt for opt in options if opt.get("option_id") == row.get("selected_option_id")),
            None,
        )
        topic = question.get("topics") or {}
        results.append(
            {
                "question_id": row.get("question_id"),
                "content": question.get("content"),
                "topic_name": topic.get("topic_name") or UNKNOWN_TOPIC_NAME,
                "difficulty": question.get("difficulty"),
                "selected_answer": selected_option.get("option_text") if selected_option else None,
                "correct_answer": correct_option.get("option_text") if correct_option else None,
                "explanation": question.get("explanation"),
                "answered_at": row.get("answered_at"),
            }
        )
    return results


async def find_wrong_question_summary_by_topic(student_id: int) -> list[dict]:
    """Rank weak topics by error rate, not only by raw wrong count."""
    answer_rows = await _find_submitted_student_answer_rows(student_id, limit=MAX_ANALYTICS_ROWS)
    summary: dict[str, dict] = {}
    for row in answer_rows:
        question = row.get("questions") or {}
        topic = question.get("topics") or {}
        topic_name = topic.get("topic_name") or UNKNOWN_TOPIC_NAME
        current = summary.setdefault(
            topic_name,
            {
                "topic_name": topic_name,
                "total_answered": 0,
                "wrong_count": 0,
                "correct_count": 0,
                "wrong_rate": 0,
            },
        )
        current["total_answered"] += 1
        if row.get("is_correct") is False:
            current["wrong_count"] += 1
        elif row.get("is_correct") is True:
            current["correct_count"] += 1

    for item in summary.values():
        total_answered = item["total_answered"]
        item["wrong_rate"] = round((item["wrong_count"] / total_answered) * 100, 1) if total_answered else 0

    return sorted(
        summary.values(),
        key=lambda item: (item["wrong_rate"], item["wrong_count"], item["total_answered"]),
        reverse=True,
    )


async def find_recent_exam_results(student_id: int, limit: int = 10) -> list[dict]:
    practice_sets = await _find_student_practice_sets(student_id)
    if not practice_sets:
        return []

    practice_set_ids = [row["practice_set_id"] for row in practice_sets]
    subject_map = {
        row["practice_set_id"]: (row.get("subjects") or {}).get("subject_name") or UNKNOWN_SUBJECT_NAME
        for row in practice_sets
    }
    supabase = SupabaseManager.get_client()
    attempt_response = await asyncio.to_thread(
        lambda: supabase.table("practice_attempts")
        .select("attempt_id,practice_set_id,started_at,submitted_at,score,total_correct,total_wrong,status")
        .in_("practice_set_id", practice_set_ids)
        .eq("status", "submitted")
        .is_("deleted_at", None)
        .order("submitted_at", desc=True)
        .limit(limit)
        .execute()
    )
    results = attempt_response.data or []
    for item in results:
        item["subject_name"] = subject_map.get(item.get("practice_set_id"), UNKNOWN_SUBJECT_NAME)
    return results


async def find_learning_progress(student_id: int) -> dict:
    results = await find_recent_exam_results(student_id, limit=50)
    if not results:
        return {
            "total_attempts": 0,
            "avg_score": 0,
            "accuracy": 0,
            "trend": "insufficient_data",
            "score_trend": "insufficient_data",
            "accuracy_trend": "insufficient_data",
            "by_subject": [],
            "by_difficulty": [],
        }

    total_correct = sum(item.get("total_correct") or 0 for item in results)
    total_wrong = sum(item.get("total_wrong") or 0 for item in results)
    total_questions = total_correct + total_wrong
    avg_score = round(sum(float(item.get("score") or 0) for item in results) / len(results), 2)
    accuracy = round((total_correct / total_questions) * 100, 1) if total_questions else 0
    chronological = list(reversed(results))
    score_trend = _calculate_score_trend(chronological)
    accuracy_trend = _calculate_accuracy_trend(chronological)
    by_subject = _summarize_attempts_by_subject(results)
    by_difficulty = await _summarize_answers_by_difficulty(student_id)

    return {
        "total_attempts": len(results),
        "avg_score": avg_score,
        "accuracy": accuracy,
        "trend": score_trend,
        "score_trend": score_trend,
        "accuracy_trend": accuracy_trend,
        "by_subject": by_subject,
        "by_difficulty": by_difficulty,
        "recent_results": results[:10],
    }


async def find_student_learning_data_version(student_id: int) -> str:
    results = await find_recent_exam_results(student_id, limit=1)
    if not results:
        return "no-data"
    latest = results[0]
    return f"{latest.get('attempt_id')}:{latest.get('submitted_at')}:{latest.get('score')}"


async def _find_student_practice_sets(student_id: int) -> list[dict]:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("practice_sets")
        .select("practice_set_id,subject_id,topic_id,difficulty,subjects(subject_name)")
        .eq("student_id", student_id)
        .is_("deleted_at", None)
        .execute()
    )
    return response.data or []


async def _find_submitted_attempt_ids_by_practice_set_ids(practice_set_ids: list[int]) -> list[int]:
    if not practice_set_ids:
        return []
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("practice_attempts")
        .select("attempt_id")
        .in_("practice_set_id", practice_set_ids)
        .eq("status", "submitted")
        .is_("deleted_at", None)
        .execute()
    )
    return [row["attempt_id"] for row in (response.data or [])]


async def _find_submitted_student_answer_rows(student_id: int, limit: int = MAX_ANALYTICS_ROWS) -> list[dict]:
    practice_sets = await _find_student_practice_sets(student_id)
    practice_set_ids = [row["practice_set_id"] for row in practice_sets]
    if not practice_set_ids:
        return []
    attempt_ids = await _find_submitted_attempt_ids_by_practice_set_ids(practice_set_ids)
    if not attempt_ids:
        return []

    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("student_answers")
        .select(
            "answer_id,attempt_id,question_id,selected_option_id,is_correct,answered_at,"
            "questions(question_id,difficulty,topics(topic_id,topic_name))"
        )
        .in_("attempt_id", attempt_ids)
        .is_("deleted_at", None)
        .order("answered_at", desc=True)
        .limit(limit)
        .execute()
    )
    return response.data or []


async def _find_question_options_by_question_ids(question_ids: list[int]) -> dict[int, list[dict]]:
    unique_ids = list({int(question_id) for question_id in question_ids if question_id})
    if not unique_ids:
        return {}
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("question_options")
        .select("option_id,question_id,option_text,is_correct,order_num")
        .in_("question_id", unique_ids)
        .order("order_num")
        .execute()
    )
    result: dict[int, list[dict]] = {}
    for option in response.data or []:
        result.setdefault(option["question_id"], []).append(option)
    return result


def _calculate_score_trend(chronological_results: list[dict]) -> str:
    first_scores = [float(item.get("score") or 0) for item in chronological_results[:3]]
    last_scores = [float(item.get("score") or 0) for item in chronological_results[-3:]]
    if len(first_scores) < 2 or len(last_scores) < 2:
        return "insufficient_data"
    first_avg = sum(first_scores) / len(first_scores)
    last_avg = sum(last_scores) / len(last_scores)
    if last_avg >= first_avg + 0.5:
        return "improving"
    if last_avg <= first_avg - 0.5:
        return "declining"
    return "stable"


def _calculate_accuracy_trend(chronological_results: list[dict]) -> str:
    first_rates = [_attempt_accuracy(item) for item in chronological_results[:3] if _attempt_total_questions(item) > 0]
    last_rates = [_attempt_accuracy(item) for item in chronological_results[-3:] if _attempt_total_questions(item) > 0]
    if len(first_rates) < 2 or len(last_rates) < 2:
        return "insufficient_data"
    first_avg = sum(first_rates) / len(first_rates)
    last_avg = sum(last_rates) / len(last_rates)
    if last_avg >= first_avg + 5:
        return "improving"
    if last_avg <= first_avg - 5:
        return "declining"
    return "stable"


def _summarize_attempts_by_subject(results: list[dict]) -> list[dict]:
    summary: dict[str, dict] = {}
    for item in results:
        subject_name = item.get("subject_name") or UNKNOWN_SUBJECT_NAME
        current = summary.setdefault(
            subject_name,
            {"subject_name": subject_name, "attempt_count": 0, "avg_score": 0, "accuracy": 0, "correct": 0, "wrong": 0},
        )
        current["attempt_count"] += 1
        current["avg_score"] += float(item.get("score") or 0)
        current["correct"] += item.get("total_correct") or 0
        current["wrong"] += item.get("total_wrong") or 0

    for item in summary.values():
        total = item["correct"] + item["wrong"]
        item["avg_score"] = round(item["avg_score"] / item["attempt_count"], 2) if item["attempt_count"] else 0
        item["accuracy"] = round((item["correct"] / total) * 100, 1) if total else 0
    return sorted(summary.values(), key=lambda item: item["accuracy"])


async def _summarize_answers_by_difficulty(student_id: int) -> list[dict]:
    rows = await _find_submitted_student_answer_rows(student_id, limit=MAX_ANALYTICS_ROWS)
    summary: dict[str, dict] = {}
    for row in rows:
        question = row.get("questions") or {}
        difficulty = question.get("difficulty") or "unknown"
        current = summary.setdefault(
            difficulty,
            {"difficulty": difficulty, "total_answered": 0, "wrong_count": 0, "correct_count": 0, "accuracy": 0},
        )
        current["total_answered"] += 1
        if row.get("is_correct") is False:
            current["wrong_count"] += 1
        elif row.get("is_correct") is True:
            current["correct_count"] += 1

    for item in summary.values():
        total_answered = item["total_answered"]
        item["accuracy"] = round((item["correct_count"] / total_answered) * 100, 1) if total_answered else 0
    return sorted(summary.values(), key=lambda item: item["accuracy"])


def _attempt_total_questions(item: dict) -> int:
    return (item.get("total_correct") or 0) + (item.get("total_wrong") or 0)


def _attempt_accuracy(item: dict) -> float:
    total = _attempt_total_questions(item)
    return ((item.get("total_correct") or 0) / total) * 100 if total else 0
