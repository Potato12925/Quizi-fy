from pydantic import BaseModel, Field


class PracticeAttemptCreateRequest(BaseModel):
    practice_set_id: int = Field(ge=1)
    total_correct: int = Field(default=0, ge=0)
    total_wrong: int = Field(default=0, ge=0)
    status: str = Field(default="in_progress")


class PracticeAttemptUpdateRequest(BaseModel):
    total_correct: int | None = Field(default=None, ge=0)
    total_wrong: int | None = Field(default=None, ge=0)
    status: str | None = None


class PracticeAttemptStartRequest(BaseModel):
    practice_set_id: int = Field(ge=1)
