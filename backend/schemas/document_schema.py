from pydantic import BaseModel, Field


class DocumentCreateRequest(BaseModel):
    teacher_id: int = Field(ge=1)
    subject_id: int = Field(ge=1)
    title: str = Field(min_length=1, max_length=500)
    file_url: str = Field(min_length=1)
    file_type: str = Field(min_length=1, max_length=20)
    file_size: int = Field(ge=1)
    status: str = Field(default="active")


class DocumentUpdateRequest(BaseModel):
    subject_id: int | None = Field(default=None, ge=1)
    title: str | None = Field(default=None, min_length=1, max_length=500)
    file_url: str | None = Field(default=None, min_length=1)
    file_type: str | None = Field(default=None, min_length=1, max_length=20)
    file_size: int | None = Field(default=None, ge=1)
    status: str | None = None
