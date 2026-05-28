from pydantic import BaseModel, Field, field_validator


QUESTION_DIFFICULTIES = {"easy", "medium", "hard"}
QUESTION_STATUSES = {"draft", "approved", "inactive", "rejected"}


class ManualQuestionPayload(BaseModel):
    document_topic_id: int | None = Field(default=None, ge=1)
    topic_id: int | None = Field(default=None, ge=1)
    content: str = Field(min_length=1)
    difficulty: str = Field(min_length=1)
    status: str = Field(default="draft")
    explanation: str | None = None
    options: list[str] = Field(min_length=2)
    correct_option_index: int = Field(ge=0)

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("content is required")
        return normalized

    @field_validator("difficulty")
    @classmethod
    def validate_difficulty(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in QUESTION_DIFFICULTIES:
            raise ValueError("difficulty must be one of easy, medium, hard")
        return normalized

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in QUESTION_STATUSES:
            raise ValueError("status must be one of draft, approved, inactive, rejected")
        return normalized

    @field_validator("options")
    @classmethod
    def validate_options(cls, value: list[str]) -> list[str]:
        normalized = [option.strip() for option in value if option is not None]
        if len(normalized) < 2:
            raise ValueError("options must contain at least 2 items")
        if any(not option for option in normalized):
            raise ValueError("options must not contain empty values")
        return normalized

    @field_validator("correct_option_index")
    @classmethod
    def validate_correct_index(cls, value: int, info):
        options = info.data.get("options")
        if isinstance(options, list) and value >= len(options):
            raise ValueError("correct_option_index is out of range")
        return value


class QuestionStatusUpdatePayload(BaseModel):
    status: str = Field(min_length=1)

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in QUESTION_STATUSES:
            raise ValueError("status must be one of draft, approved, inactive, rejected")
        return normalized
