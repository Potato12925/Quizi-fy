from enum import Enum


class ActiveStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class DifficultyLevel(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class AIRequestStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class QuestionSource(str, Enum):
    AI = "ai"
    MANUAL = "manual"


class QuestionStatus(str, Enum):
    DRAFT = "draft"
    APPROVED = "approved"
    INACTIVE = "inactive"
    REJECTED = "rejected"


class PracticeAttemptStatus(str, Enum):
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    TIMEOUT = "timeout"