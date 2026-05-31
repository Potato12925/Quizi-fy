from pydantic import BaseModel, Field


class QuestionCreateRequest(BaseModel):
    teacher_id: int = Field(ge=1)
    document_topic_id: int = Field(ge=1)
    content: str = Field(min_length=1)
    difficulty: str = Field(min_length=1)
    source: str = Field(min_length=1)
    status: str = Field(default="draft")


class QuestionUpdateRequest(BaseModel):
    document_topic_id: int | None = Field(default=None, ge=1)
    content: str | None = Field(default=None, min_length=1)
    difficulty: str | None = None
    source: str | None = None
    status: str | None = None
