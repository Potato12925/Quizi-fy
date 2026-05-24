from pydantic import BaseModel, Field


class UserRoleCreateRequest(BaseModel):
    user_id: int = Field(ge=1)
    role_id: int = Field(ge=1)


class UserRoleUpdateRequest(BaseModel):
    user_id: int | None = Field(default=None, ge=1)
    role_id: int | None = Field(default=None, ge=1)
