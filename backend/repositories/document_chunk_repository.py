import asyncio
from datetime import datetime, timezone

from core.supabase import SupabaseManager
from utils.document_chunking_util import serialize_chunk_payload


SELECT_FIELDS = (
    "chunk_id,document_id,chunk_index,chunk_title,chunk_text,chunk_hash,start_char,end_char,"
    "page_from,page_to,token_count,created_at,deleted_at"
)
SELECT_FIELDS_WITH_EMBEDDING = f"{SELECT_FIELDS},embedding"


async def list_document_chunks(
    document_id: int,
    include_deleted: bool = False,
    include_embedding: bool = False,
) -> list[dict]:
    supabase = SupabaseManager.get_client()
    query = (
        supabase.table("document_chunks")
        .select(SELECT_FIELDS_WITH_EMBEDDING if include_embedding else SELECT_FIELDS)
        .eq("document_id", document_id)
        .order("chunk_index")
    )
    if not include_deleted:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.execute())
    return response.data or []


async def create_document_chunks(document_id: int, chunks: list[object]) -> list[dict]:
    if not chunks:
        return []

    supabase = SupabaseManager.get_client()
    payload = [{**serialize_chunk_payload(chunk), "document_id": document_id} for chunk in chunks]
    response = await asyncio.to_thread(
        lambda: supabase.table("document_chunks").insert(payload).execute()
    )
    return response.data or []


async def soft_delete_document_chunks_by_document_id(document_id: int) -> int:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("document_chunks")
        .update({"deleted_at": datetime.now(timezone.utc).isoformat()})
        .eq("document_id", document_id)
        .is_("deleted_at", None)
        .execute()
    )
    return len(response.data or [])


async def list_chunks_by_ids(
    chunk_ids: list[int],
    include_deleted: bool = True,
    include_embedding: bool = False,
) -> list[dict]:
    if not chunk_ids:
        return []
    supabase = SupabaseManager.get_client()
    query = (
        supabase.table("document_chunks")
        .select(SELECT_FIELDS_WITH_EMBEDDING if include_embedding else SELECT_FIELDS)
        .in_("chunk_id", chunk_ids)
        .order("chunk_index")
    )
    if not include_deleted:
        query = query.is_("deleted_at", None)
    response = await asyncio.to_thread(lambda: query.execute())
    return response.data or []


async def list_document_chunks_missing_embeddings(document_id: int) -> list[dict]:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("document_chunks")
        .select(SELECT_FIELDS)
        .eq("document_id", document_id)
        .is_("deleted_at", None)
        .is_("embedding", None)
        .order("chunk_index")
        .execute()
    )
    return response.data or []


async def update_document_chunk_embedding(chunk_id: int, embedding_literal: str) -> dict | None:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.table("document_chunks")
        .update({"embedding": embedding_literal})
        .eq("chunk_id", chunk_id)
        .is_("deleted_at", None)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


async def list_relevant_document_chunks_by_embedding_rpc(
    document_id: int,
    query_embedding_literal: str,
    limit: int = 12,
) -> list[dict]:
    supabase = SupabaseManager.get_client()
    response = await asyncio.to_thread(
        lambda: supabase.rpc(
            "match_document_chunks",
            {
                "p_document_id": document_id,
                "p_query_embedding": query_embedding_literal,
                "p_limit": limit,
            },
        ).execute()
    )
    rows = response.data or []
    for row in rows:
        similarity_score = row.pop("similarity_score", None)
        row["relevance_score"] = float(similarity_score) if similarity_score is not None else None
    return rows
