from typing import Literal

from pydantic import BaseModel, Field


class UserCreateRequest(BaseModel):
    username: str = Field(min_length=1, max_length=100)
    full_name: str = Field(min_length=1, max_length=255)
    role_code: Literal["teacher", "student"]
    class_id: int | None = Field(default=None, ge=1)


class UserUpdateRequest(BaseModel):
    username: str | None = Field(default=None, min_length=1, max_length=100)
    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    is_active: bool | None = None


class UserListQuery(BaseModel):
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=10000)
    role_code: Literal["teacher", "student", "all"] = "all"
    status: Literal["active", "inactive", "all"] = "all"
    search: str | None = None
    include_deleted: bool = False


class UserResponse(BaseModel):
    user_id: int
    username: str
    full_name: str
    is_active: bool
    must_change_password: bool
    created_at: str | None = None
    updated_at: str | None = None
    deleted_at: str | None = None
    roles: list[str]


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., min_length=6, max_length=255)
    new_password: str = Field(..., min_length=6, max_length=255)
class UserStatusUpdateRequest(BaseModel):
    is_active: bool
