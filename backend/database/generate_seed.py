from __future__ import annotations

import argparse
import asyncio
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from core.supabase import SupabaseManager, run_supabase_execute


PASSWORD_HASH = "$2b$12$2PG4GGwGcNh8u2fjrdTVKe41hbycEVsuCsviJxCQrC15zaDuanWLO"


USERS = [
    ("admin", "System Administrator", True, False),
    ("teacher01", "Nguyen Anh Dung", True, False),
    ("teacher02", "Tran Thu Ha", True, False),
    ("teacher03", "Pham Quang Minh", True, False),
    ("teacher04", "Le Bao Chau", True, False),
    ("teacher05", "Do Hai Nam", True, False),
    ("student01", "Nguyen Van An", True, False),
    ("student02", "Tran Thi Binh", True, False),
    ("student03", "Le Minh Chau", True, False),
    ("student04", "Pham Gia Huy", True, False),
    ("student05", "Vo Thanh Long", True, False),
    ("student06", "Bui Khanh Linh", True, False),
    ("student07", "Dang Thu Trang", True, False),
    ("student08", "Hoang Duc Viet", True, False),
    ("student09", "Nguyen Tuan Kiet", True, False),
    ("student10", "Trinh Ngoc Mai", True, False),
    ("student11", "Duong Bao Nhi", True, False),
    ("student12", "Pham Trung Tin", True, False),
]

ROLES = [
    ("admin", "Administrator", "System administrator"),
    ("teacher", "Teacher", "Teacher role"),
    ("student", "Student", "Student role"),
]

CLASSES = [
    ("SE0601", "Software Engineering 01", "Backend and web practice class", "teacher01"),
    ("SE0602", "Software Engineering 02", "Software testing and deployment class", "teacher03"),
    ("AI0601", "Artificial Intelligence 01", "Machine learning foundation class", "teacher02"),
    ("DS0601", "Data Science 01", "Data analysis and visualization class", "teacher04"),
]

SUBJECTS = [
    ("PRN212", "Web Development", "Frontend and backend development"),
    ("DBI202", "Database Systems", "Database design and SQL"),
    ("AIL302", "Machine Learning", "Machine learning fundamentals"),
    ("MAD301", "Data Analysis", "Data cleaning and analytics"),
    ("SWE201", "Software Testing", "Testing strategy and automation"),
]

CLASS_TEACHERS = [
    ("SE0601", "teacher01"),
    ("SE0601", "teacher05"),
    ("SE0602", "teacher03"),
    ("SE0602", "teacher01"),
    ("AI0601", "teacher02"),
    ("AI0601", "teacher04"),
    ("DS0601", "teacher04"),
    ("DS0601", "teacher02"),
]

CLASS_SUBJECTS = [
    ("SE0601", "PRN212", "teacher01"),
    ("SE0601", "DBI202", "teacher05"),
    ("SE0601", "SWE201", "teacher03"),
    ("SE0602", "PRN212", "teacher01"),
    ("SE0602", "SWE201", "teacher03"),
    ("AI0601", "AIL302", "teacher02"),
    ("AI0601", "MAD301", "teacher04"),
    ("DS0601", "DBI202", "teacher05"),
    ("DS0601", "MAD301", "teacher04"),
]

TOPICS = [
    ("SE0601", "PRN212", "ReactJS Basics", "Component structure, props, and state"),
    ("SE0601", "PRN212", "REST API Integration", "Calling APIs from frontend applications"),
    ("SE0601", "DBI202", "PostgreSQL Basics", "SQL query, filter, and join fundamentals"),
    ("SE0601", "DBI202", "Database Indexing", "Using indexes to improve query performance"),
    ("SE0601", "SWE201", "Unit Testing", "Write automated unit tests for services"),
    ("SE0602", "PRN212", "Authentication Flow", "Login, JWT, and route protection"),
    ("SE0602", "SWE201", "Integration Testing", "Verify module interaction and API flows"),
    ("SE0602", "SWE201", "Test Case Design", "Boundary value and equivalence partitioning"),
    ("AI0601", "AIL302", "Linear Regression", "Supervised learning with numerical targets"),
    ("AI0601", "AIL302", "Classification Metrics", "Accuracy, precision, recall, and F1"),
    ("AI0601", "AIL302", "Neural Networks", "Basic multilayer perceptron concepts"),
    ("AI0601", "MAD301", "Data Cleaning", "Handle null values and inconsistent records"),
    ("AI0601", "MAD301", "Feature Engineering", "Transform raw data into model features"),
    ("DS0601", "DBI202", "Advanced SQL", "Common table expressions and window functions"),
    ("DS0601", "MAD301", "Data Visualization", "Communicate data with dashboards"),
    ("DS0601", "MAD301", "Exploratory Data Analysis", "Summarize trends and anomalies"),
]

