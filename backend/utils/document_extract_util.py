from dataclasses import dataclass
from io import BytesIO

import httpx
from docx import Document
from pypdf import PdfReader


class DocumentExtractError(ValueError):
    pass


@dataclass(slots=True)
class TextSegment:
    text: str
    start_char: int
    end_char: int
    page_number: int | None = None


@dataclass(slots=True)
class ExtractedDocumentText:
    text: str
    segments: list[TextSegment]


async def fetch_document_bytes(file_url: str) -> bytes:
    if not file_url:
        raise DocumentExtractError("Document URL is missing")

    async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
        response = await client.get(file_url)
        response.raise_for_status()
        return response.content


async def extract_document_content(file_url: str, file_type: str) -> ExtractedDocumentText:
    raw = await fetch_document_bytes(file_url)
    return extract_document_content_from_bytes(raw=raw, file_type=file_type)


async def extract_document_text(file_url: str, file_type: str) -> str:
    extracted = await extract_document_content(file_url=file_url, file_type=file_type)
    return extracted.text


def extract_document_content_from_bytes(raw: bytes, file_type: str) -> ExtractedDocumentText:
    normalized_type = (file_type or "").strip().lower()
    if normalized_type == "txt":
        return _extract_txt(raw)
    if normalized_type == "pdf":
        return _extract_pdf(raw)
    if normalized_type == "docx":
        return _extract_docx(raw)
    raise DocumentExtractError("Unsupported document type")


def _extract_txt(raw: bytes) -> ExtractedDocumentText:
    text = raw.decode("utf-8", errors="ignore").strip()
    if not text:
        raise DocumentExtractError("Document content is empty")
    return ExtractedDocumentText(
        text=text,
        segments=[TextSegment(text=text, start_char=0, end_char=len(text), page_number=1)],
    )


def _extract_pdf(raw: bytes) -> ExtractedDocumentText:
    reader = PdfReader(BytesIO(raw))
    parts: list[str] = []
    segments: list[TextSegment] = []
    cursor = 0
    for page_number, page in enumerate(reader.pages, start=1):
        text = (page.extract_text() or "").strip()
        if text:
            parts.append(text)
            start_char = cursor
            end_char = start_char + len(text)
            segments.append(
                TextSegment(
                    text=text,
                    start_char=start_char,
                    end_char=end_char,
                    page_number=page_number,
                )
            )
            cursor = end_char + 2
    merged = "\n\n".join(parts).strip()
    if not merged:
        raise DocumentExtractError("Unable to extract text from PDF")
    return ExtractedDocumentText(text=merged, segments=segments)


def _extract_docx(raw: bytes) -> ExtractedDocumentText:
    doc = Document(BytesIO(raw))
    parts: list[str] = []
    for paragraph in doc.paragraphs:
        text = paragraph.text.strip()
        if text:
            parts.append(text)
    merged = "\n\n".join(parts).strip()
    if not merged:
        raise DocumentExtractError("Unable to extract text from DOCX")
    return ExtractedDocumentText(
        text=merged,
        segments=[TextSegment(text=merged, start_char=0, end_char=len(merged), page_number=1)],
    )
