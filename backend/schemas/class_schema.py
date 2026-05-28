from pydantic import BaseModel, Field


class ClassCreateRequest(BaseModel):
    class_code: str = Field(min_length=1, max_length=50)
    class_name: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1, max_length=255)
    teacher_id: int = Field(ge=1)


class ClassUpdateRequest(BaseModel):
    class_name: str | None = Field(default=None, min_length=1, max_length=255)
    teacher_id: int | None = Field(default=None, ge=1)
    status: str | None = Field(default=None, pattern="^(active|inactive)$")
