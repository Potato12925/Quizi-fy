import json
import textwrap
from typing import Literal

from openai import OpenAI

from core.config import Config
from schemas.teacher_ai_generator_schema import (
    AiGeneratedQuestionsResponsePayload,
    QuestionDifficulty,
)


class AiGenerationError(ValueError):
    pass


def generate_mcq_questions_with_ai(
    *,
    selected_chunks: list[dict],
    difficulty: QuestionDifficulty,
    num_questions: int,
    content_scope: str | None,
    existing_question_contents: list[str],
) -> list[dict]:
    if not Config.OPENAI_API_KEY:
        raise AiGenerationError("Missing AI API key")

    prompt = _build_prompt(
        selected_chunks=selected_chunks,
        difficulty=difficulty,
        num_questions=num_questions,
        content_scope=content_scope,
        existing_question_contents=existing_question_contents,
    )
    client = OpenAI(api_key=Config.OPENAI_API_KEY)

    try:
        response = client.chat.completions.create(
            model=Config.OPENAI_MODEL,
            temperature=0.2,
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an assistant that generates valid multiple-choice questions "
                        "for teachers. Return valid JSON only."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
        )
    except Exception as exc:
        raise AiGenerationError("AI request failed") from exc

    content = response.choices[0].message.content if response.choices else None
    if not content:
        raise AiGenerationError("AI returned empty content")

    try:
        parsed = json.loads(content)
    except json.JSONDecodeError as exc:
        raise AiGenerationError("AI returned invalid JSON") from exc

    try:
        validated = AiGeneratedQuestionsResponsePayload.model_validate(parsed)
    except Exception as exc:
        raise AiGenerationError("AI returned invalid question format") from exc

    results: list[dict] = []
    for item in validated.questions:
        results.append(
            {
                "content": item.content,
                "difficulty": item.difficulty,
                "explanation": item.explanation,
                "options": item.options,
                "correct_option_index": _option_label_to_index(item.correct_option),
                "source_chunk_indexes": item.source_chunk_indexes,
            }
        )
    return results


def _option_label_to_index(label: Literal["A", "B", "C", "D"]) -> int:
    mapping = {"A": 0, "B": 1, "C": 2, "D": 3}
    return mapping[label]


def _build_prompt(
    *,
    selected_chunks: list[dict],
    difficulty: QuestionDifficulty,
    num_questions: int,
    content_scope: str | None,
    existing_question_contents: list[str],
) -> str:
    existing_lines: list[str] = []
    for idx, content in enumerate(existing_question_contents[:80], start=1):
        normalized = " ".join(content.strip().split())
        if normalized:
            existing_lines.append(f"{idx}. {normalized[:300]}")

    existing_text = "\n".join(existing_lines) if existing_lines else "No existing questions."
    scope_text = content_scope or "Use the whole document."
    chunk_blocks: list[str] = []
    for chunk in selected_chunks:
        prompt_chunk_index = int(chunk.get("prompt_chunk_index") or 0)
        source_chunk_index = int(chunk.get("chunk_index") or 0)
        chunk_title = chunk.get("chunk_title") or "Untitled section"
        chunk_text = str(chunk.get("chunk_text") or "").strip()
        page_from = chunk.get("page_from")
        page_to = chunk.get("page_to")
        page_text = ""
        if page_from is not None and page_to is not None:
            page_text = f"\nPages: {page_from}-{page_to}"
        elif page_from is not None:
            page_text = f"\nPages: {page_from}"
        if not chunk_text:
            continue
        chunk_blocks.append(
            textwrap.dedent(
                f"""
                [Chunk {prompt_chunk_index}]
                Chunk Index: {source_chunk_index}
                Title: {chunk_title}
                {page_text.strip() if page_text else ""}
                Content:
                {chunk_text}
                """
            ).strip()
        )

    if not chunk_blocks:
        raise AiGenerationError("No chunks were provided for AI generation")

    return textwrap.dedent(
        f"""
        Generate exactly {num_questions} multiple-choice questions from the provided source chunks.
        Difficulty must be "{difficulty}" for every question.
        Content scope: {scope_text}

        Difficulty definitions (Vietnamese high-school standard):
        - recognition: kiem tra nho khai niem, dinh nghia, cong thuc, su kien
        - comprehension: giai thich, so sanh, dien giai ban chat
        - application: ap dung kien thuc vao bai tap hoac tinh huong quen thuoc
        - advanced: tong hop, suy luan nhieu buoc, phan hoa hoc sinh

        Avoid generating questions that are duplicates or very similar to existing questions:
        {existing_text}

        Source chunks:
        {"\n\n".join(chunk_blocks)}

        Return strict JSON object with this schema:
        {{
          "questions": [
            {{
              "content": "question text",
              "difficulty": "recognition|comprehension|application|advanced",
              "explanation": "brief explanation",
              "options": ["option A", "option B", "option C", "option D"],
              "correct_option": "A|B|C|D",
              "source_chunk_indexes": [1, 2]
            }}
          ]
        }}

        Rules:
        - Use only the provided chunks as source material.
        - Do not invent facts or details outside the provided chunks.
        - Exactly 4 options.
        - Exactly 1 correct option.
        - Every question must have difficulty "{difficulty}" exactly.
        - Return exactly {num_questions} questions.
        - Include source_chunk_indexes whenever possible, using the chunk numbers shown above.
        - No markdown.
        - Output JSON only.
        """
    ).strip()
