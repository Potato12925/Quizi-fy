import asyncio
import uuid

from core.config import Config
from core.supabase import SupabaseManager


async def _upload_file_to_bucket(
    bucket_name: str,
    object_path: str,
    file_bytes: bytes,
) -> str:
    supabase = SupabaseManager.get_client()
    await asyncio.to_thread(
        lambda: supabase.storage.from_(bucket_name).upload(
            path=object_path,
            file=file_bytes,
            file_options={"upsert": "false"},
        )
    )
    return supabase.storage.from_(bucket_name).get_public_url(object_path)


async def upload_document_file(
    teacher_id: int,
    subject_id: int,
    file_name: str,
    file_bytes: bytes,
) -> str:
    bucket_name = Config.SUPABASE_DOCUMENT_BUCKET
    object_path = f"teacher-{teacher_id}/subject-{subject_id}/{uuid.uuid4()}-{file_name}"
    return await _upload_file_to_bucket(bucket_name, object_path, file_bytes)


async def upload_question_image_file(
    teacher_id: int,
    file_name: str,
    file_bytes: bytes,
) -> str:
    bucket_name = Config.SUPABASE_IMAGE_BUCKET
    object_path = f"teacher-{teacher_id}/questions/{uuid.uuid4()}-{file_name}"
    return await _upload_file_to_bucket(bucket_name, object_path, file_bytes)