CLASS_STUDENTS = [
    ("SE0601", "student01"),
    ("SE0601", "student02"),
    ("SE0601", "student03"),
    ("SE0601", "student04"),
    ("SE0601", "student05"),
    ("SE0602", "student06"),
    ("SE0602", "student07"),
    ("SE0602", "student08"),
    ("AI0601", "student03"),
    ("AI0601", "student09"),
    ("AI0601", "student10"),
    ("AI0601", "student11"),
    ("DS0601", "student05"),
    ("DS0601", "student08"),
    ("DS0601", "student10"),
    ("DS0601", "student12"),
]

DOCUMENTS = [
    ("teacher01", "ReactJS Introduction", "Core React concepts for beginners", "https://example.com/docs/react-introduction.pdf", "hash_doc_001", "pdf", 2048000),
    ("teacher01", "REST API Guide", "HTTP methods, status codes, and integration patterns", "https://example.com/docs/rest-api-guide.pdf", "hash_doc_002", "pdf", 1572864),
    ("teacher05", "PostgreSQL Query Handbook", "SQL examples for select, join, aggregate, and subquery", "https://example.com/docs/postgresql-query-handbook.pdf", "hash_doc_003", "pdf", 2621440),
    ("teacher05", "Database Index Tuning", "Index selection and explain analyze examples", "https://example.com/docs/database-index-tuning.docx", "hash_doc_004", "docx", 1433600),
    ("teacher03", "Unit Testing Fundamentals", "Arrange act assert and test isolation", "https://example.com/docs/unit-testing-fundamentals.pdf", "hash_doc_005", "pdf", 1769472),
    ("teacher03", "Integration Testing Checklist", "Database, API, and queue integration testing patterns", "https://example.com/docs/integration-testing-checklist.pdf", "hash_doc_006", "pdf", 1887436),
    ("teacher02", "Linear Regression Notes", "Regression intuition, cost function, and gradient descent", "https://example.com/docs/linear-regression-notes.pdf", "hash_doc_007", "pdf", 2195456),
    ("teacher02", "Classification Metrics Workbook", "Confusion matrix and evaluation metric examples", "https://example.com/docs/classification-metrics-workbook.pdf", "hash_doc_008", "pdf", 1654784),
    ("teacher02", "Neural Network Basics", "Perceptron, activation function, and backpropagation summary", "https://example.com/docs/neural-network-basics.pdf", "hash_doc_009", "pdf", 3145728),
    ("teacher04", "Data Cleaning Playbook", "Practical cleaning workflow for tabular datasets", "https://example.com/docs/data-cleaning-playbook.pdf", "hash_doc_010", "pdf", 2088960),
    ("teacher04", "Feature Engineering Toolkit", "Encoding, scaling, and transformation techniques", "https://example.com/docs/feature-engineering-toolkit.pdf", "hash_doc_011", "pdf", 2457600),
    ("teacher04", "Data Visualization Handbook", "Chart selection and dashboard storytelling basics", "https://example.com/docs/data-visualization-handbook.pdf", "hash_doc_012", "pdf", 1933312),
]

DOCUMENT_TOPICS = [
    ("ReactJS Introduction", "ReactJS Basics"),
    ("REST API Guide", "REST API Integration"),
    ("PostgreSQL Query Handbook", "PostgreSQL Basics"),
    ("Database Index Tuning", "Database Indexing"),
    ("Unit Testing Fundamentals", "Unit Testing"),
    ("Integration Testing Checklist", "Integration Testing"),
    ("Linear Regression Notes", "Linear Regression"),
    ("Classification Metrics Workbook", "Classification Metrics"),
    ("Neural Network Basics", "Neural Networks"),
    ("Data Cleaning Playbook", "Data Cleaning"),
    ("Feature Engineering Toolkit", "Feature Engineering"),
    ("Data Visualization Handbook", "Data Visualization"),
]

AI_REQUESTS = [
    ("ReactJS Introduction", 12, "easy", "Sections 1-2", "completed", 12, 0, None, True),
    ("REST API Guide", 10, "medium", "Full document", "completed", 10, 1, None, True),
    ("PostgreSQL Query Handbook", 15, "medium", "Select and join chapters", "completed", 15, 0, None, True),
    ("Database Index Tuning", 8, "hard", "Indexing chapter only", "processing", 4, 1, None, False),
    ("Unit Testing Fundamentals", 10, "easy", "Core concepts only", "completed", 10, 0, None, True),
    ("Integration Testing Checklist", 6, "medium", "API and database sections", "pending", 0, 0, None, False),
    ("Linear Regression Notes", 12, "easy", "Theory and formulas", "completed", 12, 0, None, True),
    ("Neural Network Basics", 10, "hard", "Backpropagation section", "failed", 3, 2, "LLM output formatting error", False),
    ("Data Cleaning Playbook", 9, "easy", "Missing value and duplicate sections", "completed", 9, 0, None, True),
    ("Feature Engineering Toolkit", 7, "medium", "Encoding methods", "cancelled", 0, 0, "Cancelled by teacher", False),
]

