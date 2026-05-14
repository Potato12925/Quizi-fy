from typing import Literal, List

from pydantic import BaseModel, Field


class GoogleLoginRequest(BaseModel):
    token: str = Field(min_length=1)
    token_type: Literal["id_token", "access_token"] = "id_token"
    roles: List[Literal["teacher", "student"]] = Field(default_factory=list)


class SetRoleRequest(BaseModel):
    role_code: Literal["student", "teacher","admin"]


class AuthMeResponse(BaseModel):
    user_id: int
    google_id: str
    email: str
    full_name: str
    is_active: bool
    roles: list[str]
