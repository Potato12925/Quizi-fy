from pydantic import BaseModel, Field


class ClassSubjectCreateRequest(BaseModel):
    class_id: int = Field(ge=1)
    subject_id: int = Field(ge=1)
    status: str = Field(default="active")


class ClassSubjectUpdateRequest(BaseModel):
    subject_id: int | None = Field(default=None, ge=1)
    status: str | None = None
