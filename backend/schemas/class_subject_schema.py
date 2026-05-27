from pydantic import BaseModel, Field


class ClassSubjectCreateRequest(BaseModel):
    class_id: int = Field(ge=1)
    subject_id: int = Field(ge=1)
    assigned_teacher_id: int = Field(ge=1)


class ClassSubjectUpdateRequest(BaseModel):
    class_id: int | None = Field(default=None, ge=1)
    subject_id: int | None = Field(default=None, ge=1)
    assigned_teacher_id: int | None = Field(default=None, ge=1)
    status: str | None = None
