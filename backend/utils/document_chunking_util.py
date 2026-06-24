import math
import re
import unicodedata
from dataclasses import asdict, dataclass, is_dataclass

from utils.document_extract_util import ExtractedDocumentText, TextSegment


SECTION_HEADING_PATTERNS = [
    re.compile(r"^\s*(chuong|chương|chapter|bai|bài|unit|lesson|topic|module)\b", re.IGNORECASE),
    re.compile(r"^\s*\d+(?:\.\d+){0,3}[\.\)]?\s+\S+"),
    re.compile(r"^\s*[IVXLCDM]{1,8}[\.\)]\s+\S+", re.IGNORECASE),
    re.compile(r"^\s*[A-Z][\.\)]\s+\S+"),
]

WHOLE_DOCUMENT_SCOPES = {
    "toan bo tai lieu",
    "toan bo file",
    "toan bo",
    "all",
    "whole document",
    "entire document",
    "full document",
}

DEFAULT_MAX_CHUNK_CHARS = 2400
DEFAULT_MIN_CHUNK_CHARS = 900
DEFAULT_OVERLAP_CHARS = 650


@dataclass(slots=True)
class ChunkPayload:
    chunk_index: int
    chunk_title: str | None
    chunk_text: str
    chunk_hash: str
    start_char: int | None
    end_char: int | None
    page_from: int | None
    page_to: int | None
    token_count: int | None


def serialize_chunk_payload(payload: object) -> dict:
    if isinstance(payload, dict):
        return payload

    model_dump = getattr(payload, "model_dump", None)
    if callable(model_dump):
        serialized = model_dump()
        if isinstance(serialized, dict):
            return serialized
        raise TypeError("Chunk payload model_dump() must return a dict")

    dict_method = getattr(payload, "dict", None)
    if callable(dict_method):
        serialized = dict_method()
        if isinstance(serialized, dict):
            return serialized
        raise TypeError("Chunk payload dict() must return a dict")

    if is_dataclass(payload):
        serialized = asdict(payload)
        if isinstance(serialized, dict):
            return serialized
        raise TypeError("Chunk payload dataclass serialization must return a dict")

    raise TypeError(
        f"Unsupported chunk payload type: {type(payload).__name__}. "
        "Expected a dict, Pydantic model, or dataclass."
    )


def build_document_chunks(
    extracted: ExtractedDocumentText,
    *,
    max_chunk_chars: int = DEFAULT_MAX_CHUNK_CHARS,
    min_chunk_chars: int = DEFAULT_MIN_CHUNK_CHARS,
    overlap_chars: int = DEFAULT_OVERLAP_CHARS,
) -> list[dict]:
    normalized_text = normalize_document_text(extracted.text)
    if not normalized_text:
        return []

    normalized_segments = _normalize_segments(extracted.segments)
    sections = _split_into_sections(normalized_text)
    chunks: list[ChunkPayload] = []
    chunk_index = 0

    for section in sections:
        section_title = section["title"]
        section_text = section["text"]
        section_start = int(section["start_char"])
        for part_start, part_end, chunk_text in _split_section_text(
            section_text=section_text,
            section_start=section_start,
            max_chunk_chars=max_chunk_chars,
            min_chunk_chars=min_chunk_chars,
            overlap_chars=overlap_chars,
        ):
            page_from, page_to = _resolve_page_range(normalized_segments, part_start, part_end)
            chunk_index += 1
            cleaned_text = chunk_text.strip()
            chunks.append(
                ChunkPayload(
                    chunk_index=chunk_index,
                    chunk_title=section_title,
                    chunk_text=cleaned_text,
                    chunk_hash=_stable_chunk_hash(cleaned_text),
                    start_char=part_start,
                    end_char=part_end,
                    page_from=page_from,
                    page_to=page_to,
                    token_count=max(1, math.ceil(len(cleaned_text) / 4)),
                )
            )

    return [serialize_chunk_payload(chunk) for chunk in chunks if chunk.chunk_text]


