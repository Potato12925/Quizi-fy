from typing import Optional

from models.base_model import TimestampModel
from models.enums import (
    DifficultyLevel,
    AIRequestStatus
)


class AIRequestModel(TimestampModel):
    request_id: Optional[int] = None

    teacher_id: int
    document_id: int

    num_questions: int

    difficulty: DifficultyLevel

    content_scope: Optional[str] = None

    status: AIRequestStatus = AIRequestStatus.PENDING

    generated_question_count: int = 0

    retry_count: int = 0

    error_message: Optional[str] = None