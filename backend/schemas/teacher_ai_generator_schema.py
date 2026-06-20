from typing import Literal

from pydantic import BaseModel, Field, field_validator

from schemas.difficulty_schema import QUESTION_DIFFICULTIES, QuestionDifficulty

QuestionStatus = Literal["draft", "approved", "inactive", "rejected"]
ReviewableQuestionStatus = Literal["draft", "approved", "rejected"]


class TeacherAiDifficultyDistributionPayload(BaseModel):
    difficulty: QuestionDifficulty
    percentage: int | None = Field(default=None, ge=0, le=100)
    question_count: int = Field(ge=1)


class TeacherAiRequestCreatePayload(BaseModel):
    document_topic_id: int = Field(ge=1)
    num_questions: int = Field(ge=1, le=100)
    difficulty_distribution: list[TeacherAiDifficultyDistributionPayload] = Field(min_length=1)
    content_scope: str | None = Field(default=None, max_length=4000)

    @field_validator("content_scope")
    @classmethod
    def normalize_content_scope(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized = value.strip()
        return normalized or None

    @field_validator("difficulty_distribution")
    @classmethod
    def validate_difficulty_distribution(
        cls,
        value: list[TeacherAiDifficultyDistributionPayload],
        info,
    ) -> list[TeacherAiDifficultyDistributionPayload]:
        if not value:
            raise ValueError("difficulty_distribution must not be empty")

        difficulties = [item.difficulty for item in value]
        if len(set(difficulties)) != len(difficulties):
            raise ValueError("difficulty_distribution contains duplicate difficulty values")

        total_question_count = sum(item.question_count for item in value)
        num_questions = info.data.get("num_questions")
        if isinstance(num_questions, int) and total_question_count != num_questions:
            raise ValueError("sum of difficulty_distribution.question_count must equal num_questions")

        percentages = [item.percentage for item in value]
        has_percentage = any(item is not None for item in percentages)
        if has_percentage:
            if any(item is None for item in percentages):
                raise ValueError("percentage must be provided for every difficulty when used")
            if sum(int(item or 0) for item in percentages) != 100:
                raise ValueError("sum of difficulty_distribution.percentage must equal 100")
        return value


class TeacherQuestionUpdatePayload(BaseModel):
    image_id: int | None = Field(default=None, ge=1)
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


class TeacherAiReviewOptionPayload(BaseModel):
    option_text: str = Field(min_length=1)
    order_num: int = Field(ge=1, le=4)
    is_correct: bool

    @field_validator("option_text")
    @classmethod
    def validate_option_text(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("option_text is required")
        return normalized


class TeacherAiReviewQuestionPayload(BaseModel):
    question_id: int = Field(ge=1)
    image_id: int | None = Field(default=None, ge=1)
    content: str = Field(min_length=1)
    difficulty: QuestionDifficulty
    status: ReviewableQuestionStatus
    explanation: str | None = Field(default=None, max_length=4000)
    options: list[TeacherAiReviewOptionPayload] = Field(min_length=4, max_length=4)

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("content is required")
        return normalized

    @field_validator("explanation")
    @classmethod
    def normalize_explanation(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None

    @field_validator("options")
    @classmethod
    def validate_options(cls, value: list[TeacherAiReviewOptionPayload]) -> list[TeacherAiReviewOptionPayload]:
        if len(value) != 4:
            raise ValueError("options must contain exactly 4 items")
        order_nums = [item.order_num for item in value]
        if len(set(order_nums)) != 4:
            raise ValueError("options.order_num must be unique")
        if sorted(order_nums) != [1, 2, 3, 4]:
            raise ValueError("options.order_num must be exactly 1,2,3,4")
        correct_count = sum(1 for item in value if item.is_correct)
        if correct_count != 1:
            raise ValueError("each question must have exactly one correct option")
        return value


class TeacherAiRequestConfirmReviewPayload(BaseModel):
    questions: list[TeacherAiReviewQuestionPayload] = Field(min_length=1)

    @field_validator("questions")
    @classmethod
    def validate_questions(cls, value: list[TeacherAiReviewQuestionPayload]) -> list[TeacherAiReviewQuestionPayload]:
        ids = [item.question_id for item in value]
        if len(set(ids)) != len(ids):
            raise ValueError("question_id must be unique in review payload")
        return value


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
    topic_id: int = Field(ge=1)
    image_id: int | None = Field(default=None, ge=1)
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

    @field_validator("difficulty")
    @classmethod
    def validate_difficulty(cls, value: QuestionDifficulty) -> QuestionDifficulty:
        if value not in QUESTION_DIFFICULTIES:
            raise ValueError("difficulty is invalid")
        return value


class AiGeneratedQuestionsResponsePayload(BaseModel):
    questions: list[AiGeneratedQuestionPayload] = Field(min_length=1)
