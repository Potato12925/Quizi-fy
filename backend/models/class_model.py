from typing import Optional

from models.base_model import TimestampModel
from models.enums import ActiveStatus


class ClassModel(TimestampModel):
    class_id: Optional[int] = None

    class_code: str
    class_name: str

    description: Optional[str] = None

    owner_id: int

    status: ActiveStatus = ActiveStatus.ACTIVE


class ClassStudentModel(TimestampModel):
    class_student_id: Optional[int] = None

    class_id: int
    student_id: int

    invited_by: int


class ClassTeacherModel(TimestampModel):
    class_teacher_id: Optional[int] = None

    class_id: int
    teacher_id: int

    added_by: int