QUESTIONS = [
    ("teacher01", "ReactJS Introduction", "What is the main purpose of ReactJS?", "easy", "ai", "approved", "ReactJS is mainly used to build user interfaces from reusable components."),
    ("teacher01", "ReactJS Introduction", "Which React feature allows data to be passed from parent to child components?", "easy", "manual", "approved", "Props are the standard way to pass data from parent components to children."),
    ("teacher01", "REST API Guide", "Which HTTP method is commonly used to create a new resource?", "medium", "manual", "approved", "POST is commonly used when the client requests creation of a new resource."),
    ("teacher01", "REST API Guide", "Which status code usually indicates a successful GET request?", "easy", "ai", "approved", "Status code 200 OK signals a successful standard GET request."),
    ("teacher05", "PostgreSQL Query Handbook", "Which SQL clause is used to combine rows from two tables based on a related column?", "easy", "ai", "approved", "JOIN combines rows from related tables using matching keys."),
    ("teacher05", "PostgreSQL Query Handbook", "Which aggregate function returns the number of rows in a result set?", "easy", "manual", "approved", "COUNT returns the number of rows that match the query scope."),
    ("teacher05", "Database Index Tuning", "What is a common benefit of adding an index to a frequently filtered column?", "medium", "ai", "draft", "An index can reduce scan cost and improve lookup speed for selective filters."),
    ("teacher03", "Unit Testing Fundamentals", "What does the assert step verify in a unit test?", "easy", "manual", "approved", "The assert step checks whether the observed result matches the expected outcome."),
    ("teacher03", "Integration Testing Checklist", "What is the goal of an integration test?", "medium", "ai", "approved", "Integration tests validate that multiple components work correctly together."),
    ("teacher02", "Linear Regression Notes", "What does linear regression predict?", "easy", "ai", "approved", "Linear regression predicts a continuous numerical value."),
    ("teacher02", "Classification Metrics Workbook", "Precision measures which of the following?", "medium", "manual", "approved", "Precision measures how many predicted positives are actually positive."),
    ("teacher02", "Neural Network Basics", "What is the role of an activation function in a neural network?", "hard", "ai", "draft", "Activation functions introduce non-linearity so the network can model complex patterns."),
    ("teacher04", "Data Cleaning Playbook", "How should duplicate rows usually be handled during data cleaning?", "easy", "manual", "approved", "They should be reviewed and removed or merged depending on business rules."),
    ("teacher04", "Feature Engineering Toolkit", "Why is feature scaling useful for many machine learning algorithms?", "medium", "ai", "approved", "Scaling keeps features on comparable ranges and helps optimization converge more reliably."),
    ("teacher04", "Data Visualization Handbook", "Which chart is most suitable for showing a trend over time?", "easy", "manual", "approved", "A line chart is usually the clearest option for trends across ordered time points."),
    ("teacher04", "Data Visualization Handbook", "What is an important principle when designing dashboards?", "medium", "ai", "approved", "Dashboards should emphasize clarity, hierarchy, and actionable insight instead of clutter."),
]

