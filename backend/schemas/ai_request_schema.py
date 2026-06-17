from pydantic import BaseModel, Field, field_validator

from schemas.difficulty_schema import QuestionDifficulty


class AiRequestDifficultyDistributionPayload(BaseModel):
    difficulty: QuestionDifficulty
    percentage: int | None = Field(default=None, ge=0, le=100)
    question_count: int = Field(ge=1)


class AiRequestCreateRequest(BaseModel):
    document_topic_id: int = Field(ge=1)
    num_questions: int = Field(ge=1)
    difficulty_distribution: list[AiRequestDifficultyDistributionPayload] = Field(min_length=1)
    content_scope: str | None = None

    @field_validator("difficulty_distribution")
    @classmethod
    def validate_distribution(
        cls,
        value: list[AiRequestDifficultyDistributionPayload],
        info,
    ) -> list[AiRequestDifficultyDistributionPayload]:
        difficulties = [item.difficulty for item in value]
        if len(set(difficulties)) != len(difficulties):
            raise ValueError("difficulty_distribution contains duplicate difficulty values")

        num_questions = info.data.get("num_questions")
        if isinstance(num_questions, int) and sum(item.question_count for item in value) != num_questions:
            raise ValueError("sum of difficulty_distribution.question_count must equal num_questions")

        percentages = [item.percentage for item in value]
        if any(item is not None for item in percentages):
            if any(item is None for item in percentages):
                raise ValueError("percentage must be provided for every difficulty when used")
            if sum(int(item or 0) for item in percentages) != 100:
                raise ValueError("sum of difficulty_distribution.percentage must equal 100")
        return value


class AiRequestUpdateRequest(BaseModel):
    num_questions: int | None = Field(default=None, ge=1)
    status: str | None = None
    generated_question_count: int | None = Field(default=None, ge=0)
    retry_count: int | None = Field(default=None, ge=0)
    error_message: str | None = None
