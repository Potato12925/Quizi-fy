from pydantic import BaseModel, Field


class ClassTeacherCreateRequest(BaseModel):
    class_id: int = Field(ge=1)
    teacher_id: int = Field(ge=1)


class ClassTeacherUpdateRequest(BaseModel):
    teacher_id: int | None = Field(default=None, ge=1)
