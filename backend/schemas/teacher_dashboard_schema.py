from typing import Literal

from pydantic import BaseModel, Field

from schemas.difficulty_schema import QuestionDifficulty

AiRequestStatus = Literal["pending", "processing", "completed", "failed", "cancelled"]
QuestionStatus = Literal["draft", "approved", "rejected", "inactive"]


class TeacherDashboardQueryParams(BaseModel):
    recent_limit: int = Field(default=5, ge=1, le=20)


class TeacherSummary(BaseModel):
    total_assigned_subjects: int
    total_topics: int
    total_documents: int
    total_ai_requests: int
    total_questions: int


class TeacherDashboardInsights(BaseModel):
    ai_completion_rate_pct: float
    question_approval_rate_pct: float
    pending_ai_requests: int
    draft_questions: int


class TeacherDashboardTeacher(BaseModel):
    user_id: int
    username: str


class TeacherDashboardStatusCounts(BaseModel):
    pending: int = 0
    processing: int = 0
    completed: int = 0
    failed: int = 0
    cancelled: int = 0


class TeacherDashboardQuestionStatusCounts(BaseModel):
    draft: int = 0
    approved: int = 0
    rejected: int = 0
    inactive: int = 0


class TeacherDashboardQuestionDifficultyCounts(BaseModel):
    recognition: int = 0
    comprehension: int = 0
    application: int = 0
    advanced: int = 0


class TeacherDashboardDifficultyDistributionItem(BaseModel):
    difficulty: QuestionDifficulty
    percentage: int | None = None
    question_count: int


class TeacherDashboardTopicOption(BaseModel):
    topic_id: int
    topic_name: str


class TeacherDashboardUploadSubject(BaseModel):
    subject_id: int
    subject_name: str
    topics: list[TeacherDashboardTopicOption]


class TeacherDashboardRecentAiRequest(BaseModel):
    request_id: int
    document_topic_id: int
    document_id: int | None = None
    document_title: str | None = None
    topic_id: int | None = None
    topic_name: str | None = None
    subject_id: int | None = None
    subject_name: str | None = None
    num_questions: int
    difficulty_distribution: list[TeacherDashboardDifficultyDistributionItem] = Field(default_factory=list)
    status: AiRequestStatus | str
    generated_question_count: int
    is_reviewed: bool
    created_at: str | None = None
    updated_at: str | None = None


class TeacherDashboardRecentDocument(BaseModel):
    document_id: int
    title: str
    status: str
    file_type: str | None = None
    file_size: int | None = None
    created_at: str | None = None
    updated_at: str | None = None
    subject_id: int | None = None
    subject_name: str | None = None
    topic_ids: list[int] = Field(default_factory=list)
    topic_names: list[str] = Field(default_factory=list)
    ai_request_count: int = 0
    question_count: int = 0
    latest_ai_status: AiRequestStatus | str | None = None


class TeacherDashboardRecentApprovedQuestion(BaseModel):
    question_id: int
    document_topic_id: int
    ai_request_id: int | None = None
    content: str
    difficulty: QuestionDifficulty | str
    source: str
    status: QuestionStatus | str
    document_id: int | None = None
    document_title: str | None = None
    topic_id: int | None = None
    topic_name: str | None = None
    subject_id: int | None = None
    subject_name: str | None = None
    created_at: str | None = None
    updated_at: str | None = None


class TeacherDashboardResponse(BaseModel):
    teacher: TeacherDashboardTeacher
    summary: TeacherSummary
    ai_request_statuses: TeacherDashboardStatusCounts
    question_statuses: TeacherDashboardQuestionStatusCounts
    question_difficulty: TeacherDashboardQuestionDifficultyCounts
    insights: TeacherDashboardInsights
    recent_ai_requests: list[TeacherDashboardRecentAiRequest]
    recent_documents: list[TeacherDashboardRecentDocument]
    recent_approved_questions: list[TeacherDashboardRecentApprovedQuestion]
    upload_subjects: list[TeacherDashboardUploadSubject]
