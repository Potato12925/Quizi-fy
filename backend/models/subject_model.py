from typing import Optional

from models.base_model import TimestampModel
from models.enums import ActiveStatus


class SubjectModel(TimestampModel):
    subject_id: Optional[int] = None

    subject_code: str
    subject_name: str

    description: Optional[str] = None

    status: ActiveStatus = ActiveStatus.ACTIVE


class TopicModel(TimestampModel):
    topic_id: Optional[int] = None

    subject_id: int

    topic_name: str

    description: Optional[str] = None


class ClassSubjectModel(TimestampModel):
    class_subject_id: Optional[int] = None

    class_id: int
    subject_id: int

    assigned_teacher_id: Optional[int] = None

    status: ActiveStatus = ActiveStatus.ACTIVE