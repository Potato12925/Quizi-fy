from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator


SortOrder = Literal["asc", "desc"]
ExportFormat = Literal["csv", "xlsx", "pdf"]
ClassReportExportFormat = Literal["docx", "pdf"]
QuestionStatus = Literal["draft", "approved", "inactive", "rejected"]
QuestionDifficulty = Literal["easy", "medium", "hard"]
QuestionSource = Literal["ai", "manual"]
AiRequestStatus = Literal["pending", "processing", "completed", "failed", "cancelled"]


class ReportPaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=10, ge=1, le=200)


class ReportQueryParams(ReportPaginationParams):
    search: str | None = None
    sort_by: str = "created_at"
    sort_order: SortOrder = "desc"

    teacher_id: int | None = Field(default=None, ge=1)
    subject_id: int | None = Field(default=None, ge=1)
    topic_id: int | None = Field(default=None, ge=1)

    status: str | None = None
    difficulty: str | None = None
    source: str | None = None

    date_from: str | None = None
    date_to: str | None = None

    @field_validator("search")
    @classmethod
    def normalize_search(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None

    @field_validator("date_from", "date_to")
    @classmethod
    def validate_date(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        if not normalized:
            return None

        try:
            datetime.fromisoformat(normalized)
        except ValueError as exc:
            raise ValueError("date_from/date_to must be valid ISO datetime strings") from exc
        return normalized


class TopicCoverageQueryParams(ReportQueryParams):
    min_questions: int = Field(default=5, ge=1, le=1000)


class ExportQueryParams(BaseModel):
    format: ExportFormat


class ClassReportQueryParams(BaseModel):
    class_id: int = Field(ge=1)
    date_from: str | None = None
    date_to: str | None = None

    @field_validator("date_from", "date_to")
    @classmethod
    def validate_report_date(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        if not normalized:
            return None
        try:
            datetime.fromisoformat(normalized)
        except ValueError as exc:
            raise ValueError("date_from/date_to must be valid ISO datetime strings") from exc
        return normalized


class FilterOptionItem(BaseModel):
    id: int
    name: str


class ReportFilterOptions(BaseModel):
    teachers: list[FilterOptionItem] = Field(default_factory=list)
    subjects: list[FilterOptionItem] = Field(default_factory=list)
    topics: list[FilterOptionItem] = Field(default_factory=list)
