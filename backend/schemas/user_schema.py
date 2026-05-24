from typing import Literal

from pydantic import BaseModel, Field


class UserCreateRequest(BaseModel):
    username: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=6, max_length=255)
    full_name: str = Field(min_length=1, max_length=255)
    role_code: Literal["teacher", "student"]


class UserUpdateRequest(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    is_active: bool | None = None
    must_change_password: bool | None = None


class UserListQuery(BaseModel):
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)
    role_code: Literal["teacher", "student"] | None = None


class UserResponse(BaseModel):
    user_id: int
    username: str
    full_name: str
    is_active: bool
    must_change_password: bool
    roles: list[str]
