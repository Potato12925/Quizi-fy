from pydantic import BaseModel, Field


class StudentAnswerCreateRequest(BaseModel):
    attempt_id: int = Field(ge=1)
    question_id: int = Field(ge=1)
    selected_option_id: int | None = Field(default=None, ge=1)


class StudentAnswerUpdateRequest(BaseModel):
    selected_option_id: int | None = Field(default=None, ge=1)


class AnswerItem(BaseModel):
    question_id: int = Field(ge=1)
    selected_option_id: int | None = None


class StudentAnswerSaveRequest(BaseModel):
    answers: list[AnswerItem]
