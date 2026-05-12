from typing import Optional

from models.base_model import TimestampModel


class NotificationModel(TimestampModel):
    notification_id: Optional[int] = None

    user_id: int

    title: Optional[str] = None

    content: Optional[str] = None

    is_read: bool = False