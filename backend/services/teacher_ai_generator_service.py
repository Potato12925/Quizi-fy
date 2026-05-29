from math import ceil

from middlewares.auth_middleware import CurrentUser
from repositories.subject_repository import list_assigned_subject_ids_by_teacher
from repositories.teacher_ai_generator_repository import (
    bulk_update_question_status,
    create_ai_request_record,
    create_question_history_record,
    create_question_options,
    create_question_record,
    find_active_ai_request_for_document_topic,
    find_ai_request_by_id,
    find_teacher_document_topic_row,
    find_teacher_question_by_id,
    list_ai_requests_by_document_topic_ids,
    list_existing_question_contents,
    list_questions_by_ai_request_id,
    list_teacher_document_topic_rows,
    list_teacher_questions_by_ids,
    replace_question_options,
    soft_delete_teacher_question_by_id,
    update_ai_request_by_id,
    update_teacher_question_by_id,
)
from schemas.teacher_ai_generator_schema import (
    TeacherAiRequestConfirmReviewPayload,
    TeacherAiRequestCreatePayload,
    TeacherAiReviewOptionPayload,
    TeacherBulkQuestionStatusPayload,
    TeacherManualQuestionPayload,
    TeacherQuestionUpdatePayload,
)
from utils.document_extract_util import extract_document_text
from utils.openai_util import generate_mcq_questions_with_openai


class TeacherAiAuthorizationError(ValueError):
    pass


class TeacherAiValidationError(ValueError):
    pass


def _normalize_question_content(value: str) -> str:
    return " ".join((value or "").strip().lower().split())


def _serialize_document_topic_row(row: dict) -> dict:
    topic = row.get("topics") or {}
    subject = topic.get("subjects") or {}
    document = row.get("documents") or {}
    return {
        "document_topic_id": int(row["document_topic_id"]),
        "document_id": int(row["document_id"]),
        "document_title": document.get("title"),
        "topic_id": int(row["topic_id"]),
        "topic_name": topic.get("topic_name"),
        "subject_id": int(topic["subject_id"]) if topic.get("subject_id") is not None else None,
        "subject_name": subject.get("subject_name"),
        "file_url": document.get("file_url"),
        "file_type": document.get("file_type"),
    }


def _serialize_question_item(item: dict, document_topic_map: dict[int, dict]) -> dict:
    dt_id = int(item["document_topic_id"])
    doc_topic = document_topic_map.get(dt_id) or {}
    options = sorted(item.get("question_options") or [], key=lambda opt: int(opt.get("order_num") or 0))
    return {
        "question_id": int(item["question_id"]),
        "teacher_id": int(item["teacher_id"]),
        "document_topic_id": dt_id,
        "ai_request_id": item.get("ai_request_id"),
        "content": item.get("content"),
        "difficulty": item.get("difficulty"),
        "source": item.get("source"),
        "status": item.get("status"),
        "explanation": item.get("explanation"),
        "created_at": item.get("created_at"),
        "updated_at": item.get("updated_at"),
        "document_id": doc_topic.get("document_id"),
        "document_title": doc_topic.get("document_title"),
        "topic_id": doc_topic.get("topic_id"),
        "topic_name": doc_topic.get("topic_name"),
        "subject_id": doc_topic.get("subject_id"),
        "subject_name": doc_topic.get("subject_name"),
        "options": options,
    }


def _sorted_options(options: list[dict]) -> list[dict]:
    return sorted(options, key=lambda option: int(option.get("order_num") or 0))


def _serialize_review_options(options: list[dict]) -> list[dict]:
    sorted_options = _sorted_options(options)
    result: list[dict] = []
    for index, option in enumerate(sorted_options):
        result.append(
            {
                "option_label": chr(ord("A") + index),
                "option_text": str(option.get("option_text") or ""),
                "order_num": index + 1,
                "is_correct": bool(option.get("is_correct")),
            }
        )
    return result


def _normalize_review_option_payload(options: list[TeacherAiReviewOptionPayload]) -> list[dict]:
    sorted_payload = sorted(options, key=lambda item: item.order_num)
    result: list[dict] = []
    for index, option in enumerate(sorted_payload):
        result.append(
            {
                "option_label": chr(ord("A") + index),
                "option_text": option.option_text,
                "order_num": index + 1,
                "is_correct": option.is_correct,
            }
        )
    return result


