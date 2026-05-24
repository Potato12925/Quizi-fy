from pydantic import BaseModel, Field


class RoleCreateRequest(BaseModel):
    role_code: str = Field(min_length=1, max_length=50)
    role_name: str = Field(min_length=1, max_length=100)


class RoleUpdateRequest(BaseModel):
    role_name: str | None = Field(default=None, min_length=1, max_length=100)
