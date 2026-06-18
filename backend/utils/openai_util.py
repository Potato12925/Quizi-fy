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
    document_text: str,
    difficulty: QuestionDifficulty,
    num_questions: int,
    content_scope: str | None,
    existing_question_contents: list[str],
) -> list[dict]:
    if not Config.OPENAI_API_KEY:
        raise AiGenerationError("Missing AI API key")

    prompt = _build_prompt(
        document_text=document_text,
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
        correct_index = _option_label_to_index(item.correct_option)
        results.append(
            {
                "content": item.content,
                "difficulty": item.difficulty,
                "explanation": item.explanation,
                "options": item.options,
                "correct_option_index": correct_index,
            }
        )
    return results


def _option_label_to_index(label: Literal["A", "B", "C", "D"]) -> int:
    mapping = {"A": 0, "B": 1, "C": 2, "D": 3}
    return mapping[label]


def _build_prompt(
    *,
    document_text: str,
    difficulty: QuestionDifficulty,
    num_questions: int,
    content_scope: str | None,
    existing_question_contents: list[str],
) -> str:
    trimmed_document = document_text.strip()
    if len(trimmed_document) > 16000:
        trimmed_document = trimmed_document[:16000]

    existing_lines = []
    for idx, content in enumerate(existing_question_contents[:80], start=1):
        normalized = " ".join(content.strip().split())
        if normalized:
            existing_lines.append(f"{idx}. {normalized[:300]}")

    scope_text = content_scope or "Use the whole document."
    existing_text = "\n".join(existing_lines) if existing_lines else "No existing questions."

    return textwrap.dedent(
        f"""
        Generate exactly {num_questions} multiple-choice questions from the source document.
        Difficulty must be "{difficulty}" for every question.
        Content scope: {scope_text}

        Difficulty definitions (Vietnamese high-school standard):
        - recognition (Nhận biết): kiểm tra nhớ khái niệm, định nghĩa, công thức, sự kiện
        - comprehension (Thông hiểu): giải thích, so sánh, diễn giải bản chất
        - application (Vận dụng): áp dụng kiến thức vào bài tập hoặc tình huống quen thuộc
        - advanced (Vận dụng cao): tổng hợp, suy luận nhiều bước, phân hóa học sinh

        Avoid generating questions that are duplicates or very similar to existing questions:
        {existing_text}

        Source document:
        {trimmed_document}

        Return strict JSON object with this schema:
        {{
          "questions": [
            {{
              "content": "question text",
              "difficulty": "recognition|comprehension|application|advanced",
              "explanation": "brief explanation",
              "options": ["option A", "option B", "option C", "option D"],
              "correct_option": "A|B|C|D"
            }}
          ]
        }}

        Rules:
        - Exactly 4 options.
        - Exactly 1 correct option.
        - Every question must have difficulty "{difficulty}" exactly.
        - Return exactly {num_questions} questions.
        - No markdown.
        - Output JSON only.
        """
    ).strip()