async def get_teacher_ai_generator_options(current_user: CurrentUser) -> dict:
    rows = await list_teacher_document_topic_rows(current_user.user_id)
    allowed_subject_ids = set(await list_assigned_subject_ids_by_teacher(current_user.user_id))
    filtered = []
    for row in rows:
        topic = row.get("topics") or {}
        subject = topic.get("subjects") or {}
        subject_id = topic.get("subject_id")
        if subject_id is None:
            continue
        if int(subject_id) not in allowed_subject_ids:
            continue
        if subject.get("deleted_at") is not None:
            continue
        if subject.get("status") != "active":
            continue
        filtered.append(row)

    serialized = [_serialize_document_topic_row(item) for item in filtered]

    subject_map: dict[int, dict] = {}
    topic_map: dict[int, dict] = {}
    document_map: dict[int, dict] = {}
    for item in serialized:
        subject_id = int(item["subject_id"])
        topic_id = int(item["topic_id"])
        document_id = int(item["document_id"])
        subject_map[subject_id] = {"subject_id": subject_id, "subject_name": item["subject_name"]}
        topic_map[topic_id] = {
            "topic_id": topic_id,
            "topic_name": item["topic_name"],
            "subject_id": subject_id,
            "subject_name": item["subject_name"],
        }
        document_map[document_id] = {
            "document_id": document_id,
            "document_title": item["document_title"],
            "subject_id": subject_id,
        }

    return {
        "subjects": list(subject_map.values()),
        "topics": list(topic_map.values()),
        "documents": list(document_map.values()),
        "document_topics": serialized,
    }


async def create_teacher_ai_request(current_user: CurrentUser, payload: TeacherAiRequestCreatePayload) -> dict:
    doc_topic = await find_teacher_document_topic_row(current_user.user_id, payload.document_topic_id)
    if not doc_topic:
        raise TeacherAiAuthorizationError("You can only generate questions for your own assigned document topics")

    active_request = await find_active_ai_request_for_document_topic(payload.document_topic_id)
    if active_request:
        raise TeacherAiValidationError("There is already an active AI request for this document topic")

    created = await create_ai_request_record(
        {
            "document_topic_id": payload.document_topic_id,
            "num_questions": payload.num_questions,
            "difficulty": payload.difficulty,
            "content_scope": payload.content_scope,
            "status": "pending",
        }
    )

    request_id = int(created["request_id"])
    try:
        from workers.ai_generation_worker import process_ai_request_task

        process_ai_request_task.delay(request_id=request_id, teacher_id=current_user.user_id)
    except Exception as exc:
        await update_ai_request_by_id(
            request_id,
            {
                "status": "failed",
                "error_message": f"Unable to enqueue request: {str(exc)}",
                "retry_count": int(created.get("retry_count") or 0) + 1,
            },
        )
        raise TeacherAiValidationError("Unable to queue AI generation request")

    return created


async def list_teacher_ai_requests(current_user: CurrentUser, page: int, limit: int) -> dict:
    doc_topic_rows = await list_teacher_document_topic_rows(current_user.user_id)
    allowed_subject_ids = set(await list_assigned_subject_ids_by_teacher(current_user.user_id))
    serialized_doc_topics = [
        _serialize_document_topic_row(item)
        for item in doc_topic_rows
        if int((item.get("topics") or {}).get("subject_id") or 0) in allowed_subject_ids
        and ((item.get("topics") or {}).get("subjects") or {}).get("status") == "active"
        and ((item.get("topics") or {}).get("subjects") or {}).get("deleted_at") is None
    ]
    doc_topic_ids = [int(item["document_topic_id"]) for item in serialized_doc_topics]

    items, total = await list_ai_requests_by_document_topic_ids(
        document_topic_ids=doc_topic_ids,
        page=page,
        limit=limit,
    )
    doc_topic_map = {int(item["document_topic_id"]): item for item in serialized_doc_topics}
    serialized_items = []
    for item in items:
        dt_id = int(item["document_topic_id"])
        dt = doc_topic_map.get(dt_id) or {}
        serialized_items.append(
            {
                **item,
                "document_topic": dt,
            }
        )

    total_pages = ceil(total / limit) if total > 0 else 1
    return {
        "items": serialized_items,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
        },
    }


async def get_teacher_ai_request_detail(current_user: CurrentUser, request_id: int) -> dict:
    request = await find_ai_request_by_id(request_id)
    if not request:
        raise ValueError("AI request not found")
    doc_topic = await find_teacher_document_topic_row(current_user.user_id, int(request["document_topic_id"]))
    if not doc_topic:
        raise TeacherAiAuthorizationError("You do not have permission to access this AI request")
    return {**request, "document_topic": _serialize_document_topic_row(doc_topic)}


