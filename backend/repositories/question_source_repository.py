import asyncio

from core.supabase import SupabaseManager


QUESTION_SOURCE_FIELDS = "question_source_id,question_id,chunk_id,relevance_score,created_at"
CHUNK_FIELDS = (
    "chunk_id,document_id,chunk_index,chunk_title,chunk_text,chunk_hash,start_char,end_char,"
    "page_from,page_to,token_count,created_at,deleted_at"
)


async def create_question_sources(
    question_id: int,
    chunk_ids: list[int],
    relevance_score_by_chunk_id: dict[int, float | int | None] | None = None,
) -> list[dict]:
    normalized_chunk_ids = list(dict.fromkeys(int(chunk_id) for chunk_id in chunk_ids if int(chunk_id) > 0))
    if not normalized_chunk_ids:
        return []

    supabase = SupabaseManager.get_client()
    payload = [
        {
            "question_id": question_id,
            "chunk_id": chunk_id,
            "relevance_score": _normalize_relevance_score((relevance_score_by_chunk_id or {}).get(chunk_id)),
        }
        for chunk_id in normalized_chunk_ids
    ]
    response = await asyncio.to_thread(lambda: supabase.table("question_sources").insert(payload).execute())
    return response.data or []


async def list_question_sources_by_question_ids(
    question_ids: list[int],
    include_chunk_details: bool = False,
) -> list[dict]:
    normalized_question_ids = list(dict.fromkeys(int(question_id) for question_id in question_ids if int(question_id) > 0))
    if not normalized_question_ids:
        return []

    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("question_sources")
        .select(QUESTION_SOURCE_FIELDS)
        .in_("question_id", normalized_question_ids)
        .order("question_source_id")
        .execute()
    )
    rows = response.data or []
    if not include_chunk_details or not rows:
        return rows

    chunk_ids = [int(row["chunk_id"]) for row in rows if row.get("chunk_id") is not None]
    if not chunk_ids:
        return rows

    chunk_response = await asyncio.to_thread(
        lambda: supabase.table("document_chunks")
        .select(CHUNK_FIELDS)
        .in_("chunk_id", chunk_ids)
        .execute()
    )
    chunk_by_id = {
        int(chunk["chunk_id"]): chunk
        for chunk in (chunk_response.data or [])
        if chunk.get("chunk_id") is not None
    }
    return [{**row, "document_chunks": chunk_by_id.get(int(row["chunk_id"]))} for row in rows if row.get("chunk_id") is not None]


def _normalize_relevance_score(value: float | int | None) -> float | None:
    if value is None:
        return None
    return float(value)
