from io import BytesIO

import httpx
from docx import Document
from pypdf import PdfReader


class DocumentExtractError(ValueError):
    pass


async def extract_document_text(file_url: str, file_type: str) -> str:
    if not file_url:
        raise DocumentExtractError("Document URL is missing")

    async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
        response = await client.get(file_url)
        response.raise_for_status()
        raw = response.content

    normalized_type = (file_type or "").strip().lower()
    if normalized_type == "txt":
        return _extract_txt(raw)
    if normalized_type == "pdf":
        return _extract_pdf(raw)
    if normalized_type == "docx":
        return _extract_docx(raw)
    raise DocumentExtractError("Unsupported document type")


def _extract_txt(raw: bytes) -> str:
    text = raw.decode("utf-8", errors="ignore").strip()
    if not text:
        raise DocumentExtractError("Document content is empty")
    return text


def _extract_pdf(raw: bytes) -> str:
    reader = PdfReader(BytesIO(raw))
    parts: list[str] = []
    for page in reader.pages:
        text = (page.extract_text() or "").strip()
        if text:
            parts.append(text)
    merged = "\n".join(parts).strip()
    if not merged:
        raise DocumentExtractError("Unable to extract text from PDF")
    return merged


def _extract_docx(raw: bytes) -> str:
    doc = Document(BytesIO(raw))
    parts: list[str] = []
    for paragraph in doc.paragraphs:
        text = paragraph.text.strip()
        if text:
            parts.append(text)
    merged = "\n".join(parts).strip()
    if not merged:
        raise DocumentExtractError("Unable to extract text from DOCX")
    return merged
