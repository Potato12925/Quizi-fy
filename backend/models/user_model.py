from typing import Optional
from pydantic import EmailStr

from models.base_model import TimestampModel


class UserModel(TimestampModel):
    user_id: Optional[int] = None

    google_id: str
    email: EmailStr

    full_name: str
    avatar_url: Optional[str] = None

    is_active: bool = True


class RoleModel(TimestampModel):
    role_id: Optional[int] = None

    role_code: str
    role_name: str

    description: Optional[str] = None


class UserRoleModel(TimestampModel):
    user_role_id: Optional[int] = None

    user_id: int
    role_id: int