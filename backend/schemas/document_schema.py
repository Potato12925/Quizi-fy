from pydantic import BaseModel, Field, field_validator


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


class DocumentUploadRequest(BaseModel):
    subject_id: int = Field(ge=1)
    topic_id: int | None = Field(default=None, ge=1)
    title: str = Field(min_length=1, max_length=500)
    description: str | None = Field(default=None, max_length=1000)
    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Title is required")
        return normalized


class DocumentUploadResponse(BaseModel):
    document_id: int
    teacher_id: int
    subject_id: int
    topic_id: int | None = None
    title: str
    description: str | None = None
    file_url: str
    file_type: str
    file_size: int
    file_hash: str | None = None
    status: str
