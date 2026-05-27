from pydantic import BaseModel, Field


class ClassStudentCreateRequest(BaseModel):
    class_id: int = Field(ge=1)
    student_id: int = Field(ge=1)


class ClassStudentUpdateRequest(BaseModel):
    class_id: int | None = Field(default=None, ge=1)
    student_id: int | None = Field(default=None, ge=1)
