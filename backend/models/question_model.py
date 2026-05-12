from typing import Optional, List

from models.base_model import TimestampModel
from models.enums import (
    DifficultyLevel,
    QuestionSource,
    QuestionStatus
)


class QuestionModel(TimestampModel):
    question_id: Optional[int] = None

    teacher_id: int

    subject_id: int
    topic_id: int

    document_id: Optional[int] = None
    ai_request_id: Optional[int] = None

    content: str

    difficulty: DifficultyLevel

    source: QuestionSource

    status: QuestionStatus = QuestionStatus.DRAFT

    explanation: Optional[str] = None

    approved_by: Optional[int] = None


class QuestionOptionModel(TimestampModel):
    option_id: Optional[int] = None

    question_id: int

    option_label: str
    option_text: str

    is_correct: bool = False

    order_num: int


class QuestionHistoryModel(TimestampModel):
    history_id: Optional[int] = None

    question_id: int

    changed_by: int

    old_data: Optional[dict] = None
    new_data: Optional[dict] = None

    change_type: Optional[str] = None