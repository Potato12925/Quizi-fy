import logging
import re
from typing import Literal

from repositories.document_chunk_repository import (
    list_document_chunks,
    list_document_chunks_missing_embeddings,
    list_relevant_document_chunks_by_embedding_rpc,
    update_document_chunk_embedding,
)
from services.embedding_service import (
    EmbeddingServiceError,
    generate_text_embedding,
    generate_text_embeddings,
    serialize_embedding_for_pgvector,
)
from utils.document_chunking_util import extract_keywords, means_whole_document, normalize_search_text

logger = logging.getLogger(__name__)

RetrievalMode = Literal["whole_document", "embedding", "keyword_fallback"]


async def backfill_document_chunk_embeddings(document_id: int) -> int:
    missing_chunks = await list_document_chunks_missing_embeddings(document_id=document_id)
    if not missing_chunks:
        return 0

    embeddings = await generate_text_embeddings([str(chunk.get("chunk_text") or "") for chunk in missing_chunks])
    updated_count = 0
    for chunk, embedding in zip(missing_chunks, embeddings, strict=False):
        if chunk.get("chunk_id") is None:
            continue
        await update_document_chunk_embedding(
            chunk_id=int(chunk["chunk_id"]),
            embedding_literal=serialize_embedding_for_pgvector(embedding),
        )
        updated_count += 1
    return updated_count


async def select_relevant_document_chunks(
    *,
    document_id: int,
    content_scope: str | None,
    limit: int = 12,
) -> dict:
    active_chunks = await list_document_chunks(document_id=document_id, include_deleted=False)
    if not active_chunks:
        return {
            "chunks": [],
            "retrieval_mode": "keyword_fallback",
            "fallback_reason": "no_active_chunks",
        }

    if means_whole_document(content_scope):
        return {
            "chunks": [{**chunk, "relevance_score": 1.0} for chunk in active_chunks[: max(limit, len(active_chunks))]],
            "retrieval_mode": "whole_document",
            "fallback_reason": None,
        }

    missing_embeddings = await list_document_chunks_missing_embeddings(document_id=document_id)
    if missing_embeddings:
        try:
            await backfill_document_chunk_embeddings(document_id=document_id)
        except EmbeddingServiceError as exc:
            logger.warning(
                "Chunk embedding backfill failed; using keyword fallback | document_id=%s | error=%s",
                document_id,
                str(exc),
            )
            keyword_chunks = _rank_chunks_by_keyword(active_chunks, content_scope=content_scope, limit=limit)
            return {
                "chunks": keyword_chunks,
                "retrieval_mode": "keyword_fallback",
                "fallback_reason": "chunk_embedding_backfill_failed",
            }

    try:
        query_embedding = await generate_text_embedding(content_scope or "")
        vector_chunks = await list_relevant_document_chunks_by_embedding_rpc(
            document_id=document_id,
            query_embedding_literal=serialize_embedding_for_pgvector(query_embedding),
            limit=limit,
        )
    except Exception as exc:
        logger.warning(
            "Embedding retrieval failed; using keyword fallback | document_id=%s | error=%s",
            document_id,
            str(exc),
        )
        keyword_chunks = _rank_chunks_by_keyword(active_chunks, content_scope=content_scope, limit=limit)
        return {
            "chunks": keyword_chunks,
            "retrieval_mode": "keyword_fallback",
            "fallback_reason": "embedding_query_failed",
        }

    if not vector_chunks:
        keyword_chunks = _rank_chunks_by_keyword(active_chunks, content_scope=content_scope, limit=limit)
        return {
            "chunks": keyword_chunks,
            "retrieval_mode": "keyword_fallback",
            "fallback_reason": "embedding_query_empty",
        }

    reranked_chunks = _apply_page_range_rerank(vector_chunks, content_scope=content_scope)
    return {
        "chunks": reranked_chunks[:limit],
        "retrieval_mode": "embedding",
        "fallback_reason": None,
    }


def _rank_chunks_by_keyword(chunks: list[dict], *, content_scope: str | None, limit: int) -> list[dict]:
    normalized_scope = normalize_search_text(content_scope)
    scope_keywords = extract_keywords(content_scope)
    page_range = _extract_page_range(normalized_scope)
    ranked: list[dict] = []

    for chunk in chunks:
        normalized_title = normalize_search_text(chunk.get("chunk_title"))
        normalized_text = normalize_search_text(chunk.get("chunk_text"))
        score = 0.0

        if normalized_scope:
            if normalized_title and normalized_scope in normalized_title:
                score += 8.0
            if normalized_scope in normalized_text:
                score += 5.0

        if scope_keywords:
            title_overlap = sum(1 for keyword in scope_keywords if normalized_title and keyword in normalized_title)
            text_overlap = sum(1 for keyword in scope_keywords if keyword in normalized_text)
            score += title_overlap * 2.0
            score += min(text_overlap, 8) * 1.0

        if page_range is not None:
            score += _page_range_bonus(chunk, page_range)

        ranked.append({**chunk, "relevance_score": score})

    ranked.sort(key=lambda item: (-float(item.get("relevance_score") or 0), int(item.get("chunk_index") or 0)))
    strong_matches = [item for item in ranked if float(item.get("relevance_score") or 0) > 0]
    if strong_matches:
        return strong_matches[:limit]
    return ranked[:limit] if ranked else []


def _apply_page_range_rerank(chunks: list[dict], *, content_scope: str | None) -> list[dict]:
    normalized_scope = normalize_search_text(content_scope)
    page_range = _extract_page_range(normalized_scope)
    if page_range is None:
        return sorted(
            chunks,
            key=lambda item: (-float(item.get("relevance_score") or 0), int(item.get("chunk_index") or 0)),
        )

    reranked = []
    for chunk in chunks:
        reranked.append(
            {
                **chunk,
                "relevance_score": float(chunk.get("relevance_score") or 0) + _page_range_bonus(chunk, page_range),
            }
        )
    reranked.sort(key=lambda item: (-float(item.get("relevance_score") or 0), int(item.get("chunk_index") or 0)))
    return reranked


def _page_range_bonus(chunk: dict, page_range: tuple[int, int]) -> float:
    chunk_from = chunk.get("page_from")
    chunk_to = chunk.get("page_to")
    if chunk_from is None or chunk_to is None:
        return 0.0
    if _ranges_overlap(page_range, (int(chunk_from), int(chunk_to))):
        return 6.0
    return 0.0


def _extract_page_range(normalized_scope: str) -> tuple[int, int] | None:
    if not normalized_scope:
        return None
    match = (
        re.search(r"\b(?:trang|page|pages)\s+(\d+)\s*(?:-|den|to)\s*(\d+)\b", normalized_scope)
        or re.search(r"\b(?:trang|page)\s+(\d+)\b", normalized_scope)
    )
    if not match:
        return None
    if len(match.groups()) == 1 or match.group(2) is None:
        page = int(match.group(1))
        return page, page
    start_page = int(match.group(1))
    end_page = int(match.group(2))
    return min(start_page, end_page), max(start_page, end_page)


def _ranges_overlap(left: tuple[int, int], right: tuple[int, int]) -> bool:
    return left[0] <= right[1] and right[0] <= left[1]
