from pydantic import BaseModel, Field, field_validator


class ImageUpdatePayload(BaseModel):
    file_name: str = Field(min_length=1, max_length=255)

    @field_validator("file_name")
    @classmethod
    def validate_file_name(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("file_name is required")
        return normalized