QUESTION_OPTIONS = [
    ("What is the main purpose of ReactJS?", "A", "Build user interfaces", True, 1),
    ("What is the main purpose of ReactJS?", "B", "Manage network routers", False, 2),
    ("What is the main purpose of ReactJS?", "C", "Compile SQL queries", False, 3),
    ("What is the main purpose of ReactJS?", "D", "Encrypt application secrets", False, 4),
    ("Which React feature allows data to be passed from parent to child components?", "A", "Reducers", False, 1),
    ("Which React feature allows data to be passed from parent to child components?", "B", "Props", True, 2),
    ("Which React feature allows data to be passed from parent to child components?", "C", "Hooks", False, 3),
    ("Which React feature allows data to be passed from parent to child components?", "D", "Refs", False, 4),
    ("Which HTTP method is commonly used to create a new resource?", "A", "GET", False, 1),
    ("Which HTTP method is commonly used to create a new resource?", "B", "POST", True, 2),
    ("Which HTTP method is commonly used to create a new resource?", "C", "DELETE", False, 3),
    ("Which HTTP method is commonly used to create a new resource?", "D", "HEAD", False, 4),
    ("Which status code usually indicates a successful GET request?", "A", "200", True, 1),
    ("Which status code usually indicates a successful GET request?", "B", "301", False, 2),
    ("Which status code usually indicates a successful GET request?", "C", "404", False, 3),
    ("Which status code usually indicates a successful GET request?", "D", "500", False, 4),
    ("Which SQL clause is used to combine rows from two tables based on a related column?", "A", "ORDER BY", False, 1),
    ("Which SQL clause is used to combine rows from two tables based on a related column?", "B", "JOIN", True, 2),
    ("Which SQL clause is used to combine rows from two tables based on a related column?", "C", "GROUP BY", False, 3),
    ("Which SQL clause is used to combine rows from two tables based on a related column?", "D", "HAVING", False, 4),
    ("Which aggregate function returns the number of rows in a result set?", "A", "SUM", False, 1),
    ("Which aggregate function returns the number of rows in a result set?", "B", "MAX", False, 2),
    ("Which aggregate function returns the number of rows in a result set?", "C", "COUNT", True, 3),
    ("Which aggregate function returns the number of rows in a result set?", "D", "AVG", False, 4),
    ("What is a common benefit of adding an index to a frequently filtered column?", "A", "Faster lookups", True, 1),
    ("What is a common benefit of adding an index to a frequently filtered column?", "B", "Larger API payloads", False, 2),
    ("What is a common benefit of adding an index to a frequently filtered column?", "C", "Automatic backups", False, 3),
    ("What is a common benefit of adding an index to a frequently filtered column?", "D", "More table columns", False, 4),
    ("What does the assert step verify in a unit test?", "A", "The expected result matches the actual result", True, 1),
    ("What does the assert step verify in a unit test?", "B", "The test framework version", False, 2),
    ("What does the assert step verify in a unit test?", "C", "Database migration order", False, 3),
    ("What does the assert step verify in a unit test?", "D", "Deployment pipeline permissions", False, 4),
    ("What is the goal of an integration test?", "A", "Validate component interaction", True, 1),
    ("What is the goal of an integration test?", "B", "Replace all unit tests", False, 2),
    ("What is the goal of an integration test?", "C", "Generate UI designs", False, 3),
    ("What is the goal of an integration test?", "D", "Optimize CSS selectors", False, 4),
    ("What does linear regression predict?", "A", "A continuous value", True, 1),
    ("What does linear regression predict?", "B", "A random string", False, 2),
    ("What does linear regression predict?", "C", "A file system path", False, 3),
    ("What does linear regression predict?", "D", "A SQL transaction lock", False, 4),
    ("Precision measures which of the following?", "A", "True negatives over all negatives", False, 1),
    ("Precision measures which of the following?", "B", "Correct positive predictions over all positive predictions", True, 2),
    ("Precision measures which of the following?", "C", "Correct predictions over all samples", False, 3),
    ("Precision measures which of the following?", "D", "False negatives over all positives", False, 4),
    ("What is the role of an activation function in a neural network?", "A", "Store passwords", False, 1),
    ("What is the role of an activation function in a neural network?", "B", "Add non-linearity", True, 2),
    ("What is the role of an activation function in a neural network?", "C", "Sort dataset rows", False, 3),
    ("What is the role of an activation function in a neural network?", "D", "Compress database tables", False, 4),
    ("How should duplicate rows usually be handled during data cleaning?", "A", "Ignore them always", False, 1),
    ("How should duplicate rows usually be handled during data cleaning?", "B", "Delete every row in the table", False, 2),
    ("How should duplicate rows usually be handled during data cleaning?", "C", "Review and remove or merge based on rules", True, 3),
    ("How should duplicate rows usually be handled during data cleaning?", "D", "Convert them to charts", False, 4),
    ("Why is feature scaling useful for many machine learning algorithms?", "A", "It standardizes ranges for more stable optimization", True, 1),
    ("Why is feature scaling useful for many machine learning algorithms?", "B", "It guarantees perfect accuracy", False, 2),
    ("Why is feature scaling useful for many machine learning algorithms?", "C", "It removes all outliers automatically", False, 3),
    ("Why is feature scaling useful for many machine learning algorithms?", "D", "It creates database indexes", False, 4),
    ("Which chart is most suitable for showing a trend over time?", "A", "Line chart", True, 1),
    ("Which chart is most suitable for showing a trend over time?", "B", "Pie chart", False, 2),
    ("Which chart is most suitable for showing a trend over time?", "C", "Scatter chart only", False, 3),
    ("Which chart is most suitable for showing a trend over time?", "D", "Treemap", False, 4),
    ("What is an important principle when designing dashboards?", "A", "Clarity and hierarchy", True, 1),
    ("What is an important principle when designing dashboards?", "B", "Maximum decoration and animation", False, 2),
    ("What is an important principle when designing dashboards?", "C", "Hide all labels", False, 3),
    ("What is an important principle when designing dashboards?", "D", "Use the same color for everything", False, 4),
]

