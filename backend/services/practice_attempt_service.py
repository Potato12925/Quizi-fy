import asyncio
import os
from math import ceil
from datetime import datetime, timezone, timedelta
from fpdf import FPDF
from core.supabase import SupabaseManager
from repositories.practice_attempt_repository import (
    create_practice_attempt_record,
    find_practice_attempt_by_id,
    list_practice_attempts,
    soft_delete_practice_attempt_by_id,
    update_practice_attempt_by_id,
    get_attempt_result_details,
    find_submitted_attempts_by_practice_set_ids,
    find_all_student_history,
)
from repositories.practice_set_repository import find_practice_sets_with_subjects_by_student
from repositories.user_repository import find_user_by_id
from schemas.practice_attempt_schema import PracticeAttemptCreateRequest, PracticeAttemptUpdateRequest, PracticeAttemptStartRequest
from schemas.student_answer_schema import StudentAnswerSaveRequest
from utils.question_image_util import build_image_info, load_question_image_map


async def create_practice_attempt(payload: PracticeAttemptCreateRequest) -> dict:
    return await create_practice_attempt_record({ "practice_set_id": payload.practice_set_id, "total_correct": payload.total_correct, "total_wrong": payload.total_wrong, "status": payload.status })


async def get_practice_attempt_by_id(record_id: int) -> dict:
    data = await find_practice_attempt_by_id(record_id)
    if not data:
        raise ValueError("PracticeAttempt not found")
    return data


async def validate_attempt_ownership(attempt_id: int, student_id: int) -> dict:
    attempt = await find_practice_attempt_by_id(attempt_id)
    if not attempt:
        raise ValueError("PracticeAttempt not found")
        
    supabase = SupabaseManager.get_client()
    ps_resp = await asyncio.to_thread(
        lambda: supabase.table("practice_sets")
        .select("student_id")
        .eq("practice_set_id", attempt["practice_set_id"])
        .execute()
    )
    if not ps_resp.data:
        raise ValueError("PracticeSet not found")
        
    if ps_resp.data[0]["student_id"] != student_id:
        raise ValueError("Access denied")
        
    return attempt


async def start_attempt(payload: PracticeAttemptStartRequest, student_id: int) -> dict:
    supabase = SupabaseManager.get_client()
    ps_resp = await asyncio.to_thread(
        lambda: supabase.table("practice_sets")
        .select("student_id")
        .eq("practice_set_id", payload.practice_set_id)
        .execute()
    )
    if not ps_resp.data:
        raise ValueError("PracticeSet not found")
        
    if ps_resp.data[0]["student_id"] != student_id:
        raise ValueError("Access denied")

    return await create_practice_attempt_record({
        "practice_set_id": payload.practice_set_id,
        "status": "in_progress",
        "started_at": datetime.now(timezone.utc).isoformat()
    })


async def autosave_answers(attempt_id: int, payload: StudentAnswerSaveRequest, student_id: int) -> list[dict]:
    attempt = await validate_attempt_ownership(attempt_id, student_id)
    if attempt["status"] != "in_progress":
        raise ValueError("Practice attempt is not in progress")

    answered_at = datetime.now(timezone.utc).isoformat()
    payloads = [
        {
            "attempt_id": attempt_id,
            "question_id": ans.question_id,
            "selected_option_id": ans.selected_option_id,
            "answered_at": answered_at
        }
        for ans in payload.answers
    ]
    from repositories.student_answer_repository import upsert_student_answers
    return await upsert_student_answers(payloads)


