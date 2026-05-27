from pydantic import BaseModel, Field


class TopicCreateRequest(BaseModel):
    subject_id: int = Field(ge=1)
    topic_name: str = Field(min_length=1, max_length=255)
    description: str | None = None


class TopicUpdateRequest(BaseModel):
    subject_id: int | None = Field(default=None, ge=1)
    topic_name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
