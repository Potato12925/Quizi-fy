from pydantic import BaseModel, Field


class ClassTeacherCreateRequest(BaseModel):
    class_id: int = Field(ge=1)
    teacher_id: int = Field(ge=1)
    added_by: int = Field(ge=1)


class ClassTeacherUpdateRequest(BaseModel):
    added_by: int | None = Field(default=None, ge=1)
