from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class CustomBaseModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class TimestampModel(CustomBaseModel):
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None