
import asyncio
from datetime import datetime, timezone
from core.supabase import SupabaseManager
from schemas.student_ai_chat_message_schema import Student_Ai_Chat_Message_Create

SELECT_FIELDS = "id,student_id,role,content,tools_used,cached,created_at,deleted_at"


async def create_chat_message_record(payload: Student_Ai_Chat_Message_Create) -> dict:
    """Create a single chat message record."""
    client = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: client.table("student_ai_chat_messages").insert(payload).execute()
    )
    rows = response.data or []
    if not rows:
        raise ValueError("Unable to create chat message record")
    return rows[0]


async def find_chat_messages_by_student(student_id: int, limit: int, offset: int) -> list[dict]:
    """Find chat messages by student."""
    client = SupabaseManager.get_client()
    start_index = offset
    end_index = offset + limit - 1

    response = await asyncio.to_thread(
        lambda: client.table("student_ai_chat_messages")
        .select(SELECT_FIELDS)
        .eq("student_id", student_id)
        .is_("deleted_at",None)
        .order("created_at", desc=True)
        .range(start_index, end_index)
        .execute()
    )
    rows = response.data or []
    return rows if rows else []

async def soft_delete_chat_messages_by_student(student_id: int) -> dict:
    """Soft delete chat messages by student."""
    client = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: client.table("student_ai_chat_messages")
        .update({"deleted_at": datetime.now(timezone.utc).isoformat()})
        .eq("student_id", student_id)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None    

async def count_chat_messages_by_student(student_id: int) -> int:
    """Count chat messages by student."""
    client = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: client.table("student_ai_chat_messages")
        .select(SELECT_FIELDS, count="exact", head=True)
        .eq("student_id", student_id)
        .is_("deleted_at", None)
        .execute()
    )
    return response.count or 0
    
