from pydantic import BaseModel, Field


class QuestionHistoryCreateRequest(BaseModel):
    question_id: int = Field(ge=1)
    changed_by: int = Field(ge=1)


class QuestionHistoryUpdateRequest(BaseModel):
    changed_by: int | None = Field(default=None, ge=1)
