from pydantic import BaseModel, Field


class AiRequestCreateRequest(BaseModel):
    document_topic_id: int = Field(ge=1)
    num_questions: int = Field(ge=1)
    difficulty: str = Field(min_length=1)
    content_scope: str | None = None


class AiRequestUpdateRequest(BaseModel):
    num_questions: int | None = Field(default=None, ge=1)
    difficulty: str | None = None
    status: str | None = None
    generated_question_count: int | None = Field(default=None, ge=0)
    retry_count: int | None = Field(default=None, ge=0)
    error_message: str | None = None
