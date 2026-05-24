from pydantic import BaseModel, Field


class ClassStudentCreateRequest(BaseModel):
    class_id: int = Field(ge=1)
    student_id: int = Field(ge=1)
    invited_by: int = Field(ge=1)


class ClassStudentUpdateRequest(BaseModel):
    invited_by: int | None = Field(default=None, ge=1)
