from pydantic import BaseModel, Field

from schemas.difficulty_schema import QuestionDifficulty


class QuestionCreateRequest(BaseModel):
    teacher_id: int = Field(ge=1)
    document_topic_id: int = Field(ge=1)
    image_id: int | None = Field(default=None, ge=1)
    content: str = Field(min_length=1)
    difficulty: QuestionDifficulty
    source: str = Field(min_length=1)
    status: str = Field(default="draft")


class QuestionUpdateRequest(BaseModel):
    document_topic_id: int | None = Field(default=None, ge=1)
    image_id: int | None = Field(default=None, ge=1)
    content: str | None = Field(default=None, min_length=1)
    difficulty: QuestionDifficulty | None = None
    source: str | None = None
    status: str | None = None
