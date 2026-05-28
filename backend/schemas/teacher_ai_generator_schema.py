from typing import Literal

from pydantic import BaseModel, Field, field_validator


QuestionDifficulty = Literal["easy", "medium", "hard"]
QuestionStatus = Literal["draft", "approved", "inactive", "rejected"]


class TeacherAiRequestCreatePayload(BaseModel):
    document_topic_id: int = Field(ge=1)
    num_questions: int = Field(ge=1, le=100)
    difficulty: QuestionDifficulty
    content_scope: str | None = Field(default=None, max_length=4000)

    @field_validator("content_scope")
    @classmethod
    def normalize_content_scope(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized = value.strip()
        return normalized or None


class TeacherQuestionUpdatePayload(BaseModel):
    content: str = Field(min_length=1)
    difficulty: QuestionDifficulty
    explanation: str | None = Field(default=None, max_length=4000)
    options: list[str] = Field(min_length=4, max_length=4)
    correct_option_index: int = Field(ge=0, le=3)

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("content is required")
        return normalized

    @field_validator("options")
    @classmethod
    def validate_options(cls, value: list[str]) -> list[str]:
        normalized = [item.strip() for item in value]
        if len(normalized) != 4:
            raise ValueError("options must contain exactly 4 items")
        if any(not item for item in normalized):
            raise ValueError("options must not contain empty values")
        return normalized

    @field_validator("explanation")
    @classmethod
    def normalize_explanation(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None


class TeacherBulkQuestionStatusPayload(BaseModel):
    question_ids: list[int] = Field(min_length=1)

    @field_validator("question_ids")
    @classmethod
    def validate_question_ids(cls, value: list[int]) -> list[int]:
        normalized = sorted(set(value))
        if any(item < 1 for item in normalized):
            raise ValueError("question_ids must contain positive integers")
        return normalized


class TeacherManualQuestionPayload(BaseModel):
    document_topic_id: int = Field(ge=1)
    content: str = Field(min_length=1)
    difficulty: QuestionDifficulty
    explanation: str | None = Field(default=None, max_length=4000)
    options: list[str] = Field(min_length=4, max_length=4)
    correct_option_index: int = Field(ge=0, le=3)

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("content is required")
        return normalized

    @field_validator("options")
    @classmethod
    def validate_options(cls, value: list[str]) -> list[str]:
        normalized = [item.strip() for item in value]
        if len(normalized) != 4:
            raise ValueError("options must contain exactly 4 items")
        if any(not item for item in normalized):
            raise ValueError("options must not contain empty values")
        return normalized

    @field_validator("explanation")
    @classmethod
    def normalize_explanation(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None


class AiGeneratedQuestionPayload(BaseModel):
    content: str = Field(min_length=1)
    difficulty: QuestionDifficulty
    explanation: str = Field(min_length=1)
    options: list[str] = Field(min_length=4, max_length=4)
    correct_option: Literal["A", "B", "C", "D"]

    @field_validator("content", "explanation")
    @classmethod
    def normalize_text(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("field must not be empty")
        return normalized

    @field_validator("options")
    @classmethod
    def normalize_options(cls, value: list[str]) -> list[str]:
        normalized = [item.strip() for item in value]
        if len(normalized) != 4:
            raise ValueError("options must contain exactly 4 items")
        if any(not item for item in normalized):
            raise ValueError("options must not contain empty values")
        return normalized


class AiGeneratedQuestionsResponsePayload(BaseModel):
    questions: list[AiGeneratedQuestionPayload] = Field(min_length=1)