async def list_teacher_ai_request_questions(current_user: CurrentUser, request_id: int) -> list[dict]:
    request = await find_ai_request_by_id(request_id)
    if not request:
        raise ValueError("AI request not found")

    doc_topic = await find_teacher_document_topic_row(current_user.user_id, int(request["document_topic_id"]))
    if not doc_topic:
        raise TeacherAiAuthorizationError("You do not have permission to access this AI request")

    questions = await list_questions_by_ai_request_id(request_id=request_id, teacher_id=current_user.user_id)
    serialized_doc_topic = _serialize_document_topic_row(doc_topic)
    return [
        _serialize_question_item(item, {serialized_doc_topic["document_topic_id"]: serialized_doc_topic})
        for item in questions
    ]


async def confirm_teacher_ai_request_review(
    current_user: CurrentUser,
    request_id: int,
    payload: TeacherAiRequestConfirmReviewPayload,
) -> dict:
    request = await find_ai_request_by_id(request_id)
    if not request:
        raise ValueError("AI request not found")

    doc_topic = await find_teacher_document_topic_row(current_user.user_id, int(request["document_topic_id"]))
    if not doc_topic:
        raise TeacherAiAuthorizationError("You do not have permission to review this AI request")
    if request.get("status") != "completed":
        raise TeacherAiValidationError("Only completed AI requests can be reviewed")
    if bool(request.get("is_reviewed")):
        raise TeacherAiValidationError("This AI request was already reviewed and is read-only")

    existing_questions = await list_questions_by_ai_request_id(request_id=request_id, teacher_id=current_user.user_id)
    if not existing_questions:
        raise TeacherAiValidationError("No generated questions found for this AI request")

    existing_map = {int(item["question_id"]): item for item in existing_questions}
    existing_ids = set(existing_map.keys())
    payload_ids = {item.question_id for item in payload.questions}

    if payload_ids != existing_ids:
        missing_ids = sorted(existing_ids - payload_ids)
        extra_ids = sorted(payload_ids - existing_ids)
        details: list[str] = []
        if missing_ids:
            details.append(f"missing={missing_ids}")
        if extra_ids:
            details.append(f"extra={extra_ids}")
        raise TeacherAiValidationError(f"Review payload does not match generated questions ({', '.join(details)})")

    updated_question_ids: list[int] = []
    for question_payload in payload.questions:
        existing = existing_map[question_payload.question_id]
        old_options = _serialize_review_options(existing.get("question_options") or [])
        new_options = _normalize_review_option_payload(question_payload.options)

        old_snapshot = {
            "content": existing.get("content"),
            "difficulty": existing.get("difficulty"),
            "status": existing.get("status"),
            "explanation": existing.get("explanation"),
            "options": old_options,
        }
        new_snapshot = {
            "content": question_payload.content,
            "difficulty": question_payload.difficulty,
            "status": question_payload.status,
            "explanation": question_payload.explanation,
            "options": new_options,
        }

        if old_snapshot == new_snapshot:
            continue

        if question_payload.status == "rejected":
            await soft_delete_teacher_question_by_id(
                question_id=question_payload.question_id,
                teacher_id=current_user.user_id,
                status="rejected",
            )
            await create_question_history_record(
                {
                    "question_id": question_payload.question_id,
                    "changed_by": current_user.user_id,
                    "old_data": old_snapshot,
                    "new_data": {
                        **new_snapshot,
                        "deleted": True,
                    },
                    "change_type": "teacher_ai_review_reject_delete",
                }
            )
            updated_question_ids.append(question_payload.question_id)
            continue

        await update_teacher_question_by_id(
            question_id=question_payload.question_id,
            teacher_id=current_user.user_id,
            payload={
                "content": question_payload.content,
                "difficulty": question_payload.difficulty,
                "status": question_payload.status,
                "explanation": question_payload.explanation,
            },
        )

        ordered_options = [item["option_text"] for item in new_options]
        correct_option_index = next(index for index, item in enumerate(new_options) if item["is_correct"])
        await replace_question_options(
            question_id=question_payload.question_id,
            options=ordered_options,
            correct_option_index=correct_option_index,
        )

        await create_question_history_record(
            {
                "question_id": question_payload.question_id,
                "changed_by": current_user.user_id,
                "old_data": old_snapshot,
                "new_data": new_snapshot,
                "change_type": "teacher_ai_review_confirm",
            }
        )
        updated_question_ids.append(question_payload.question_id)

    locked_request = await update_ai_request_by_id(
        request_id,
        {
            "is_reviewed": True,
        },
    )

    return {
        "request": locked_request or {**request, "is_reviewed": True},
        "updated_question_ids": sorted(updated_question_ids),
        "updated_count": len(updated_question_ids),
    }