QUESTION_HISTORY = [
    ("What is the main purpose of ReactJS?", "teacher01", {"status": "draft"}, {"status": "approved"}, "status_update"),
    ("Which HTTP method is commonly used to create a new resource?", "teacher01", {"source": "ai", "content": "Which HTTP method creates data?"}, {"source": "manual", "content": "Which HTTP method is commonly used to create a new resource?"}, "content_revision"),
    ("What is the goal of an integration test?", "teacher03", {"status": "draft"}, {"status": "approved"}, "review_approved"),
]

PRACTICE_SETS = [
    ("student01", "PRN212", "ReactJS Introduction", "easy", 5, 4, 15, True),
    ("student02", "DBI202", "PostgreSQL Query Handbook", "easy", 5, 4, 20, False),
    ("student03", "AIL302", "Linear Regression Notes", "easy", 5, 3, 20, True),
    ("student05", "MAD301", "Data Visualization Handbook", "easy", 5, 2, 10, False),
    ("student06", "SWE201", "Integration Testing Checklist", "medium", 5, 2, 25, True),
    ("student10", "MAD301", "Feature Engineering Toolkit", "medium", 5, 2, 20, True),
]

PRACTICE_SET_QUESTIONS = [
    ("student01", "What is the main purpose of ReactJS?", 1),
    ("student01", "Which React feature allows data to be passed from parent to child components?", 2),
    ("student01", "Which HTTP method is commonly used to create a new resource?", 3),
    ("student01", "Which status code usually indicates a successful GET request?", 4),
    ("student02", "Which SQL clause is used to combine rows from two tables based on a related column?", 1),
    ("student02", "Which aggregate function returns the number of rows in a result set?", 2),
    ("student02", "What is a common benefit of adding an index to a frequently filtered column?", 3),
    ("student02", "What is the goal of an integration test?", 4),
    ("student03", "What does linear regression predict?", 1),
    ("student03", "Precision measures which of the following?", 2),
    ("student03", "What is the role of an activation function in a neural network?", 3),
    ("student05", "Which chart is most suitable for showing a trend over time?", 1),
    ("student05", "What is an important principle when designing dashboards?", 2),
    ("student06", "What is the goal of an integration test?", 1),
    ("student06", "What does the assert step verify in a unit test?", 2),
    ("student10", "Why is feature scaling useful for many machine learning algorithms?", 1),
    ("student10", "How should duplicate rows usually be handled during data cleaning?", 2),
]

PRACTICE_ATTEMPTS = [
    ("student01", "submitted", 75.00, 3, 1, 2, 12),
    ("student01", "in_progress", None, 0, 0, 1, None),
    ("student02", "submitted", 50.00, 2, 2, 3, 18),
    ("student03", "submitted", 66.67, 2, 1, 4, 20),
    ("student05", "submitted", 100.00, 2, 0, 0, 8),
    ("student06", "timeout", 50.00, 1, 1, 0, 26),
    ("student10", "submitted", 50.00, 1, 1, 0, 14),
]

STUDENT_ANSWERS = [
    (1, "What is the main purpose of ReactJS?", "A", True),
    (1, "Which React feature allows data to be passed from parent to child components?", "B", True),
    (1, "Which HTTP method is commonly used to create a new resource?", "B", True),
    (1, "Which status code usually indicates a successful GET request?", "B", False),
    (3, "Which SQL clause is used to combine rows from two tables based on a related column?", "B", True),
    (3, "Which aggregate function returns the number of rows in a result set?", "C", True),
    (3, "What is a common benefit of adding an index to a frequently filtered column?", "B", False),
    (3, "What is the goal of an integration test?", "B", False),
    (4, "What does linear regression predict?", "A", True),
    (4, "Precision measures which of the following?", "B", True),
    (4, "What is the role of an activation function in a neural network?", "A", False),
    (5, "Which chart is most suitable for showing a trend over time?", "A", True),
    (5, "What is an important principle when designing dashboards?", "A", True),
    (6, "What is the goal of an integration test?", "A", True),
    (6, "What does the assert step verify in a unit test?", "D", False),
    (7, "Why is feature scaling useful for many machine learning algorithms?", "A", True),
    (7, "How should duplicate rows usually be handled during data cleaning?", "A", False),
]

