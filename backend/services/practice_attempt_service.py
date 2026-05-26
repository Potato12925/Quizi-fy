import asyncio
from math import ceil
from datetime import datetime, timezone
from core.supabase import SupabaseManager
from repositories.practice_attempt_repository import (
    create_practice_attempt_record,
    find_practice_attempt_by_id,
    list_practice_attempts,
    soft_delete_practice_attempt_by_id,
    update_practice_attempt_by_id,
    get_attempt_result_details,
)
from schemas.practice_attempt_schema import PracticeAttemptCreateRequest, PracticeAttemptUpdateRequest, PracticeAttemptStartRequest
from schemas.student_answer_schema import StudentAnswerSaveRequest


async def create_practice_attempt(payload: PracticeAttemptCreateRequest) -> dict:
    return await create_practice_attempt_record({ "practice_set_id": payload.practice_set_id, "total_correct": payload.total_correct, "total_wrong": payload.total_wrong, "status": payload.status })


async def get_practice_attempt_by_id(record_id: int) -> dict:
    data = await find_practice_attempt_by_id(record_id)
    if not data:
        raise ValueError("PracticeAttempt not found")
    return data


async def start_attempt(payload: PracticeAttemptStartRequest) -> dict:
    return await create_practice_attempt_record({
        "practice_set_id": payload.practice_set_id,
        "status": "in_progress"
    })

async def autosave_answers(attempt_id: int, payload: StudentAnswerSaveRequest) -> list[dict]:
    payloads = [
        {
            "attempt_id": attempt_id,
            "question_id": ans.question_id,
            "selected_option_id": ans.selected_option_id
        }
        for ans in payload.answers
    ]
    from repositories.student_answer_repository import upsert_student_answers
    return await upsert_student_answers(payloads)

async def submit_attempt(attempt_id: int) -> dict:
    supabase = SupabaseManager.get_client()
    answers_resp = await asyncio.to_thread(lambda: supabase.table("student_answers").select("*").eq("attempt_id", attempt_id).execute())
    answers = answers_resp.data or []
    
    question_ids = [a["question_id"] for a in answers]
    correct_options = {}
    if question_ids:
        correct_options_resp = await asyncio.to_thread(lambda: supabase.table("question_options").select("question_id, option_id").in_("question_id", question_ids).eq("is_correct", True).execute())
        correct_options = {opt["question_id"]: opt["option_id"] for opt in (correct_options_resp.data or [])}
    
    total_correct = 0
    total_wrong = 0
    updates = []
    for ans in answers:
        is_correct = False
        if ans["selected_option_id"] and ans["selected_option_id"] == correct_options.get(ans["question_id"]):
            is_correct = True
            total_correct += 1
        elif ans["selected_option_id"]:
            total_wrong += 1
        # if not selected, it's just wrong but total_wrong includes attempted wrong
        updates.append({
            "answer_id": ans["answer_id"],
            "attempt_id": ans["attempt_id"],
            "question_id": ans["question_id"],
            "is_correct": is_correct
        })
    
    if updates:
        await asyncio.to_thread(lambda: supabase.table("student_answers").upsert(updates).execute())
        
    attempt = await find_practice_attempt_by_id(attempt_id)
    if not attempt:
        raise ValueError("PracticeAttempt not found")
        
    ps_resp = await asyncio.to_thread(lambda: supabase.table("practice_sets").select("num_questions_actual").eq("practice_set_id", attempt["practice_set_id"]).execute())
    num_q = ps_resp.data[0]["num_questions_actual"] if ps_resp.data else (total_correct + total_wrong)
    if num_q == 0: num_q = 1
    
    score = (total_correct / num_q) * 10.0
    
    updated_attempt = await update_practice_attempt_by_id(attempt_id, {
        "status": "submitted",
        "submitted_at": datetime.now(timezone.utc).isoformat(),
        "total_correct": total_correct,
        "total_wrong": num_q - total_correct,
        "score": score
    })
    return updated_attempt