async def retry_teacher_ai_request(current_user: CurrentUser, request_id: int) -> dict:
    request = await find_ai_request_by_id(request_id)
    if not request:
        raise ValueError("AI request not found")

    doc_topic = await find_teacher_document_topic_row(current_user.user_id, int(request["document_topic_id"]))
    if not doc_topic:
        raise TeacherAiAuthorizationError("You do not have permission to retry this AI request")
    if request.get("status") != "failed":
        raise TeacherAiValidationError("Only failed AI requests can be retried")

    updated = await update_ai_request_by_id(
        request_id,
        {
            "status": "pending",
            "error_message": None,
            "generated_question_count": 0,
        },
    )
    try:
        from workers.ai_generation_worker import process_ai_request_task

        process_ai_request_task.delay(request_id=request_id, teacher_id=current_user.user_id)
    except Exception as exc:
        await update_ai_request_by_id(
            request_id,
            {
                "status": "failed",
                "error_message": f"Unable to enqueue request: {str(exc)}",
                "retry_count": int(request.get("retry_count") or 0) + 1,
            },
        )
        raise TeacherAiValidationError("Unable to queue AI retry request")
    return updated or request


async def update_teacher_question(
    current_user: CurrentUser,
    question_id: int,
    payload: TeacherQuestionUpdatePayload,
) -> dict:
    existing = await find_teacher_question_by_id(question_id=question_id, teacher_id=current_user.user_id)
    if not existing:
        raise ValueError("Question not found")

    updated = await update_teacher_question_by_id(
        question_id=question_id,
        teacher_id=current_user.user_id,
        payload={
            "content": payload.content,
            "difficulty": payload.difficulty,
            "explanation": payload.explanation,
        },
    )
    await replace_question_options(
        question_id=question_id,
        options=payload.options,
        correct_option_index=payload.correct_option_index,
    )
    await create_question_history_record(
        {
            "question_id": question_id,
            "changed_by": current_user.user_id,
            "old_data": {
                "content": existing.get("content"),
                "difficulty": existing.get("difficulty"),
                "explanation": existing.get("explanation"),
                "options": existing.get("question_options") or [],
            },
            "new_data": {
                "content": payload.content,
                "difficulty": payload.difficulty,
                "explanation": payload.explanation,
                "options": payload.options,
                "correct_option_index": payload.correct_option_index,
            },
            "change_type": "teacher_question_update",
        }
    )

    refreshed = await find_teacher_question_by_id(question_id=question_id, teacher_id=current_user.user_id)
    doc_topic = await find_teacher_document_topic_row(current_user.user_id, int(existing["document_topic_id"]))
    dt_map = {}
    if doc_topic:
        serialized = _serialize_document_topic_row(doc_topic)
        dt_map[serialized["document_topic_id"]] = serialized
    return _serialize_question_item(refreshed or updated or existing, dt_map)


async def bulk_approve_teacher_questions(current_user: CurrentUser, payload: TeacherBulkQuestionStatusPayload) -> dict:
    return await _bulk_update_teacher_question_status(
        current_user=current_user,
        question_ids=payload.question_ids,
        to_status="approved",
    )


async def bulk_reject_teacher_questions(current_user: CurrentUser, payload: TeacherBulkQuestionStatusPayload) -> dict:
    return await _bulk_update_teacher_question_status(
        current_user=current_user,
        question_ids=payload.question_ids,
        to_status="rejected",
    )


async def _bulk_update_teacher_question_status(
    *,
    current_user: CurrentUser,
    question_ids: list[int],
    to_status: str,
) -> dict:
    existing_rows = await list_teacher_questions_by_ids(question_ids=question_ids, teacher_id=current_user.user_id)
    existing_ids = {int(item["question_id"]) for item in existing_rows}
    missing_ids = [item for item in question_ids if item not in existing_ids]
    non_draft_ids = [int(item["question_id"]) for item in existing_rows if item.get("status") != "draft"]
    updatable_ids = [item for item in question_ids if item in existing_ids and item not in non_draft_ids]

    updated_ids = await bulk_update_question_status(
        question_ids=updatable_ids,
        teacher_id=current_user.user_id,
        from_status="draft",
        to_status=to_status,
    )

    for question_id in updated_ids:
        await create_question_history_record(
            {
                "question_id": question_id,
                "changed_by": current_user.user_id,
                "old_data": {"status": "draft"},
                "new_data": {"status": to_status},
                "change_type": f"teacher_bulk_{to_status}",
            }
        )

    return {
        "updated_question_ids": sorted(updated_ids),
        "updated_count": len(updated_ids),
        "skipped_missing_question_ids": missing_ids,
        "skipped_non_draft_question_ids": sorted(non_draft_ids),
    }


