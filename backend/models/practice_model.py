from typing import Optional

from models.base_model import TimestampModel
from models.enums import (
    DifficultyLevel,
    PracticeAttemptStatus
)


class PracticeSetModel(TimestampModel):
    practice_set_id: Optional[int] = None

    student_id: int

    subject_id: int
    topic_id: Optional[int] = None

    difficulty: Optional[DifficultyLevel] = None

    num_questions_requested: int

    num_questions_actual: Optional[int] = None

    time_limit_minutes: Optional[int] = None

    prioritize_unanswered: bool = False


class PracticeAttemptModel(TimestampModel):
    attempt_id: Optional[int] = None

    practice_set_id: int

    score: Optional[float] = None

    total_correct: int = 0
    total_wrong: int = 0

    status: PracticeAttemptStatus = (
        PracticeAttemptStatus.IN_PROGRESS
    )


class StudentAnswerModel(TimestampModel):
    answer_id: Optional[int] = None

    attempt_id: int

    question_id: int

    selected_option_id: Optional[int] = None

    is_correct: Optional[bool] = None