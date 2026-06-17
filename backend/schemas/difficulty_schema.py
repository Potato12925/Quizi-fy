from typing import Literal


QuestionDifficulty = Literal["recognition", "comprehension", "application", "advanced"]
PracticeQuestionDifficulty = Literal["recognition", "comprehension", "application", "advanced", "mix"]

QUESTION_DIFFICULTIES = {
    "recognition",
    "comprehension",
    "application",
    "advanced",
}

PRACTICE_QUESTION_DIFFICULTIES = {
    "recognition",
    "comprehension",
    "application",
    "advanced",
    "mix",
}

DIFFICULTY_LABELS = {
    "recognition": "Nhận biết",
    "comprehension": "Thông hiểu",
    "application": "Vận dụng",
    "advanced": "Vận dụng cao",
}
