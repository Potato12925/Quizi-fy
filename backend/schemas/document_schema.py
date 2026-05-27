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
    description: str | None = Field(default=None, max_length=1000)
    file_url: str | None = Field(default=None, min_length=1)
    file_type: str | None = Field(default=None, min_length=1, max_length=20)
    file_size: int | None = Field(default=None, ge=1)
    status: str | None = None
    topic_ids: list[int] | None = Field(default=None)


class DocumentUploadRequest(BaseModel):
    subject_id: int = Field(ge=1)
    topic_ids: list[int] = Field(default_factory=list)
    title: str = Field(min_length=1, max_length=500)
    description: str | None = Field(default=None, max_length=1000)

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Title is required")
        return normalized

    @field_validator("topic_ids")
    @classmethod
    def validate_topic_ids(cls, value: list[int]) -> list[int]:
        unique_ids = sorted(set(value))
        if any(topic_id < 1 for topic_id in unique_ids):
            raise ValueError("topic_ids must contain positive integers")
        return unique_ids


class DocumentUploadResponse(BaseModel):
    document_id: int
    teacher_id: int
    subject_id: int
    title: str
    description: str | None = None
    file_url: str
    file_type: str
    file_size: int
    file_hash: str | None = None
    status: str
