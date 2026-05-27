from pydantic import BaseModel, Field, field_validator


class TeacherAddDocumentTopicRequest(BaseModel):
    topic_name: str = Field(min_length=1, max_length=255)

    @field_validator("topic_name")
    @classmethod
    def normalize_topic_name(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Topic name is required")
        return normalized


class TeacherUpdateTopicRequest(BaseModel):
    topic_name: str = Field(min_length=1, max_length=255)

    @field_validator("topic_name")
    @classmethod
    def normalize_topic_name(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Topic name is required")
        return normalized
