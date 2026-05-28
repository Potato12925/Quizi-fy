from typing import Literal

from pydantic import BaseModel, Field


class ClassCreateRequest(BaseModel):
    class_code: str = Field(min_length=1, max_length=50)
    class_name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)
    teacher_id: int = Field(ge=1)


class ClassUpdateRequest(BaseModel):
    class_code: str | None = Field(default=None, min_length=1, max_length=50)
    class_name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)
    teacher_id: int | None = Field(default=None, ge=1)
    status: str | None = Field(default=None, pattern="^(active|inactive)$")


class ClassListQueryParams(BaseModel):
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)
    search: str | None = None
    status: Literal["all", "active", "inactive"] = "all"
    sort_by: Literal["created_at", "class_name"] = "created_at"
    sort_order: Literal["asc", "desc"] = "desc"


class AssignSubjectToClassRequest(BaseModel):
    subject_id: int = Field(ge=1)
    assigned_teacher_id: int = Field(ge=1)


class AssignStudentToClassRequest(BaseModel):
    student_id: int = Field(ge=1)
