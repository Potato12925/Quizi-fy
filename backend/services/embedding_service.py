import asyncio
from typing import Final

from openai import OpenAI

from core.config import Config


MODEL_DIMENSIONS: Final[dict[str, int]] = {
    "text-embedding-3-small": 1536,
}


class EmbeddingServiceError(ValueError):
    pass


def get_configured_embedding_dimension() -> int:
    model = Config.OPENAI_EMBEDDING_MODEL.strip()
    if model not in MODEL_DIMENSIONS:
        raise EmbeddingServiceError(f"Unsupported embedding model: {model}")
    model_dimension = MODEL_DIMENSIONS[model]
    if model_dimension != Config.DOCUMENT_CHUNK_EMBEDDING_DIMENSION:
        raise EmbeddingServiceError(
            "Embedding model dimension does not match document_chunks.embedding column dimension"
        )
    return model_dimension


async def generate_text_embeddings(texts: list[str]) -> list[list[float]]:
    normalized_texts = [text.strip() for text in texts if text and text.strip()]
    if not normalized_texts:
        return []
    if not Config.OPENAI_API_KEY:
        raise EmbeddingServiceError("Missing AI API key")

    expected_dimension = get_configured_embedding_dimension()
    client = OpenAI(api_key=Config.OPENAI_API_KEY)

    def _create_embeddings():
        return client.embeddings.create(
            model=Config.OPENAI_EMBEDDING_MODEL,
            input=normalized_texts,
        )

    try:
        response = await asyncio.to_thread(_create_embeddings)
    except Exception as exc:
        raise EmbeddingServiceError("Embedding request failed") from exc

    data = getattr(response, "data", None) or []
    if len(data) != len(normalized_texts):
        raise EmbeddingServiceError("Embedding response count mismatch")

    embeddings: list[list[float]] = []
    for item in data:
        embedding = list(getattr(item, "embedding", None) or [])
        if len(embedding) != expected_dimension:
            raise EmbeddingServiceError("Embedding response dimension mismatch")
        embeddings.append([float(value) for value in embedding])
    return embeddings


async def generate_text_embedding(text: str) -> list[float]:
    embeddings = await generate_text_embeddings([text])
    if not embeddings:
        raise EmbeddingServiceError("Embedding response is empty")
    return embeddings[0]


def serialize_embedding_for_pgvector(embedding: list[float]) -> str:
    expected_dimension = get_configured_embedding_dimension()
    if len(embedding) != expected_dimension:
        raise EmbeddingServiceError("Embedding dimension mismatch before pgvector serialization")
    serialized_values = ",".join(f"{float(value):.12g}" for value in embedding)
    return f"[{serialized_values}]"
