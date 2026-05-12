from typing import Optional

from models.base_model import TimestampModel
from models.enums import ActiveStatus


class DocumentModel(TimestampModel):
    document_id: Optional[int] = None

    teacher_id: int
    subject_id: int

    topic_id: Optional[int] = None

    title: str
    description: Optional[str] = None

    file_url: str
    file_hash: Optional[str] = None

    file_type: str
    file_size: int

    status: ActiveStatus = ActiveStatus.ACTIVE