from pydantic import BaseModel, Field


class QuestionOptionCreateRequest(BaseModel):
    question_id: int = Field(ge=1)
    option_label: str = Field(min_length=1, max_length=5)
    option_text: str = Field(min_length=1)
    is_correct: bool = False
    order_num: int = Field(ge=1)


class QuestionOptionUpdateRequest(BaseModel):
    option_label: str | None = Field(default=None, min_length=1, max_length=5)
    option_text: str | None = Field(default=None, min_length=1)
    is_correct: bool | None = None
    order_num: int | None = Field(default=None, ge=1)
