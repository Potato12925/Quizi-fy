from pydantic import BaseModel, Field


class TeacherStatsWeakTopicItem(BaseModel):
    topic_id: int
    topic_name: str
    error_rate_pct: float = 0.0
    total_answers: int = 0
    wrong_answers: int = 0


class TeacherStatsSummary(BaseModel):
    average_score: float = 0.0
    completion_rate_pct: float = 0.0
    total_study_hours: int = 0
    total_answered_questions: int = 0


class TeacherStatsStudentDistribution(BaseModel):
    active_rate_pct: float = 0.0
    top_student_count: int = 0
    needs_attention_count: int = 0
    total_students: int = 0


class TeacherStatsResponse(BaseModel):
    summary: TeacherStatsSummary
    weak_topics: list[TeacherStatsWeakTopicItem] = Field(default_factory=list)
    student_distribution: TeacherStatsStudentDistribution
