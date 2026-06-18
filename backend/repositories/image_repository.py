import asyncio
from datetime import datetime, timezone

from core.supabase import SupabaseManager


IMAGE_SELECT_FIELDS = (
    "image_id,image_type_id,uploaded_by,file_name,file_url,file_hash,file_size,mime_type,deleted_at,"
    "created_at,image_types(image_type_id,type_code,type_name)"
)
QUESTION_IMAGE_TYPE_CODES = ("question_image", "question")


async def find_image_by_id(image_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("images")
        .select(IMAGE_SELECT_FIELDS)
        .eq("image_id", image_id)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


async def find_active_image_by_id(image_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("images")
        .select(IMAGE_SELECT_FIELDS)
        .eq("image_id", image_id)
        .is_("deleted_at", None)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


async def find_image_type_by_code(type_code: str) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("image_types")
        .select("image_type_id,type_code,type_name")
        .eq("type_code", type_code)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


async def find_image_type_by_id(image_type_id: int) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("image_types")
        .select("image_type_id,type_code,type_name")
        .eq("image_type_id", image_type_id)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


async def find_image_type_by_codes(type_codes: list[str]) -> dict | None:
    normalized_codes = [code.strip() for code in type_codes if code and code.strip()]
    if not normalized_codes:
        return None

    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("image_types")
        .select("image_type_id,type_code,type_name")
        .in_("type_code", normalized_codes)
        .execute()
    )
    rows = response.data or []
    by_code = {str(row.get("type_code") or ""): row for row in rows}
    for code in normalized_codes:
        matched = by_code.get(code)
        if matched:
            return matched
    return None


async def find_question_image_type() -> dict | None:
    return await find_image_type_by_codes(list(QUESTION_IMAGE_TYPE_CODES))


async def list_images_by_ids(image_ids: list[int]) -> list[dict]:
    if not image_ids:
        return []

    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("images")
        .select(IMAGE_SELECT_FIELDS)
        .in_("image_id", image_ids)
        .is_("deleted_at", None)
        .execute()
    )
    return response.data or []


async def create_image_record(payload: dict) -> dict:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(lambda: supabase.table("images").insert(payload).execute())
    rows = response.data or []
    if not rows:
        raise ValueError("Unable to create image")
    return rows[0]


async def list_images(
    *,
    page: int,
    limit: int,
    uploaded_by: int | None = None,
    image_type_id: int | None = None,
) -> tuple[list[dict], int]:
    supabase = SupabaseManager.get_client()
    start = (page - 1) * limit
    end = start + limit - 1

    def _execute():
        query = (
            supabase.table("images")
            .select(IMAGE_SELECT_FIELDS, count="exact")
            .is_("deleted_at", None)
            .order("image_id", desc=True)
        )
        if uploaded_by is not None:
            query = query.eq("uploaded_by", uploaded_by)
        if image_type_id is not None:
            query = query.eq("image_type_id", image_type_id)
        return query.range(start, end).execute()

    response = await asyncio.to_thread(_execute)
    return response.data or [], int(response.count or 0)


async def update_image_record(image_id: int, payload: dict) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("images")
        .update(payload)
        .eq("image_id", image_id)
        .is_("deleted_at", None)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


async def soft_delete_image_record(image_id: int) -> bool:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("images")
        .update({"deleted_at": datetime.now(timezone.utc).isoformat()})
        .eq("image_id", image_id)
        .is_("deleted_at", None)
        .execute()
    )
    return bool(response.data)
