from pydantic import BaseModel, Field


class DocumentTopicCreateRequest(BaseModel):
    document_id: int = Field(ge=1)
    topic_id: int = Field(ge=1)


class DocumentTopicUpdateRequest(BaseModel):
    document_id: int | None = Field(default=None, ge=1)
    topic_id: int | None = Field(default=None, ge=1)