async def create_teacher_manual_question(current_user: CurrentUser, payload: TeacherManualQuestionPayload) -> dict:
    doc_topic = await find_teacher_document_topic_row(current_user.user_id, payload.document_topic_id)
    if not doc_topic:
        raise TeacherAiAuthorizationError("You can only create manual questions in your own document topics")

    created = await create_question_record(
        {
            "teacher_id": current_user.user_id,
            "document_topic_id": payload.document_topic_id,
            "ai_request_id": None,
            "content": payload.content,
            "difficulty": payload.difficulty,
            "source": "manual",
            "status": "draft",
            "explanation": payload.explanation,
        }
    )
    question_id = int(created["question_id"])
    await create_question_options(
        question_id=question_id,
        options=payload.options,
        correct_option_index=payload.correct_option_index,
    )
    await create_question_history_record(
        {
            "question_id": question_id,
            "changed_by": current_user.user_id,
            "old_data": None,
            "new_data": {
                "content": payload.content,
                "difficulty": payload.difficulty,
                "status": "draft",
                "source": "manual",
            },
            "change_type": "teacher_manual_question_create",
        }
    )
    refreshed = await find_teacher_question_by_id(question_id=question_id, teacher_id=current_user.user_id)
    serialized_dt = _serialize_document_topic_row(doc_topic)
    return _serialize_question_item(
        refreshed or created,
        {serialized_dt["document_topic_id"]: serialized_dt},
    )


async def process_ai_request_job(request_id: int, teacher_id: int) -> None:
    request = await find_ai_request_by_id(request_id)
    if not request:
        return

    async def _mark_failed(message: str, retry_count: int) -> None:
        await update_ai_request_by_id(
            request_id=request_id,
            payload={
                "status": "failed",
                "error_message": message[:2000],
                "retry_count": retry_count,
            },
        )

    retry_count = int(request.get("retry_count") or 0)
    try:
        await update_ai_request_by_id(
            request_id=request_id,
            payload={
                "status": "processing",
                "error_message": None,
            },
        )

        doc_topic = await find_teacher_document_topic_row(teacher_id, int(request["document_topic_id"]))
        if not doc_topic:
            raise TeacherAiAuthorizationError("Document topic is not accessible for this teacher")

        serialized_doc_topic = _serialize_document_topic_row(doc_topic)
        document_text = await extract_document_text(
            file_url=str(serialized_doc_topic.get("file_url") or ""),
            file_type=str(serialized_doc_topic.get("file_type") or ""),
        )

        existing_contents = await list_existing_question_contents(int(request["document_topic_id"]))
        generated_items = generate_mcq_questions_with_openai(
            document_text=document_text,
            difficulty=request["difficulty"],
            num_questions=int(request["num_questions"]),
            content_scope=request.get("content_scope"),
            existing_question_contents=existing_contents,
        )

        existing_norms = {_normalize_question_content(item) for item in existing_contents}
        inserted_count = 0
        batch_norms: set[str] = set()

        for item in generated_items:
            normalized = _normalize_question_content(item["content"])
            if not normalized:
                continue
            if normalized in batch_norms:
                continue
            if normalized in existing_norms:
                continue
            batch_norms.add(normalized)
            existing_norms.add(normalized)

            created_question = await create_question_record(
                {
                    "teacher_id": teacher_id,
                    "document_topic_id": int(request["document_topic_id"]),
                    "ai_request_id": request_id,
                    "content": item["content"],
                    "difficulty": item["difficulty"],
                    "source": "ai",
                    "status": "draft",
                    "explanation": item["explanation"],
                }
            )
            await create_question_options(
                question_id=int(created_question["question_id"]),
                options=item["options"],
                correct_option_index=int(item["correct_option_index"]),
            )
            inserted_count += 1

        await update_ai_request_by_id(
            request_id=request_id,
            payload={
                "status": "completed",
                "generated_question_count": inserted_count,
                "error_message": None,
            },
        )
    except Exception as exc:
        await _mark_failed(str(exc), retry_count + 1)
