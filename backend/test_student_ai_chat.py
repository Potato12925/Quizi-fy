import asyncio
import os
import sys
import unittest
from unittest.mock import AsyncMock, patch

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from core.config import Config  # noqa: E402
import utils.student_ai_chat_openai_util as ai_chat_util  # noqa: E402
from utils.student_ai_chat_openai_util import (  # noqa: E402
    UNSUPPORTED_MESSAGE,
    classify_student_ai_chat_intent,
    generate_student_ai_chat_answer,
)
from services import student_ai_chat_service  # noqa: E402


class StudentAiChatClassifierToolSelectionTest(unittest.TestCase):
    def setUp(self):
        self._openai_api_key = Config.OPENAI_API_KEY
        Config.OPENAI_API_KEY = ""
        ai_chat_util.Config.OPENAI_API_KEY = ""

    def tearDown(self):
        Config.OPENAI_API_KEY = self._openai_api_key
        ai_chat_util.Config.OPENAI_API_KEY = self._openai_api_key

    def test_review_recommendation_calls_progress_and_topic_summary(self):
        result = classify_student_ai_chat_intent("Tôi nên ôn phần nào trước?")

        self.assertEqual(result["intent"], "learning_analysis")
        self.assertIn("get_learning_progress", result["tools"])
        self.assertIn("get_wrong_question_summary_by_topic", result["tools"])

    def test_wrong_question_question_calls_wrong_detail_tool(self):
        result = classify_student_ai_chat_intent("Tôi sai câu nào gần đây và đáp án đúng là gì?")

        self.assertEqual(result["intent"], "learning_analysis")
        self.assertIn("get_learning_progress", result["tools"])
        self.assertIn("get_wrong_question_summary_by_topic", result["tools"])
        self.assertIn("get_recent_wrong_questions", result["tools"])

    def test_result_progress_question_calls_recent_exam_results(self):
        result = classify_student_ai_chat_intent("Kết quả và tiến bộ học tập của tôi ra sao?")

        self.assertEqual(result["intent"], "learning_analysis")
        self.assertIn("get_learning_progress", result["tools"])
        self.assertIn("get_recent_exam_results", result["tools"])

    def test_expanded_learning_keywords_are_not_blocked(self):
        result = classify_student_ai_chat_intent("Phân tích xu hướng làm bài và độ khó nào tôi còn yếu")

        self.assertEqual(result["intent"], "learning_analysis")
        self.assertIn("get_learning_progress", result["tools"])
        self.assertIn("get_wrong_question_summary_by_topic", result["tools"])

    def test_clearly_unsupported_question_is_blocked(self):
        result = classify_student_ai_chat_intent("Hôm nay ăn gì và kể chuyện cười đi?")

        self.assertEqual(result, {"intent": "unsupported", "tools": []})