async def submit_attempt(attempt_id: int, student_id: int) -> dict:
    attempt = await validate_attempt_ownership(attempt_id, student_id)
    if attempt["status"] != "in_progress":
        raise ValueError("Practice attempt is already completed")

    supabase = SupabaseManager.get_client()
    
    # 1. Fetch practice set questions to grade
    ps_questions_resp = await asyncio.to_thread(
        lambda: supabase.table("practice_set_questions")
        .select("question_id")
        .eq("practice_set_id", attempt["practice_set_id"])
        .execute()
    )
    ps_question_ids = [row["question_id"] for row in (ps_questions_resp.data or [])]
    
    correct_options = {}
    if ps_question_ids:
        correct_options_resp = await asyncio.to_thread(
            lambda: supabase.table("question_options")
            .select("question_id, option_id")
            .in_("question_id", ps_question_ids)
            .eq("is_correct", True)
            .execute()
        )
        correct_options = {opt["question_id"]: opt["option_id"] for opt in (correct_options_resp.data or [])}
        
    # 2. Fetch student answers
    answers_resp = await asyncio.to_thread(
        lambda: supabase.table("student_answers")
        .select("*")
        .eq("attempt_id", attempt_id)
        .is_("deleted_at", None)
        .execute()
    )
    answers_by_qid = {ans["question_id"]: ans for ans in (answers_resp.data or [])}
    
    total_correct = 0
    total_wrong = 0
    to_update = []
    to_insert = []
    
    for qid in ps_question_ids:
        ans = answers_by_qid.get(qid)
        selected_option_id = ans["selected_option_id"] if ans else None
        
        is_correct = False
        if selected_option_id and selected_option_id == correct_options.get(qid):
            is_correct = True
            total_correct += 1
        else:
            total_wrong += 1
            
        payload_item = {
            "attempt_id": attempt_id,
            "question_id": qid,
            "selected_option_id": selected_option_id,
            "is_correct": is_correct
        }
        if ans:
            payload_item["answer_id"] = ans["answer_id"]
            to_update.append(payload_item)
        else:
            to_insert.append(payload_item)
            
    if to_update:
        await asyncio.to_thread(
            lambda: supabase.table("student_answers")
            .upsert(to_update, on_conflict="attempt_id,question_id")
            .execute()
        )
    if to_insert:
        await asyncio.to_thread(
            lambda: supabase.table("student_answers")
            .insert(to_insert)
            .execute()
        )
        
    # 3. Check time limit timeout enforcement
    ps_resp = await asyncio.to_thread(
        lambda: supabase.table("practice_sets")
        .select("time_limit_minutes")
        .eq("practice_set_id", attempt["practice_set_id"])
        .is_("deleted_at", None)
        .execute()
    )
    time_limit_minutes = None
    if ps_resp.data:
        time_limit_minutes = ps_resp.data[0].get("time_limit_minutes")
        
    status = "submitted"
    if time_limit_minutes:
        started_str = attempt.get("started_at")
        if started_str:
            if started_str.endswith("Z"):
                started_str = started_str[:-1] + "+00:00"
            started_dt = datetime.fromisoformat(started_str)
            if started_dt.tzinfo is None:
                started_dt = started_dt.replace(tzinfo=timezone.utc)
            
            elapsed_seconds = (datetime.now(timezone.utc) - started_dt).total_seconds()
            if elapsed_seconds > (time_limit_minutes * 60 + 60):  # 60s grace period
                status = "timeout"
                
    num_q = len(ps_question_ids)
    if num_q == 0:
        num_q = 1
        
    score = (total_correct / num_q) * 10.0
    
    updated_attempt = await update_practice_attempt_by_id(attempt_id, {
        "status": status,
        "submitted_at": datetime.now(timezone.utc).isoformat(),
        "total_correct": total_correct,
        "total_wrong": total_wrong,
        "score": score
    })
    return updated_attempt


