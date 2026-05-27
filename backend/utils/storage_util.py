import asyncio
import uuid

from core.config import Config
from core.supabase import SupabaseManager


async def upload_document_file(
    teacher_id: int,
    subject_id: int,
    file_name: str,
    file_bytes: bytes,
) -> str:
    supabase = SupabaseManager.get_client()
    bucket_name = Config.SUPABASE_DOCUMENT_BUCKET
    object_path = f"teacher-{teacher_id}/subject-{subject_id}/{uuid.uuid4()}-{file_name}"

    await asyncio.to_thread(
        lambda: supabase.storage.from_(bucket_name).upload(
            path=object_path,
            file=file_bytes,
            file_options={"upsert": "false"},
        )
    )

    return supabase.storage.from_(bucket_name).get_public_url(object_path)