async def get_attempt_result(attempt_id: int) -> dict:
    details = await get_attempt_result_details(attempt_id)
    if not details:
        raise ValueError("PracticeAttempt not found")
    return details

async def get_my_history(student_id: int) -> list[dict]:
    supabase = SupabaseManager.get_client()
    
    ps_resp = await asyncio.to_thread(lambda: supabase.table("practice_sets").select("practice_set_id, subjects(subject_name)").eq("student_id", student_id).execute())
    ps_data = ps_resp.data or []
    if not ps_data:
        return []
    
    ps_ids = [ps["practice_set_id"] for ps in ps_data]
    ps_map = {ps["practice_set_id"]: ps["subjects"]["subject_name"] if ps.get("subjects") else "Unknown" for ps in ps_data}
    
    attempts_resp = await asyncio.to_thread(lambda: supabase.table("practice_attempts").select("*").in_("practice_set_id", ps_ids).order("started_at", desc=True).execute())
    attempts = attempts_resp.data or []
    
    for attempt in attempts:
        attempt["subject_name"] = ps_map.get(attempt["practice_set_id"], "Unknown")
        
    return attempts

async def get_attempt_questions(attempt_id: int) -> dict:
    attempt = await find_practice_attempt_by_id(attempt_id)
    if not attempt:
        raise ValueError("PracticeAttempt not found")
        
    supabase = SupabaseManager.get_client()
    
    ps_id = attempt["practice_set_id"]
    psq_resp = await asyncio.to_thread(lambda: supabase.table("practice_set_questions")
        .select("order_num, questions(*, question_options(option_id, option_text, order_num))")
        .eq("practice_set_id", ps_id)
        .order("order_num")
        .execute()
    )
    questions_data = psq_resp.data or []
    
    answers_resp = await asyncio.to_thread(lambda: supabase.table("student_answers").select("question_id, selected_option_id").eq("attempt_id", attempt_id).execute())
    answers = {a["question_id"]: a["selected_option_id"] for a in (answers_resp.data or [])}
    
    formatted_questions = []
    for row in questions_data:
        q = row.get("questions")
        if not q: continue
        opts = q.get("question_options", [])
        opts.sort(key=lambda x: x.get("order_num", 0))
        
        formatted_questions.append({
            "question_id": q["question_id"],
            "content": q["content"],
            "options": [{"option_id": o["option_id"], "option_text": o["option_text"]} for o in opts],
            "order_num": row["order_num"],
            "selected_option_id": answers.get(q["question_id"])
        })
        
    return {
        "attempt_id": attempt_id,
        "practice_set_id": ps_id,
        "status": attempt["status"],
        "questions": formatted_questions
    }

async def get_practice_attempts(page: int, limit: int) -> dict:
    items, total = await list_practice_attempts(page=page, limit=limit)
    total_pages = ceil(total / limit) if total > 0 else 1
    return {"items": items, "pagination": {"page": page, "limit": limit, "total": total, "total_pages": total_pages}}


async def update_practice_attempt(record_id: int, payload: PracticeAttemptUpdateRequest) -> dict:
    existing = await find_practice_attempt_by_id(record_id)
    if not existing:
        raise ValueError("PracticeAttempt not found")
    update_payload = payload.model_dump(exclude_none=True)
    if not update_payload:
        raise ValueError("No fields to update")
    updated = await update_practice_attempt_by_id(record_id, update_payload)
    if not updated:
        raise ValueError("PracticeAttempt not found")
    return updated


async def delete_practice_attempt(record_id: int) -> dict:
    existing = await find_practice_attempt_by_id(record_id)
    if not existing:
        raise ValueError("PracticeAttempt not found")
    deleted = await soft_delete_practice_attempt_by_id(record_id)
    if not deleted:
        raise ValueError("PracticeAttempt not found")
    return {"attempt_id": record_id, "deleted": True}
