from pydantic import BaseModel, Field


class SubjectCreateRequest(BaseModel):
    subject_code: str = Field(min_length=1, max_length=50)
    subject_name: str = Field(min_length=1, max_length=255)


class SubjectUpdateRequest(BaseModel):
    subject_name: str | None = Field(default=None, min_length=1, max_length=255)
    status: str | None = Field(default=None, pattern="^(active|inactive)$")

