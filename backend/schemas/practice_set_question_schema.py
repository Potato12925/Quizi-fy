from pydantic import BaseModel, Field


class PracticeSetQuestionCreateRequest(BaseModel):
    practice_set_id: int = Field(ge=1)
    question_id: int = Field(ge=1)
    order_num: int = Field(ge=1)


class PracticeSetQuestionUpdateRequest(BaseModel):
    question_id: int | None = Field(default=None, ge=1)
    order_num: int | None = Field(default=None, ge=1)
