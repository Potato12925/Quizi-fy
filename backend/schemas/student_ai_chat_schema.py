from pydantic import BaseModel, Field


class StudentAiChatMessageRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)


class StudentAiChatMessageResponse(BaseModel):
    message: str
    cached: bool = False
    rate_limit_remaining: int


class StudentAiChatHistoryItem(BaseModel):
    role: str
    content: str
    created_at: str


class StudentAiChatHistoryResponse(BaseModel):
    messages: list[StudentAiChatHistoryItem]
