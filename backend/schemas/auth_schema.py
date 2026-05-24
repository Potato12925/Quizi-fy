from typing import Literal

from pydantic import BaseModel, Field


class UsernamePasswordLoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=1, max_length=255)


class SetRoleRequest(BaseModel):
    role_code: Literal["student", "teacher", "admin"]


class AuthMeResponse(BaseModel):
    user_id: int
    username: str
    full_name: str
    is_active: bool
    roles: list[str]
