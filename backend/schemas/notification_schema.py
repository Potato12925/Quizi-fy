from pydantic import BaseModel, Field


class NotificationCreateRequest(BaseModel):
    user_id: int = Field(ge=1)
    is_read: bool = False


class NotificationUpdateRequest(BaseModel):
    is_read: bool | None = None
