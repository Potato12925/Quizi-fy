from pydantic import BaseModel, Field

from schemas.difficulty_schema import PracticeQuestionDifficulty, QuestionDifficulty

class PracticeSetCreateRequest(BaseModel):
    student_id: int = Field(ge=1)
    subject_id: int = Field(ge=1)
    difficulty: QuestionDifficulty | None = None
    time_limit_minutes: int | None = Field(default=None, ge=1)
    num_questions_requested: int = Field(ge=1)
    prioritize_unanswered: bool = False


class PracticeSetUpdateRequest(BaseModel):
    subject_id: int | None = Field(default=None, ge=1)
    num_questions_requested: int | None = Field(default=None, ge=1)
    prioritize_unanswered: bool | None = None


class PracticeSetGenerateRequest(BaseModel):
    subject_id: int = Field(ge=1)
    document_topic_id: int | None = None
    difficulty: PracticeQuestionDifficulty | None = None
    time_limit_minutes: int | None = Field(default=None, ge=1)
    num_questions: int = Field(ge=1)
    prioritize_unanswered: bool = False
