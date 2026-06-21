import asyncio
from core.supabase import SupabaseManager

async def check_user_active_assignments(user_id: int) -> bool:
    """Check if teacher is still assigned to any class or subject"""
    supabase = SupabaseManager.get_client()
    
    # Check if homeroom teacher
    class_resp = await asyncio.to_thread(
        lambda: supabase.table("classes").select("class_id").eq("teacher_id", user_id).is_("deleted_at", None).limit(1).execute()
    )
    if class_resp.data:
        return True
        
    # Check if subject teacher
    subject_resp = await asyncio.to_thread(
        lambda: supabase.table("class_subjects").select("class_subject_id").eq("assigned_teacher_id", user_id).in_("status", ["active"]).is_("deleted_at", None).limit(1).execute()
    )
    if subject_resp.data:
        return True
        
    return False

async def check_user_generated_data(user_id: int) -> bool:
    """Check if user has any generated data (documents, questions, or practice attempts)"""
    supabase = SupabaseManager.get_client()
    
    # Check documents
    doc_resp = await asyncio.to_thread(
        lambda: supabase.table("documents").select("document_id").eq("teacher_id", user_id).is_("deleted_at", None).limit(1).execute()
    )
    if doc_resp.data:
        return True
        
    # Check questions
    q_resp = await asyncio.to_thread(
        lambda: supabase.table("questions").select("question_id").eq("teacher_id", user_id).is_("deleted_at", None).limit(1).execute()
    )
    if q_resp.data:
        return True
        
    # Check practice sets
    ps_resp = await asyncio.to_thread(
        lambda: supabase.table("practice_sets").select("practice_set_id").eq("student_id", user_id).limit(1).execute()
    )
    if ps_resp.data:
        return True
        
    # Check student class enrollments
    enrollment_resp = await asyncio.to_thread(
        lambda: supabase.table("class_students").select("class_student_id").eq("student_id", user_id).is_("deleted_at", None).limit(1).execute()
    )
    if enrollment_resp.data:
        return True

    return False