class StudentAiChatClassifierMatrixFunctionTest(unittest.TestCase):
    def setUp(self):
        self._openai_api_key = Config.OPENAI_API_KEY
        Config.OPENAI_API_KEY = ""
        ai_chat_util.Config.OPENAI_API_KEY = ""

    def tearDown(self):
        Config.OPENAI_API_KEY = self._openai_api_key
        ai_chat_util.Config.OPENAI_API_KEY = self._openai_api_key

    def test_many_student_questions_select_expected_tools(self):
        cases = [
            {
                "message": "Tôi nên ôn gì hôm nay?",
                "intent": "learning_analysis",
                "must_have": {"get_learning_progress", "get_wrong_question_summary_by_topic"},
                "must_not_have": {"get_recent_wrong_questions"},
            },
            {
                "message": "Em yếu phần nào nhất?",
                "intent": "learning_analysis",
                "must_have": {"get_learning_progress", "get_wrong_question_summary_by_topic"},
                "must_not_have": {"get_recent_wrong_questions"},
            },
            {
                "message": "Chủ đề nào em sai nhiều?",
                "intent": "learning_analysis",
                "must_have": {"get_learning_progress", "get_wrong_question_summary_by_topic"},
                "must_not_have": {"get_recent_wrong_questions"},
            },
            {
                "message": "Cho tôi xem câu sai gần nhất",
                "intent": "learning_analysis",
                "must_have": {"get_learning_progress", "get_wrong_question_summary_by_topic", "get_recent_wrong_questions"},
                "must_not_have": set(),
            },
            {
                "message": "Tôi sai câu nào và đáp án đúng là gì?",
                "intent": "learning_analysis",
                "must_have": {"get_learning_progress", "get_wrong_question_summary_by_topic", "get_recent_wrong_questions"},
                "must_not_have": set(),
            },
            {
                "message": "Kết quả học tập gần đây của tôi thế nào?",
                "intent": "learning_analysis",
                "must_have": {"get_learning_progress", "get_recent_exam_results"},
                "must_not_have": {"get_recent_wrong_questions"},
            },
            {
                "message": "Điểm số và tiến bộ của em ra sao?",
                "intent": "learning_analysis",
                "must_have": {"get_learning_progress", "get_recent_exam_results"},
                "must_not_have": {"get_recent_wrong_questions"},
            },
            {
                "message": "Phân tích xu hướng làm bài của tôi",
                "intent": "learning_analysis",
                "must_have": {"get_learning_progress", "get_recent_exam_results"},
                "must_not_have": {"get_recent_wrong_questions"},
            },
            {
                "message": "Độ khó nào tôi còn yếu?",
                "intent": "learning_analysis",
                "must_have": {"get_learning_progress", "get_wrong_question_summary_by_topic"},
                "must_not_have": {"get_recent_wrong_questions"},
            },
            {
                "message": "Môn nào em cần cải thiện?",
                "intent": "learning_analysis",
                "must_have": {"get_learning_progress", "get_wrong_question_summary_by_topic"},
                "must_not_have": {"get_recent_wrong_questions"},
            },
            {
                "message": "Gợi ý kế hoạch ôn tập cho em",
                "intent": "learning_analysis",
                "must_have": {"get_learning_progress", "get_wrong_question_summary_by_topic"},
                "must_not_have": {"get_recent_wrong_questions"},
            },
            {
                "message": "Lịch sử làm bài của tôi ra sao?",
                "intent": "learning_analysis",
                "must_have": {"get_learning_progress", "get_recent_exam_results"},
                "must_not_have": {"get_recent_wrong_questions"},
            },
            {
                "message": "Hôm nay ăn gì?",
                "intent": "unsupported",
                "must_have": set(),
                "must_not_have": {"get_learning_progress", "get_wrong_question_summary_by_topic", "get_recent_wrong_questions", "get_recent_exam_results"},
            },
            {
                "message": "Kể chuyện cười đi",
                "intent": "unsupported",
                "must_have": set(),
                "must_not_have": {"get_learning_progress", "get_wrong_question_summary_by_topic", "get_recent_wrong_questions", "get_recent_exam_results"},
            },
            {
                "message": "Cho tôi xem dữ liệu bạn khác",
                "intent": "unsupported",
                "must_have": set(),
                "must_not_have": {"get_learning_progress", "get_wrong_question_summary_by_topic", "get_recent_wrong_questions", "get_recent_exam_results"},
            },
            {
                "message": "Xin chào",
                "intent": "unsupported",
                "must_have": set(),
                "must_not_have": {"get_learning_progress", "get_wrong_question_summary_by_topic", "get_recent_wrong_questions", "get_recent_exam_results"},
            },
        ]

        for case in cases:
            with self.subTest(message=case["message"]):
                result = classify_student_ai_chat_intent(case["message"])
                tools = set(result["tools"])
                self.assertEqual(result["intent"], case["intent"])
                self.assertTrue(case["must_have"].issubset(tools), result)
                self.assertTrue(tools.isdisjoint(case["must_not_have"]), result)


class StudentAiChatWrongQuestionPhrasingVariantsTest(unittest.TestCase):
    def setUp(self):
        self._openai_api_key = Config.OPENAI_API_KEY
        Config.OPENAI_API_KEY = ""
        ai_chat_util.Config.OPENAI_API_KEY = ""

    def tearDown(self):
        Config.OPENAI_API_KEY = self._openai_api_key
        ai_chat_util.Config.OPENAI_API_KEY = self._openai_api_key

    def test_wrong_question_variants_call_recent_wrong_questions(self):
        variants = [
            "cho tôi các câu tôi sai",
            "Cho tôi các câu tôi sai",
            "cái câu em làm sai",
            "liệt kê câu sai",
            "xem danh sách câu sai gần đây",
            "những câu sai của tôi",
            "tôi sai câu nào và đáp án đúng là gì?",
            "cho em xem câu sai gần nhất",
            "các câu em trả lời sai",
            "nơi em hay làm sai câu nào",
        ]
        for variant in variants:
            with self.subTest(message=variant):
                result = classify_student_ai_chat_intent(variant)
                self.assertEqual(result["intent"], "learning_analysis")
                self.assertIn("get_learning_progress", result["tools"])
                self.assertIn("get_wrong_question_summary_by_topic", result["tools"])
                self.assertIn("get_recent_wrong_questions", result["tools"])