NOTIFICATIONS = [
    ("student01", "New Practice Set Assigned", "You have a new PRN212 practice set based on ReactJS Introduction.", False),
    ("student02", "Practice Attempt Submitted", "Your DBI202 practice attempt has been recorded.", True),
    ("student03", "AI Questions Ready", "Questions generated from Linear Regression Notes are available.", False),
    ("student05", "Perfect Score", "You completed the visualization practice set with a full score.", False),
    ("student06", "Attempt Timed Out", "Your SWE201 attempt reached the configured time limit.", False),
    ("teacher01", "AI Request Completed", "The AI request for ReactJS Introduction finished successfully.", False),
    ("teacher02", "AI Request Failed", "The AI request for Neural Network Basics needs review.", False),
    ("teacher03", "Question Approved", "An integration testing question was approved and published.", True),
    ("teacher04", "New Student Activity", "A student completed the dashboard visualization practice set.", False),
    ("teacher05", "Database Practice Running", "Students have started the PostgreSQL practice sets.", False),
]


RESET_ORDER = [
    ("student_answers", "answer_id"),
    ("practice_attempts", "attempt_id"),
    ("practice_set_questions", "practice_set_question_id"),
    ("practice_sets", "practice_set_id"),
    ("question_options", "option_id"),
    ("question_history", "history_id"),
    ("questions", "question_id"),
    ("ai_requests", "request_id"),
    ("document_topics", "document_topic_id"),
    ("documents", "document_id"),
    ("topics", "topic_id"),
    ("class_students", "class_student_id"),
    ("class_subjects", "class_subject_id"),
    ("class_teachers", "class_teacher_id"),
    ("subjects", "subject_id"),
    ("classes", "class_id"),
    ("user_roles", "user_role_id"),
    ("roles", "role_id"),
    ("notifications", "notification_id"),
    ("users", "user_id"),
]


