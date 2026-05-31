from pydantic import BaseModel, Field


class NotificationCreateRequest(BaseModel):
    user_id: int = Field(ge=1)
    title: str | None = None
    content: str | None = None
    is_read: bool = False


class NotificationUpdateRequest(BaseModel):
    is_read: bool | None = None