class StudentAiChatFallbackAnswerTest(unittest.TestCase):
    def setUp(self):
        self._openai_api_key = Config.OPENAI_API_KEY
        Config.OPENAI_API_KEY = ""
        ai_chat_util.Config.OPENAI_API_KEY = ""

    def tearDown(self):
        Config.OPENAI_API_KEY = self._openai_api_key
        ai_chat_util.Config.OPENAI_API_KEY = self._openai_api_key

    def test_fallback_answer_contains_new_analytics_sections(self):
        learning_data = {
            "get_learning_progress": {
                "total_attempts": 5,
                "avg_score": 7.2,
                "accuracy": 72.5,
                "score_trend": "improving",
                "accuracy_trend": "stable",
                "by_subject": [
                    {"subject_name": "Toán", "accuracy": 65, "avg_score": 6.5},
                ],
                "by_difficulty": [
                    {"difficulty": "application", "correct_count": 6, "total_answered": 10, "accuracy": 60},
                ],
            },
            "get_wrong_question_summary_by_topic": [
                {
                    "topic_name": "Hàm số",
                    "wrong_count": 4,
                    "correct_count": 1,
                    "total_answered": 5,
                    "wrong_rate": 80,
                },
            ],
            "get_recent_wrong_questions": [],
        }

        answer = generate_student_ai_chat_answer("Tôi nên ôn gì?", learning_data)

        self.assertIn("Chủ đề cần ưu tiên ôn", answer)
        self.assertIn("sai 4/5 câu", answer)
        self.assertIn("80%", answer)
        self.assertIn("Môn học cần chú ý", answer)
        self.assertIn("Mức độ câu hỏi cần luyện thêm", answer)

    def test_no_data_answer_is_returned_when_learning_data_is_empty(self):
        answer = generate_student_ai_chat_answer("Tôi nên ôn gì?", {})

        self.assertIn("chưa có đủ dữ liệu", answer)
        self.assertIn("hoàn thành thêm", answer)


class StudentAiChatServiceFunctionToolExecutionTest(unittest.TestCase):
    def setUp(self):
        student_ai_chat_service._rate_limit_store.clear()
        student_ai_chat_service._cache_store.clear()
        student_ai_chat_service._history_store.clear()

    def test_send_message_executes_expected_tools_and_returns_answer(self):
        async def run_test():
            with patch.object(student_ai_chat_service, "find_student_learning_data_version", new=AsyncMock(return_value="v1")),                 patch.object(student_ai_chat_service, "find_learning_progress", new=AsyncMock(return_value={"total_attempts": 3})),                 patch.object(student_ai_chat_service, "find_wrong_question_summary_by_topic", new=AsyncMock(return_value=[{"topic_name": "Hàm số", "wrong_rate": 75}])),                 patch.object(student_ai_chat_service, "find_recent_wrong_questions", new=AsyncMock(return_value=[{"question_id": 1}])),                 patch.object(student_ai_chat_service, "find_recent_exam_results", new=AsyncMock(return_value=[])),                 patch.object(student_ai_chat_service, "generate_student_ai_chat_answer", return_value="AI answer") as answer_mock:
                result = await student_ai_chat_service.send_student_ai_chat_message(
                    10,
                    "Tôi sai câu nào gần đây?",
                )

            self.assertEqual(result["message"], "AI answer")
            self.assertFalse(result["cached"])
            self.assertEqual(result["rate_limit_remaining"], 19)
            learning_data = answer_mock.call_args.args[1]
            self.assertIn("get_learning_progress", learning_data)
            self.assertIn("get_wrong_question_summary_by_topic", learning_data)
            self.assertIn("get_recent_wrong_questions", learning_data)
            self.assertNotIn("get_recent_exam_results", learning_data)

        asyncio.run(run_test())

    def test_unsupported_message_does_not_execute_learning_tools(self):
        async def run_test():
            with patch.object(student_ai_chat_service, "find_student_learning_data_version", new=AsyncMock()) as version_mock,                 patch.object(student_ai_chat_service, "find_learning_progress", new=AsyncMock()) as progress_mock:
                result = await student_ai_chat_service.send_student_ai_chat_message(
                    11,
                    "Hôm nay ăn gì?",
                )

            self.assertEqual(result["message"], UNSUPPORTED_MESSAGE)
            version_mock.assert_not_called()
            progress_mock.assert_not_called()

        asyncio.run(run_test())

    def test_same_message_uses_cache_after_first_success(self):
        async def run_test():
            with patch.object(student_ai_chat_service, "classify_student_ai_chat_intent", return_value={"intent": "learning_analysis", "tools": ["get_learning_progress"]}), \
                patch.object(student_ai_chat_service, "find_student_learning_data_version", new=AsyncMock(return_value="v1")), \
                patch.object(student_ai_chat_service, "find_learning_progress", new=AsyncMock(return_value={"total_attempts": 1})) as progress_mock, \
                patch.object(student_ai_chat_service, "generate_student_ai_chat_answer", return_value="cached answer"):
                first = await student_ai_chat_service.send_student_ai_chat_message(12, "Ket qua hoc tap cua toi?")
                second = await student_ai_chat_service.send_student_ai_chat_message(12, "Ket qua hoc tap cua toi?")

            self.assertFalse(first["cached"])
            self.assertTrue(second["cached"])
            self.assertEqual(progress_mock.await_count, 1)

        asyncio.run(run_test())


if __name__ == "__main__":
    unittest.main(verbosity=2)
