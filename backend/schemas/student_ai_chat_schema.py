from pydantic import BaseModel, Field


class StudentAiChatMessageRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)


class StudentAiChatAction(BaseModel):
    label: str = Field(description="Nhan hien thi cho hanh dong")
    type: str = Field(description="review_topic | review_wrong_questions | view_progress")
    target: str | None = Field(default=None, description="URL hoac topic_id")


class StudentAiChatMessageResponse(BaseModel):
    message: str
    cached: bool = False
    rate_limit_remaining: int
    actions: list[StudentAiChatAction] = []


class StudentAiChatHistoryItem(BaseModel):
    role: str
    content: str
    created_at: str


class StudentAiChatHistoryResponse(BaseModel):
    messages: list[StudentAiChatHistoryItem]