async def get_attempt_result(attempt_id: int, student_id: int) -> dict:
    attempt = await validate_attempt_ownership(attempt_id, student_id)
    if attempt["status"] == "in_progress":
        raise ValueError("Practice attempt is not completed yet")
        
    details = await get_attempt_result_details(attempt_id)
    if not details:
        raise ValueError("PracticeAttempt not found")
        
    supabase = SupabaseManager.get_client()
    
    # Fetch practice set questions to get order_num
    psq_resp = await asyncio.to_thread(
        lambda: supabase.table("practice_set_questions")
        .select("question_id, order_num")
        .eq("practice_set_id", attempt["practice_set_id"])
        .execute()
    )
    order_map = {row["question_id"]: row["order_num"] for row in (psq_resp.data or [])}
    
    answers = details.get("answers", [])
    question_rows = [ans.get("questions") for ans in answers if ans.get("questions")]
    image_by_id = await load_question_image_map(question_rows)
    formatted_questions = []
    
    for ans in answers:
        q = ans.get("questions")
        if not q:
            continue
        opts = q.get("question_options", [])
        opts = sorted(opts, key=lambda x: x.get("order_num", 0))
        image_id = int(q["image_id"]) if q.get("image_id") is not None else None
        
        formatted_questions.append({
            "question_id": q["question_id"],
            "content": q["content"],
            "explanation": q["explanation"],
            "image_id": image_id,
            "image": build_image_info(image_by_id.get(image_id)) if image_id is not None else None,
            "selected_option_id": ans["selected_option_id"],
            "is_correct": ans["is_correct"],
            "options": [
                {
                    "option_id": o["option_id"],
                    "option_text": o["option_text"],
                    "is_correct": o["is_correct"]
                }
                for o in opts
            ],
            "order_num": order_map.get(q["question_id"], 999)
        })
        
    formatted_questions.sort(key=lambda x: x["order_num"])
        
    return {
        "attempt": details["attempt"],
        "questions": formatted_questions
    }


async def get_my_history(student_id: int) -> list[dict]:
    return await find_all_student_history(student_id)


