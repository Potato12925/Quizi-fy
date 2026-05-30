from typing import Literal

from pydantic import BaseModel, Field


class SubjectCreateRequest(BaseModel):
    subject_code: str = Field(min_length=1, max_length=50)
    subject_name: str = Field(min_length=1, max_length=255)
    description: str | None = None


class SubjectUpdateRequest(BaseModel):
    subject_code: str | None = Field(default=None, min_length=1, max_length=50)
    subject_name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None)
    status: str | None = Field(default=None, pattern="^(active|inactive)$")


class SubjectListQueryParams(BaseModel):
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)
    search: str | None = None
    status: Literal["all", "active", "inactive"] = "all"
    sort_by: Literal["created_at", "subject_name", "subject_code"] = "created_at"
    sort_order: Literal["asc", "desc"] = "desc"