class Seeder:
    def __init__(self) -> None:
        self.supabase = SupabaseManager.get_client()
        self.user_ids: dict[str, int] = {}
        self.role_ids: dict[str, int] = {}
        self.class_ids: dict[str, int] = {}
        self.subject_ids: dict[str, int] = {}
        self.class_subject_ids: dict[tuple[str, str], int] = {}
        self.topic_ids: dict[str, int] = {}
        self.document_ids: dict[str, int] = {}
        self.document_topic_ids: dict[str, int] = {}
        self.ai_request_ids: dict[str, int] = {}
        self.question_ids: dict[str, int] = {}
        self.practice_set_ids: dict[str, int] = {}
        self.practice_attempt_ids: dict[int, int] = {}

    def execute(self, operation):
        return asyncio.run(run_supabase_execute(operation))

    def insert_rows(self, table: str, rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not rows:
            return []
        response = self.execute(lambda: self.supabase.table(table).insert(rows).execute())
        return response.data or []

    def delete_all(self) -> None:
        for table, pk in RESET_ORDER:
            self.execute(lambda table=table, pk=pk: self.supabase.table(table).delete().gt(pk, 0).execute())

    def seed_users(self) -> None:
        rows = [
            {
                "username": username,
                "password_hash": PASSWORD_HASH,
                "full_name": full_name,
                "is_active": is_active,
                "must_change_password": must_change_password,
            }
            for username, full_name, is_active, must_change_password in USERS
        ]
        inserted = self.insert_rows("users", rows)
        self.user_ids = {row["username"]: row["user_id"] for row in inserted}

    def seed_roles(self) -> None:
        inserted = self.insert_rows(
            "roles",
            [{"role_code": code, "role_name": name, "description": desc} for code, name, desc in ROLES],
        )
        self.role_ids = {row["role_code"]: row["role_id"] for row in inserted}

    def seed_user_roles(self) -> None:
        teacher_usernames = {f"teacher0{i}" for i in range(1, 6)}
        student_usernames = {f"student{i:02d}" for i in range(1, 13)}
        rows = []
        for username in self.user_ids:
            if username == "admin":
                role_code = "admin"
            elif username in teacher_usernames:
                role_code = "teacher"
            elif username in student_usernames:
                role_code = "student"
            else:
                continue
            rows.append({"user_id": self.user_ids[username], "role_id": self.role_ids[role_code]})
        self.insert_rows("user_roles", rows)

    def seed_classes(self) -> None:
        rows = [
            {
                "class_code": class_code,
                "class_name": class_name,
                "description": description,
                "teacher_id": self.user_ids[teacher_username],
            }
            for class_code, class_name, description, teacher_username in CLASSES
        ]
        inserted = self.insert_rows("classes", rows)
        self.class_ids = {row["class_code"]: row["class_id"] for row in inserted}

    def seed_subjects(self) -> None:
        inserted = self.insert_rows(
            "subjects",
            [
                {"subject_code": code, "subject_name": name, "description": description}
                for code, name, description in SUBJECTS
            ],
        )
        self.subject_ids = {row["subject_code"]: row["subject_id"] for row in inserted}

    def seed_class_teachers(self) -> None:
        rows = [
            {
                "class_id": self.class_ids[class_code],
                "teacher_id": self.user_ids[teacher_username],
            }
            for class_code, teacher_username in CLASS_TEACHERS
        ]
        self.insert_rows("class_teachers", rows)

    def seed_class_subjects(self) -> None:
        rows = [
            {
                "class_id": self.class_ids[class_code],
                "subject_id": self.subject_ids[subject_code],
                "assigned_teacher_id": self.user_ids[teacher_username],
                "status": "active",
            }
            for class_code, subject_code, teacher_username in CLASS_SUBJECTS
        ]
        inserted = self.insert_rows("class_subjects", rows)
        for row in inserted:
            class_code = next(code for code, class_id in self.class_ids.items() if class_id == row["class_id"])
            subject_code = next(code for code, subject_id in self.subject_ids.items() if subject_id == row["subject_id"])
            self.class_subject_ids[(class_code, subject_code)] = row["class_subject_id"]

    def seed_topics(self) -> None:
        rows = [
            {
                "class_subject_id": self.class_subject_ids[(class_code, subject_code)],
                "topic_name": topic_name,
                "description": description,
            }
            for class_code, subject_code, topic_name, description in TOPICS
        ]
        inserted = self.insert_rows("topics", rows)
        self.topic_ids = {row["topic_name"]: row["topic_id"] for row in inserted}

    def seed_class_students(self) -> None:
        rows = [
            {
                "class_id": self.class_ids[class_code],
                "student_id": self.user_ids[student_username],
            }
            for class_code, student_username in CLASS_STUDENTS
        ]
        self.insert_rows("class_students", rows)

    def seed_documents(self) -> None:
        rows = [
            {
                "teacher_id": self.user_ids[teacher_username],
                "title": title,
                "description": description,
                "file_url": file_url,
                "file_hash": file_hash,
                "file_type": file_type,
                "file_size": file_size,
            }
            for teacher_username, title, description, file_url, file_hash, file_type, file_size in DOCUMENTS
        ]
        inserted = self.insert_rows("documents", rows)
        self.document_ids = {row["title"]: row["document_id"] for row in inserted}

    def seed_document_topics(self) -> None:
        rows = [
            {
                "document_id": self.document_ids[document_title],
                "topic_id": self.topic_ids[topic_name],
            }
            for document_title, topic_name in DOCUMENT_TOPICS
        ]
        inserted = self.insert_rows("document_topics", rows)
        for row in inserted:
            document_title = next(title for title, document_id in self.document_ids.items() if document_id == row["document_id"])
            self.document_topic_ids[document_title] = row["document_topic_id"]

    def seed_ai_requests(self) -> None:
        rows = [
            {
                "document_topic_id": self.document_topic_ids[document_title],
                "num_questions": num_questions,
                "difficulty": difficulty,
                "content_scope": content_scope,
                "status": status,
                "generated_question_count": generated_question_count,
                "retry_count": retry_count,
                "error_message": error_message,
                "is_reviewed": is_reviewed,
            }
            for document_title, num_questions, difficulty, content_scope, status, generated_question_count, retry_count, error_message, is_reviewed in AI_REQUESTS
        ]
        inserted = self.insert_rows("ai_requests", rows)
        for row in inserted:
            document_title = next(title for title, document_topic_id in self.document_topic_ids.items() if document_topic_id == row["document_topic_id"])
            if row["status"] in {"completed", "processing", "failed"}:
                self.ai_request_ids.setdefault(document_title, row["request_id"])

    def seed_questions(self) -> None:
        rows = []
        for teacher_username, document_title, content, difficulty, source, status, explanation in QUESTIONS:
            rows.append(
                {
                    "teacher_id": self.user_ids[teacher_username],
                    "document_topic_id": self.document_topic_ids[document_title],
                    "ai_request_id": self.ai_request_ids.get(document_title) if source == "ai" else None,
                    "content": content,
                    "difficulty": difficulty,
                    "source": source,
                    "status": status,
                    "explanation": explanation,
                }
            )
        inserted = self.insert_rows("questions", rows)
        self.question_ids = {row["content"]: row["question_id"] for row in inserted}

    def seed_question_options(self) -> None:
        rows = [
            {
                "question_id": self.question_ids[question_content],
                "option_label": option_label,
                "option_text": option_text,
                "is_correct": is_correct,
                "order_num": order_num,
            }
            for question_content, option_label, option_text, is_correct, order_num in QUESTION_OPTIONS
        ]
        self.insert_rows("question_options", rows)

    def seed_question_history(self) -> None:
        rows = [
            {
                "question_id": self.question_ids[question_content],
                "changed_by": self.user_ids[changed_by_username],
                "old_data": old_data,
                "new_data": new_data,
                "change_type": change_type,
            }
            for question_content, changed_by_username, old_data, new_data, change_type in QUESTION_HISTORY
        ]
        self.insert_rows("question_history", rows)

    def seed_practice_sets(self) -> None:
        rows = [
            {
                "student_id": self.user_ids[student_username],
                "subject_id": self.subject_ids[subject_code],
                "document_topic_id": self.document_topic_ids[document_title],
                "difficulty": difficulty,
                "num_questions_requested": num_questions_requested,
                "num_questions_actual": num_questions_actual,
                "time_limit_minutes": time_limit_minutes,
                "prioritize_unanswered": prioritize_unanswered,
            }
            for student_username, subject_code, document_title, difficulty, num_questions_requested, num_questions_actual, time_limit_minutes, prioritize_unanswered in PRACTICE_SETS
        ]
        inserted = self.insert_rows("practice_sets", rows)
        for row in inserted:
            student_username = next(name for name, user_id in self.user_ids.items() if user_id == row["student_id"])
            self.practice_set_ids[student_username] = row["practice_set_id"]

    def seed_practice_set_questions(self) -> None:
        rows = [
            {
                "practice_set_id": self.practice_set_ids[student_username],
                "question_id": self.question_ids[question_content],
                "order_num": order_num,
            }
            for student_username, question_content, order_num in PRACTICE_SET_QUESTIONS
        ]
        self.insert_rows("practice_set_questions", rows)

    def seed_practice_attempts(self) -> None:
        rows = []
        now = datetime.now(timezone.utc)
        for student_username, status, score, total_correct, total_wrong, days_ago, duration_minutes in PRACTICE_ATTEMPTS:
            started_at = now - timedelta(days=days_ago)
            row = {
                "practice_set_id": self.practice_set_ids[student_username],
                "started_at": started_at.isoformat(),
                "score": score,
                "total_correct": total_correct,
                "total_wrong": total_wrong,
                "status": status,
            }
            if duration_minutes is not None:
                row["submitted_at"] = (started_at + timedelta(minutes=duration_minutes)).isoformat()
            rows.append(row)
        inserted = self.insert_rows("practice_attempts", rows)
        self.practice_attempt_ids = {index: row["attempt_id"] for index, row in enumerate(inserted, start=1)}

    def seed_student_answers(self) -> None:
        question_option_rows = self.execute(
            lambda: self.supabase.table("question_options").select("option_id,question_id,option_label").execute()
        ).data or []
        option_ids = {
            (row["question_id"], row["option_label"]): row["option_id"]
            for row in question_option_rows
        }

        rows = [
            {
                "attempt_id": self.practice_attempt_ids[attempt_index],
                "question_id": self.question_ids[question_content],
                "selected_option_id": option_ids[(self.question_ids[question_content], option_label)],
                "is_correct": is_correct,
            }
            for attempt_index, question_content, option_label, is_correct in STUDENT_ANSWERS
        ]
        self.insert_rows("student_answers", rows)

    def seed_notifications(self) -> None:
        rows = [
            {
                "user_id": self.user_ids[username],
                "title": title,
                "content": content,
                "is_read": is_read,
            }
            for username, title, content, is_read in NOTIFICATIONS
        ]
        self.insert_rows("notifications", rows)

    def run(self, clear_existing: bool) -> None:
        if clear_existing:
            self.delete_all()

        self.seed_users()
        self.seed_roles()
        self.seed_user_roles()
        self.seed_classes()
        self.seed_subjects()
        self.seed_class_teachers()
        self.seed_class_subjects()
        self.seed_topics()
        self.seed_class_students()
        self.seed_documents()
        self.seed_document_topics()
        self.seed_ai_requests()
        self.seed_questions()
        self.seed_question_options()
        self.seed_question_history()
        self.seed_practice_sets()
        self.seed_practice_set_questions()
        self.seed_practice_attempts()
        self.seed_student_answers()
        self.seed_notifications()


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed Supabase tables directly using the shared Supabase client.")
    parser.add_argument(
        "--skip-clear",
        action="store_true",
        help="Do not delete existing data before seeding.",
    )
    args = parser.parse_args()

    seeder = Seeder()
    seeder.run(clear_existing=not args.skip_clear)
    print("Seeded data directly into Supabase tables.")


if __name__ == "__main__":
    main()