async def get_attempt_questions(attempt_id: int, student_id: int) -> dict:
    attempt = await validate_attempt_ownership(attempt_id, student_id)
    
    supabase = SupabaseManager.get_client()
    
    ps_id = attempt["practice_set_id"]
    psq_resp = await asyncio.to_thread(lambda: supabase.table("practice_set_questions")
        .select("order_num, questions(question_id,content,image_id,question_options(option_id, option_text, order_num))")
        .eq("practice_set_id", ps_id)
        .order("order_num")
        .execute()
    )
    questions_data = psq_resp.data or []
    question_rows = [row.get("questions") for row in questions_data if row.get("questions")]
    image_by_id = await load_question_image_map(question_rows)
    
    answers_resp = await asyncio.to_thread(
        lambda: supabase.table("student_answers")
        .select("question_id, selected_option_id")
        .eq("attempt_id", attempt_id)
        .is_("deleted_at", None)
        .execute()
    )
    answers = {a["question_id"]: a["selected_option_id"] for a in (answers_resp.data or [])}
    
    formatted_questions = []
    for row in questions_data:
        q = row.get("questions")
        if not q: continue
        opts = q.get("question_options", [])
        opts.sort(key=lambda x: x.get("order_num", 0))
        image_id = int(q["image_id"]) if q.get("image_id") is not None else None
        
        formatted_questions.append({
            "question_id": q["question_id"],
            "content": q["content"],
            "image_id": image_id,
            "image": build_image_info(image_by_id.get(image_id)) if image_id is not None else None,
            "options": [{"option_id": o["option_id"], "option_text": o["option_text"]} for o in opts],
            "order_num": row["order_num"],
            "selected_option_id": answers.get(q["question_id"])
        })
        
    # Fetch practice set details to get correct duration
    ps_resp = await asyncio.to_thread(
        lambda: supabase.table("practice_sets")
        .select("time_limit_minutes")
        .eq("practice_set_id", ps_id)
        .limit(1)
        .execute()
    )
    practice_set = ps_resp.data[0] if ps_resp.data else {}
    time_limit_minutes = practice_set.get("time_limit_minutes") or 20

    return {
        "attempt_id": attempt_id,
        "practice_set_id": ps_id,
        "status": attempt["status"],
        "started_at": attempt.get("started_at"),
        "duration_seconds": int(time_limit_minutes) * 60,
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


async def get_student_progress_stats(student_id: int) -> dict:
    ps_data = await find_practice_sets_with_subjects_by_student(student_id)
    if not ps_data:
        return {
            "stats": {
                "avgScore": 0.0,
                "totalAttempts": 0,
                "totalQuestions": 0,
                "timeStudied": "0h 0m",
                "accuracy": 0,
                "streak": 0
            },
            "subjectPerformance": []
        }
        
    ps_ids = [ps["practice_set_id"] for ps in ps_data]
    ps_subject_map = {
        ps["practice_set_id"]: ps["subjects"]["subject_name"] if ps.get("subjects") else "Môn học khác"
        for ps in ps_data
    }
    
    attempts = await find_submitted_attempts_by_practice_set_ids(ps_ids)
    if not attempts:
        return {
            "stats": {
                "avgScore": 0.0,
                "totalAttempts": 0,
                "totalQuestions": 0,
                "timeStudied": "0h 0m",
                "accuracy": 0,
                "streak": 0
            },
            "subjectPerformance": []
        }
        
    total_attempts = len(attempts)
    avg_score = round(sum(float(att["score"] or 0) for att in attempts) / total_attempts, 1)
    
    total_correct = sum(att["total_correct"] or 0 for att in attempts)
    total_wrong = sum(att["total_wrong"] or 0 for att in attempts)
    total_questions = total_correct + total_wrong
    accuracy = round((total_correct / total_questions) * 100) if total_questions > 0 else 0
    
    # Calculate study time
    total_seconds = 0
    for att in attempts:
        started = att.get("started_at")
        submitted = att.get("submitted_at")
        if started and submitted:
            try:
                # Replace 'Z' suffix with '+00:00' to support older python versions safely
                s_str = started[:-1] + '+00:00' if started.endswith('Z') else started
                e_str = submitted[:-1] + '+00:00' if submitted.endswith('Z') else submitted
                dt_start = datetime.fromisoformat(s_str)
                dt_end = datetime.fromisoformat(e_str)
                duration = (dt_end - dt_start).total_seconds()
                if duration > 0:
                    total_seconds += duration
            except Exception:
                pass
                
    hours = int(total_seconds // 3600)
    minutes = int((total_seconds % 3600) // 60)
    time_studied = f"{hours}h {minutes}m"
    
    # Calculate streak (relative to Vietnam timezone UTC+7)
    vn_tz = timezone(timedelta(hours=7))
    attempt_dates = []
    for att in attempts:
        started = att.get("started_at")
        if started:
            try:
                s_str = started[:-1] + '+00:00' if started.endswith('Z') else started
                dt = datetime.fromisoformat(s_str)
                dt_local = dt.astimezone(vn_tz)
                attempt_dates.append(dt_local.date())
            except Exception:
                pass
                
    streak = 0
    if attempt_dates:
        unique_dates = sorted(list(set(attempt_dates)), reverse=True)
        local_today = datetime.now(vn_tz).date()
        
        # Check if the most recent practice was today or yesterday
        if unique_dates[0] == local_today or unique_dates[0] == (local_today - timedelta(days=1)):
            streak = 1
            current_date = unique_dates[0]
            for next_date in unique_dates[1:]:
                if current_date - next_date == timedelta(days=1):
                    streak += 1
                    current_date = next_date
                elif current_date - next_date > timedelta(days=1):
                    break
    
    # Subject performance grouping
    subject_groups = {}
    for att in attempts:
        subj_name = ps_subject_map.get(att["practice_set_id"], "Môn học khác")
        subject_groups.setdefault(subj_name, []).append(att)
        
    subject_performance = []
    colors = ["bg-[#b20112]", "bg-emerald-500", "bg-blue-500", "bg-amber-500", "bg-purple-500"]
    for idx, (subj_name, subj_attempts) in enumerate(subject_groups.items()):
        s_correct = sum(a["total_correct"] or 0 for a in subj_attempts)
        s_wrong = sum(a["total_wrong"] or 0 for a in subj_attempts)
        s_total = s_correct + s_wrong
        s_accuracy = round((s_correct / s_total) * 100) if s_total > 0 else 0
        subject_performance.append({
            "name": subj_name,
            "score": s_accuracy,
            "color": colors[idx % len(colors)]
        })
        
    return {
        "stats": {
            "avgScore": avg_score,
            "totalAttempts": total_attempts,
            "totalQuestions": total_questions,
            "timeStudied": time_studied,
            "accuracy": accuracy,
            "streak": streak
        },
        "subjectPerformance": subject_performance
    }


async def export_student_history_pdf(student_id: int) -> bytes:
    # 1. Fetch user profile via repository
    user_data = await find_user_by_id(student_id)
    if not user_data:
        user_data = {"full_name": "Học sinh", "username": "student"}
    
    # 2. Fetch history and progress
    history = await get_my_history(student_id)
    progress = await get_student_progress_stats(student_id)
    stats = progress.get("stats", {})
    
    # 3. Create PDF
    pdf = FPDF()
    pdf.add_page()
    
    # Load Arial font for Vietnamese support
    font_path = "C:\\Windows\\Fonts\\arial.ttf"
    font_bold_path = "C:\\Windows\\Fonts\\arialbd.ttf"
    if os.path.exists(font_path):
        pdf.add_font("Arial", "", font_path)
    else:
        pdf.add_font("Arial", "", style="")
        
    if os.path.exists(font_bold_path):
        pdf.add_font("Arial", "B", font_bold_path)
    else:
        pdf.add_font("Arial", "B", style="")
        
    # PDF Styles and Geometry
    pdf.set_margins(15, 15, 15)
    pdf.set_auto_page_break(auto=True, margin=15)
    
    # Header
    pdf.set_font("Arial", "B", 24)
    pdf.set_text_color(178, 1, 18) # brand red
    pdf.cell(100, 12, "QUIZI-FY", ln=0)
    
    pdf.set_font("Arial", "", 10)
    pdf.set_text_color(100, 116, 139) # slate gray
    current_date = datetime.now().strftime("%d/%m/%Y %H:%M")
    pdf.cell(80, 12, f"Ngày xuất: {current_date}", ln=1, align="R")
    
    pdf.set_font("Arial", "B", 14)
    pdf.set_text_color(15, 23, 42) # dark slate
    pdf.cell(180, 8, "BÁO CÁO KẾT QUẢ ÔN LUYỆN CÁ NHÂN", ln=1)
    
    pdf.set_font("Arial", "", 11)
    pdf.set_text_color(51, 65, 85)
    pdf.cell(180, 6, f"Học sinh: {user_data['full_name']} ({user_data['username']})", ln=1)
    
    pdf.ln(5)
    
    # Draw horizontal rule
    pdf.set_draw_color(226, 232, 240)
    pdf.line(15, pdf.get_y(), 195, pdf.get_y())
    pdf.ln(8)
    
    # Summary Metrics Card Box
    pdf.set_font("Arial", "B", 12)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(180, 6, "1. TIẾN ĐỘ HỌC TẬP TỔNG QUAN", ln=1)
    pdf.ln(3)
    
    # We will create a styled table/grid for the metrics
    pdf.set_fill_color(248, 250, 252) # Soft gray background
    pdf.set_draw_color(241, 245, 249)
    
    y_start = pdf.get_y()
    
    # Draw left & right card panels
    pdf.rect(15, y_start, 85, 32, style="DF")
    pdf.rect(110, y_start, 85, 32, style="DF")
    
    pdf.set_xy(18, y_start + 4)
    pdf.set_font("Arial", "", 10)
    pdf.set_text_color(100, 116, 139)
    pdf.cell(80, 5, "Tổng số đề đã luyện:", ln=1)
    pdf.set_x(18)
    pdf.set_font("Arial", "B", 14)
    pdf.set_text_color(178, 1, 18)
    pdf.cell(80, 8, f"{stats.get('totalAttempts', 0)} bộ đề", ln=1)
    
    pdf.set_xy(18, y_start + 18)
    pdf.set_font("Arial", "", 10)
    pdf.set_text_color(100, 116, 139)
    pdf.cell(80, 5, "Độ chính xác trung bình:", ln=1)
    pdf.set_x(18)
    pdf.set_font("Arial", "B", 14)
    pdf.set_text_color(16, 185, 129) # green
    pdf.cell(80, 8, f"{stats.get('accuracy', 0)}%", ln=1)
    
    # Right col text
    pdf.set_xy(113, y_start + 4)
    pdf.set_font("Arial", "", 10)
    pdf.set_text_color(100, 116, 139)
    pdf.cell(80, 5, "Điểm trung bình hệ số 10:", ln=1)
    pdf.set_x(113)
    pdf.set_font("Arial", "B", 14)
    pdf.set_text_color(245, 158, 11) # orange
    pdf.cell(80, 8, f"{stats.get('avgScore', 0.0)} / 10", ln=1)
    
    pdf.set_xy(113, y_start + 18)
    pdf.set_font("Arial", "", 10)
    pdf.set_text_color(100, 116, 139)
    pdf.cell(80, 5, "Tổng thời gian học:", ln=1)
    pdf.set_x(113)
    pdf.set_font("Arial", "B", 14)
    pdf.set_text_color(59, 130, 246) # blue
    pdf.cell(80, 8, f"{stats.get('timeStudied', '0h 0m')}", ln=1)
    
    pdf.set_xy(15, y_start + 38)
    
    # Detailed History Table
    pdf.set_font("Arial", "B", 12)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(180, 6, "2. LỊCH SỬ LUYỆN TẬP CHI TIẾT", ln=1)
    pdf.ln(3)
    
    # Table header
    pdf.set_fill_color(15, 23, 42) # dark slate header
    pdf.set_text_color(255, 255, 255) # white text
    pdf.set_font("Arial", "B", 9)
    
    pdf.cell(60, 8, " Môn Học", border=1, fill=True)
    pdf.cell(35, 8, " Ngày Làm", border=1, fill=True, align="C")
    pdf.cell(25, 8, " Số Câu Đúng", border=1, fill=True, align="C")
    pdf.cell(25, 8, " Điểm Số", border=1, fill=True, align="C")
    pdf.cell(35, 8, " Trạng Thế", border=1, fill=True, align="C")
    pdf.ln(8)
    
    # Table rows
    pdf.set_text_color(51, 65, 85)
    pdf.set_font("Arial", "", 9)
    pdf.set_draw_color(226, 232, 240)
    
    row_count = 0
    for att in history:
        # Alternate row backgrounds
        fill = row_count % 2 == 1
        pdf.set_fill_color(248, 250, 252) if fill else pdf.set_fill_color(255, 255, 255)
        
        subject_name = att.get("subject_name", "Môn học khác")
        date_str = "Unknown"
        started_at = att.get("started_at")
        if started_at:
            try:
                # Standard timezone offset parse
                s_str = started_at[:-1] + '+00:00' if started_at.endswith('Z') else started_at
                dt = datetime.fromisoformat(s_str)
                date_str = dt.strftime("%d/%m/%Y")
            except Exception:
                date_str = started_at[:10]
                
        correct = att.get("total_correct", 0) or 0
        wrong = att.get("total_wrong", 0) or 0
        total = correct + wrong
        score = att.get("score")
        score_str = f"{float(score):.2f}" if score is not None else "--"
        
        status = att.get("status", "in_progress")
        status_text = "Hoàn thành" if status == "submitted" else "Đang làm"
        
        pdf.cell(60, 8, f" {subject_name}", border=1, fill=fill)
        pdf.cell(35, 8, f"{date_str}", border=1, fill=fill, align="C")
        pdf.cell(25, 8, f"{correct}/{total}", border=1, fill=fill, align="C")
        pdf.cell(25, 8, f"{score_str}", border=1, fill=fill, align="C")
        pdf.cell(35, 8, f"{status_text}", border=1, fill=fill, align="C")
        pdf.ln(8)
        row_count += 1
        
    if not history:
        pdf.cell(180, 10, "Chưa có hoạt động làm bài nào.", border=1, align="C")
        
    return bytes(pdf.output())
