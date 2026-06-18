import asyncio

from core.supabase import SupabaseManager


IMAGE_SELECT_FIELDS = (
    "image_id,image_type_id,uploaded_by,file_name,file_url,file_size,mime_type,deleted_at,"
    "image_types(image_type_id,type_code,type_name)"
)


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
