from pydantic import BaseModel, Field
from datetime import datetime
from typing import List

class Student_Ai_Chat_Message_Create(BaseModel):
    student_id: int = Field(ge=1)
    role: str = Field(min_length=1, max_length=20)
    content: str = Field(min_length=1)
    tools_used: List[str] = Field(default=[])
    cached: bool = Field(default=False)
    created_at: datetime | None = Field(default=datetime.now())
    deleted_at: datetime | None = Field(default=None)