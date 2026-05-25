from pydantic import BaseModel, Field


class PracticeSetCreateRequest(BaseModel):
    student_id: int = Field(ge=1)
    subject_id: int = Field(ge=1)
    num_questions_requested: int = Field(ge=1)
    prioritize_unanswered: bool = False


class PracticeSetUpdateRequest(BaseModel):
    subject_id: int | None = Field(default=None, ge=1)
    num_questions_requested: int | None = Field(default=None, ge=1)
    prioritize_unanswered: bool | None = None


class PracticeSetGenerateRequest(BaseModel):
    subject_id: int = Field(ge=1)
    topic_id: int | None = None
    difficulty: str | None = None
    num_questions: int = Field(ge=1)
    prioritize_unanswered: bool = False