def normalize_document_text(text: str) -> str:
    text = (text or "").replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def normalize_search_text(value: str | None) -> str:
    text = unicodedata.normalize("NFKD", (value or "").strip().lower())
    text = "".join(char for char in text if not unicodedata.combining(char))
    text = re.sub(r"[^a-z0-9\s]+", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def means_whole_document(content_scope: str | None) -> bool:
    normalized_scope = normalize_search_text(content_scope)
    if not normalized_scope:
        return True
    return normalized_scope in WHOLE_DOCUMENT_SCOPES


def extract_keywords(value: str | None) -> list[str]:
    normalized = normalize_search_text(value)
    if not normalized:
        return []
    words = [word for word in normalized.split(" ") if len(word) >= 2]
    return list(dict.fromkeys(words))


def _normalize_segments(segments: list[TextSegment]) -> list[TextSegment]:
    normalized: list[TextSegment] = []
    current_start = 0
    for segment in segments:
        text = normalize_document_text(segment.text)
        if not text:
            continue
        segment_start = current_start
        segment_end = segment_start + len(text)
        normalized.append(
            TextSegment(
                text=text,
                start_char=segment_start,
                end_char=segment_end,
                page_number=segment.page_number,
            )
        )
        current_start = segment_end + 2
    return normalized


def _looks_like_heading(line: str) -> bool:
    candidate = (line or "").strip()
    if len(candidate) > 180 or len(candidate) < 2:
        return False
    return any(pattern.match(candidate) for pattern in SECTION_HEADING_PATTERNS)


def _split_into_sections(text: str) -> list[dict]:
    lines = text.split("\n")
    line_positions: list[tuple[str, int, int]] = []
    cursor = 0
    for line in lines:
        start = cursor
        end = start + len(line)
        line_positions.append((line, start, end))
        cursor = end + 1

    heading_indexes = [index for index, (line, _, _) in enumerate(line_positions) if _looks_like_heading(line)]
    sections: list[dict] = []

    if not heading_indexes:
        return _split_paragraph_sections(text, base_start=0, title=None)

    if heading_indexes[0] > 0:
        prelude_text = "\n".join(line for line, _, _ in line_positions[: heading_indexes[0]]).strip()
        if prelude_text:
            sections.extend(_split_paragraph_sections(prelude_text, base_start=0, title=None))

    for index, heading_idx in enumerate(heading_indexes):
        next_heading_idx = heading_indexes[index + 1] if index + 1 < len(heading_indexes) else len(line_positions)
        heading_line, heading_start, _ = line_positions[heading_idx]
        section_end = line_positions[next_heading_idx - 1][2] if next_heading_idx > heading_idx else heading_start
        section_text = text[heading_start:section_end].strip()
        if not section_text:
            continue
        sections.append(
            {
                "title": heading_line.strip() or None,
                "text": section_text,
                "start_char": heading_start,
            }
        )

    return sections or _split_paragraph_sections(text, base_start=0, title=None)


def _split_paragraph_sections(text: str, *, base_start: int, title: str | None) -> list[dict]:
    paragraphs = [paragraph.strip() for paragraph in re.split(r"\n\s*\n", text) if paragraph.strip()]
    if not paragraphs:
        return []

    sections: list[dict] = []
    current = ""
    current_start: int | None = None
    cursor = base_start

    for paragraph in paragraphs:
        paragraph_pos = text.find(paragraph, cursor - base_start)
        absolute_start = base_start + max(paragraph_pos, 0)
        cursor = absolute_start + len(paragraph)
        candidate = paragraph if not current else f"{current}\n\n{paragraph}"
        if current and len(candidate) > DEFAULT_MAX_CHUNK_CHARS:
            sections.append(
                {
                    "title": title,
                    "text": current,
                    "start_char": current_start if current_start is not None else absolute_start,
                }
            )
            current = paragraph
            current_start = absolute_start
        else:
            if current_start is None:
                current_start = absolute_start
            current = candidate

    if current:
        sections.append(
            {
                "title": title,
                "text": current,
                "start_char": current_start if current_start is not None else base_start,
            }
        )
    return sections


def _split_section_text(
    *,
    section_text: str,
    section_start: int,
    max_chunk_chars: int,
    min_chunk_chars: int,
    overlap_chars: int,
) -> list[tuple[int, int, str]]:
    cleaned = section_text.strip()
    if len(cleaned) <= max_chunk_chars:
        return [(section_start, section_start + len(cleaned), cleaned)]

    chunks: list[tuple[int, int, str]] = []
    offset = 0
    length = len(cleaned)
    while offset < length:
        target_end = min(length, offset + max_chunk_chars)
        chunk_end = _find_window_boundary(cleaned, offset, target_end, min_chunk_chars)
        chunk_text = cleaned[offset:chunk_end].strip()
        if chunk_text:
            absolute_start = section_start + offset
            absolute_end = absolute_start + len(chunk_text)
            chunks.append((absolute_start, absolute_end, chunk_text))
        if chunk_end >= length:
            break
        next_offset = max(chunk_end - overlap_chars, offset + 1)
        offset = next_offset
    return chunks


def _find_window_boundary(text: str, start: int, target_end: int, min_chunk_chars: int) -> int:
    search_from = min(len(text), max(start + min_chunk_chars, target_end - 350))
    candidate_text = text[start:target_end]
    paragraph_break = candidate_text.rfind("\n\n")
    sentence_break = max(candidate_text.rfind(". "), candidate_text.rfind("? "), candidate_text.rfind("! "))
    newline_break = candidate_text.rfind("\n")

    for break_pos in (paragraph_break, sentence_break, newline_break):
        if break_pos >= min_chunk_chars:
            return start + break_pos + (2 if break_pos == paragraph_break else 1)
    return target_end


def _resolve_page_range(segments: list[TextSegment], start_char: int, end_char: int) -> tuple[int | None, int | None]:
    pages = [
        segment.page_number
        for segment in segments
        if segment.page_number is not None
        and segment.end_char > start_char
        and segment.start_char < end_char
    ]
    if not pages:
        return None, None
    return min(pages), max(pages)


def _stable_chunk_hash(chunk_text: str) -> str:
    import hashlib

    return hashlib.sha256(chunk_text.encode("utf-8")).hexdigest()
