
-- =========================================================
-- BKP SYSTEM DATABASE
-- TEACHER MANAGED VERSION
--
-- CHANGES:
-- 1. Teacher quản lý lớp học
-- 2. Teacher quản lý môn học
-- 3. Teacher quản lý topic
-- 4. Teacher upload document
-- 5. Subject thuộc về teacher
-- 6. Class thuộc về teacher
-- 7. Admin chỉ quản lý hệ thống và tài khoản
-- =========================================================

DROP TABLE IF EXISTS student_answers CASCADE;
DROP TABLE IF EXISTS practice_attempts CASCADE;
DROP TABLE IF EXISTS practice_set_questions CASCADE;
DROP TABLE IF EXISTS practice_sets CASCADE;
DROP TABLE IF EXISTS question_options CASCADE;
DROP TABLE IF EXISTS question_history CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS ai_requests CASCADE;
DROP TABLE IF EXISTS document_topics CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS class_students CASCADE;
DROP TABLE IF EXISTS topics CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS class_subjects CASCADE;
DROP TABLE IF EXISTS class_teachers CASCADE;
DROP TYPE IF EXISTS active_status CASCADE;
DROP TYPE IF EXISTS difficulty_level CASCADE;
DROP TYPE IF EXISTS ai_request_status CASCADE;
DROP TYPE IF EXISTS question_source CASCADE;
DROP TYPE IF EXISTS question_status CASCADE;
DROP TYPE IF EXISTS practice_attempt_status CASCADE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================
-- ENUMS
-- =========================================================

CREATE TYPE active_status AS ENUM (
    'active',
    'inactive'
);

CREATE TYPE difficulty_level AS ENUM (
    'easy',
    'medium',
    'hard'
);

CREATE TYPE ai_request_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed',
    'cancelled'
);

CREATE TYPE question_source AS ENUM (
    'ai',
    'manual'
);

CREATE TYPE question_status AS ENUM (
    'draft',
    'approved',
    'inactive',
    'rejected'
);

CREATE TYPE practice_attempt_status AS ENUM (
    'in_progress',
    'submitted',
    'timeout'
);

-- =========================================================
-- USERS
-- =========================================================

CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY,

    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    full_name VARCHAR(255) NOT NULL,

    is_active BOOLEAN DEFAULT TRUE,
    must_change_password BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_users_username
ON users(username);

CREATE INDEX idx_users_is_active
ON users(is_active);

-- =========================================================
-- ROLES
-- =========================================================

CREATE TABLE roles (
    role_id BIGSERIAL PRIMARY KEY,

    role_code VARCHAR(50) UNIQUE NOT NULL,
    role_name VARCHAR(100) NOT NULL,

    description TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- USER ROLES
-- =========================================================

CREATE TABLE user_roles (
    user_role_id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,

    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_roles_user
        FOREIGN KEY(user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_user_roles_role
        FOREIGN KEY(role_id)
        REFERENCES roles(role_id)
        ON DELETE CASCADE,

    CONSTRAINT uq_user_role
        UNIQUE(user_id, role_id)
);

-- =========================================================
-- CLASSES
-- Teacher owns class
-- =========================================================

CREATE TABLE classes (
    class_id BIGSERIAL PRIMARY KEY,

    teacher_id BIGINT NOT NULL,

    class_code VARCHAR(50) UNIQUE NOT NULL,
    class_name VARCHAR(255) NOT NULL,

    description TEXT,

    status active_status DEFAULT 'active',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,

    CONSTRAINT fk_classes_teacher
        FOREIGN KEY(teacher_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

CREATE INDEX idx_classes_teacher
ON classes(teacher_id);

-- =========================================================
-- SUBJECTS
-- Subject belongs to teacher
-- =========================================================

CREATE TABLE subjects (
    subject_id BIGSERIAL PRIMARY KEY,

    teacher_id BIGINT NOT NULL,

    class_id BIGINT NOT NULL,

    subject_code VARCHAR(50) NOT NULL,
    subject_name VARCHAR(255) NOT NULL,

    description TEXT,

    status active_status DEFAULT 'active',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,

    CONSTRAINT fk_subjects_teacher
        FOREIGN KEY(teacher_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_subjects_class
        FOREIGN KEY(class_id)
        REFERENCES classes(class_id)
        ON DELETE CASCADE,

    CONSTRAINT uq_subject_code_per_teacher
        UNIQUE(teacher_id, subject_code)
);

CREATE INDEX idx_subjects_teacher
ON subjects(teacher_id);

CREATE INDEX idx_subjects_class
ON subjects(class_id);

-- =========================================================
-- TOPICS
-- Topic belongs to subject
-- =========================================================

CREATE TABLE topics (
    topic_id BIGSERIAL PRIMARY KEY,

    subject_id BIGINT NOT NULL,

    topic_name VARCHAR(255) NOT NULL,

    description TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,

    CONSTRAINT fk_topics_subject
        FOREIGN KEY(subject_id)
        REFERENCES subjects(subject_id)
        ON DELETE CASCADE,

    CONSTRAINT uq_topic_subject
        UNIQUE(subject_id, topic_name)
);

CREATE INDEX idx_topics_subject
ON topics(subject_id);

-- =========================================================
-- CLASS STUDENTS
-- =========================================================

CREATE TABLE class_students (
    class_student_id BIGSERIAL PRIMARY KEY,

    class_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,

    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    deleted_at TIMESTAMP,

    CONSTRAINT fk_class_students_class
        FOREIGN KEY(class_id)
        REFERENCES classes(class_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_class_students_student
        FOREIGN KEY(student_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT uq_class_student
        UNIQUE(class_id, student_id)
);

-- =========================================================
-- DOCUMENTS
-- Teacher uploads documents
-- =========================================================

CREATE TABLE documents (
    document_id BIGSERIAL PRIMARY KEY,

    teacher_id BIGINT NOT NULL,

    title VARCHAR(500) NOT NULL,

    description TEXT,

    file_url TEXT NOT NULL,
    file_hash VARCHAR(255),

    file_type VARCHAR(20) NOT NULL,

    file_size BIGINT NOT NULL,

    status active_status DEFAULT 'active',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,

    CONSTRAINT fk_documents_teacher
        FOREIGN KEY(teacher_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

CREATE INDEX idx_documents_teacher_created
ON documents(teacher_id, created_at);

CREATE INDEX idx_documents_status
ON documents(status);

-- =========================================================
-- DOCUMENT TOPICS
-- Many-to-many between document and topic
-- =========================================================

CREATE TABLE document_topics (
    document_topic_id BIGSERIAL PRIMARY KEY,

    document_id BIGINT NOT NULL,
    topic_id BIGINT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_document_topics_document
        FOREIGN KEY(document_id)
        REFERENCES documents(document_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_document_topics_topic
        FOREIGN KEY(topic_id)
        REFERENCES topics(topic_id)
        ON DELETE CASCADE,

    CONSTRAINT uq_document_topic
        UNIQUE(document_id, topic_id)
);

CREATE INDEX idx_document_topics_document
ON document_topics(document_id);

CREATE INDEX idx_document_topics_topic
ON document_topics(topic_id);

-- =========================================================
-- AI REQUESTS
-- =========================================================

CREATE TABLE ai_requests (
    request_id BIGSERIAL PRIMARY KEY,

    document_topic_id BIGINT NOT NULL,

    num_questions INT NOT NULL,

    difficulty difficulty_level NOT NULL,

    content_scope TEXT,

    status ai_request_status DEFAULT 'pending',

    generated_question_count INT DEFAULT 0,

    retry_count INT DEFAULT 0,

    error_message TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ai_requests_document_topic
        FOREIGN KEY(document_topic_id)
        REFERENCES document_topics(document_topic_id)
        ON DELETE CASCADE
);

CREATE INDEX idx_ai_requests_document_topic
ON ai_requests(document_topic_id);

CREATE INDEX idx_ai_requests_status_created
ON ai_requests(status, created_at);

-- =========================================================
-- QUESTIONS
-- =========================================================

CREATE TABLE questions (
    question_id BIGSERIAL PRIMARY KEY,

    teacher_id BIGINT NOT NULL,

    document_topic_id BIGINT NOT NULL,

    ai_request_id BIGINT,

    content TEXT NOT NULL,

    difficulty difficulty_level NOT NULL,

    source question_source NOT NULL,

    status question_status DEFAULT 'draft',

    explanation TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,

    CONSTRAINT fk_questions_teacher
        FOREIGN KEY(teacher_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_questions_document_topic_id
        FOREIGN KEY(document_topic_id)
        REFERENCES document_topics(document_topic_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_questions_ai_request
        FOREIGN KEY(ai_request_id)
        REFERENCES ai_requests(request_id)
        ON DELETE SET NULL
);

CREATE INDEX idx_questions_topic
ON questions(document_topic_id);

CREATE INDEX idx_questions_topic_difficulty_status
ON questions(document_topic_id, difficulty, status);

CREATE INDEX idx_questions_status
ON questions(status);

CREATE INDEX idx_questions_teacher_created
ON questions(teacher_id, created_at);

-- =========================================================
-- QUESTION OPTIONS
-- =========================================================

CREATE TABLE question_options (
    option_id BIGSERIAL PRIMARY KEY,

    question_id BIGINT NOT NULL,

    option_label VARCHAR(5) NOT NULL,

    option_text TEXT NOT NULL,

    is_correct BOOLEAN DEFAULT FALSE,

    order_num INT NOT NULL,

    CONSTRAINT fk_question_options_question
        FOREIGN KEY(question_id)
        REFERENCES questions(question_id)
        ON DELETE CASCADE,

    CONSTRAINT uq_question_option_order
        UNIQUE(question_id, order_num)
);

-- =========================================================
-- QUESTION HISTORY
-- =========================================================

CREATE TABLE question_history (
    history_id BIGSERIAL PRIMARY KEY,

    question_id BIGINT NOT NULL,

    changed_by BIGINT NOT NULL,

    old_data JSONB,
    new_data JSONB,

    change_type VARCHAR(100),

    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_question_history_question
        FOREIGN KEY(question_id)
        REFERENCES questions(question_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_question_history_changed_by
        FOREIGN KEY(changed_by)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

-- =========================================================
-- PRACTICE SETS
-- =========================================================

CREATE TABLE practice_sets (
    practice_set_id BIGSERIAL PRIMARY KEY,

    student_id BIGINT NOT NULL,

    subject_id BIGINT NOT NULL,

    document_topic_id BIGINT,

    difficulty difficulty_level,

    num_questions_requested INT NOT NULL,

    num_questions_actual INT,

    time_limit_minutes INT,

    prioritize_unanswered BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_practice_sets_student
        FOREIGN KEY(student_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_practice_sets_subject
        FOREIGN KEY(subject_id)
        REFERENCES subjects(subject_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_practice_sets_document_topic
        FOREIGN KEY(document_topic_id)
        REFERENCES document_topics(document_topic_id)
        ON DELETE SET NULL
);

CREATE INDEX idx_practice_sets_student_created
ON practice_sets(student_id, created_at);

CREATE INDEX idx_practice_sets_document_topic
ON practice_sets(document_topic_id);

-- =========================================================
-- PRACTICE SET QUESTIONS
-- =========================================================

CREATE TABLE practice_set_questions (
    practice_set_question_id BIGSERIAL PRIMARY KEY,

    practice_set_id BIGINT NOT NULL,

    question_id BIGINT NOT NULL,

    order_num INT NOT NULL,

    CONSTRAINT fk_psq_practice_set
        FOREIGN KEY(practice_set_id)
        REFERENCES practice_sets(practice_set_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_psq_question
        FOREIGN KEY(question_id)
        REFERENCES questions(question_id)
        ON DELETE CASCADE,

    CONSTRAINT uq_psq_question
        UNIQUE(practice_set_id, question_id),

    CONSTRAINT uq_psq_order
        UNIQUE(practice_set_id, order_num)
);

-- =========================================================
-- PRACTICE ATTEMPTS
-- =========================================================

CREATE TABLE practice_attempts (
    attempt_id BIGSERIAL PRIMARY KEY,

    practice_set_id BIGINT NOT NULL,

    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    submitted_at TIMESTAMP,

    score DECIMAL(5,2),

    total_correct INT DEFAULT 0,

    total_wrong INT DEFAULT 0,

    status practice_attempt_status DEFAULT 'in_progress',

    CONSTRAINT fk_practice_attempts_set
        FOREIGN KEY(practice_set_id)
        REFERENCES practice_sets(practice_set_id)
        ON DELETE CASCADE
);

-- =========================================================
-- STUDENT ANSWERS
-- =========================================================

CREATE TABLE student_answers (
    answer_id BIGSERIAL PRIMARY KEY,

    attempt_id BIGINT NOT NULL,

    question_id BIGINT NOT NULL,

    selected_option_id BIGINT,

    is_correct BOOLEAN,

    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_student_answers_attempt
        FOREIGN KEY(attempt_id)
        REFERENCES practice_attempts(attempt_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_student_answers_question
        FOREIGN KEY(question_id)
        REFERENCES questions(question_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_student_answers_option
        FOREIGN KEY(selected_option_id)
        REFERENCES question_options(option_id)
        ON DELETE SET NULL,

    CONSTRAINT uq_attempt_question
        UNIQUE(attempt_id, question_id)
);

-- =========================================================
-- NOTIFICATIONS
-- =========================================================

CREATE TABLE notifications (
    notification_id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,

    title VARCHAR(255),

    content TEXT,

    is_read BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notifications_user
        FOREIGN KEY(user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

-- =========================================================
-- DEFAULT USERS
-- Password: 123456
-- =========================================================

INSERT INTO users (
    username,
    password_hash,
    full_name,
    is_active,
    must_change_password
)
VALUES
(
    'admin',
    '$2b$12$2PG4GGwGcNh8u2fjrdTVKe41hbycEVsuCsviJxCQrC15zaDuanWLO',
    'System Administrator',
    TRUE,
    FALSE
),
(
    'teacher01',
    '$2b$12$2PG4GGwGcNh8u2fjrdTVKe41hbycEVsuCsviJxCQrC15zaDuanWLO',
    'Nguyen Van Teacher',
    TRUE,
    FALSE
),
(
    'teacher02',
    '$2b$12$2PG4GGwGcNh8u2fjrdTVKe41hbycEVsuCsviJxCQrC15zaDuanWLO',
    'Tran Thi Teacher',
    TRUE,
    FALSE
),
(
    'student01',
    '$2b$12$2PG4GGwGcNh8u2fjrdTVKe41hbycEVsuCsviJxCQrC15zaDuanWLO',
    'Le Van Student',
    TRUE,
    FALSE
),
(
    'student02',
    '$2b$12$2PG4GGwGcNh8u2fjrdTVKe41hbycEVsuCsviJxCQrC15zaDuanWLO',
    'Pham Thi Student',
    TRUE,
    FALSE
);

-- =========================================================
-- DEFAULT ROLES
-- =========================================================

INSERT INTO roles(role_code, role_name, description)
VALUES
('admin', 'Administrator', 'System administrator'),
('teacher', 'Teacher', 'Teacher role'),
('student', 'Student', 'Student role');

-- =========================================================
-- USER ROLES
-- =========================================================

INSERT INTO user_roles (user_id, role_id)
SELECT u.user_id, r.role_id
FROM users u
JOIN roles r
ON (
    (u.username = 'admin' AND r.role_code = 'admin')
    OR
    (u.username = 'teacher01' AND r.role_code = 'teacher')
    OR
    (u.username = 'teacher02' AND r.role_code = 'teacher')
    OR
    (u.username = 'student01' AND r.role_code = 'student')
    OR
    (u.username = 'student02' AND r.role_code = 'student')
);

-- =========================================================
-- SEED CLASSES
-- =========================================================

INSERT INTO classes (
    teacher_id,
    class_code,
    class_name,
    description
)
VALUES
(
    2,
    'SE0601',
    'Software Engineering 01',
    'Class managed by teacher01'
),
(
    3,
    'AI0601',
    'Artificial Intelligence 01',
    'Class managed by teacher02'
);

-- =========================================================
-- SEED SUBJECTS
-- =========================================================

INSERT INTO subjects (
    teacher_id,
    class_id,
    subject_code,
    subject_name,
    description
)
VALUES
(
    2,
    1,
    'PRN212',
    'Web Development',
    'Frontend and Backend development'
),
(
    2,
    1,
    'DBI202',
    'Database Systems',
    'Database design and SQL'
),
(
    3,
    2,
    'AIL302',
    'Machine Learning',
    'Introduction to machine learning'
);

-- =========================================================
-- SEED TOPICS
-- =========================================================

INSERT INTO topics (
    subject_id,
    topic_name,
    description
)
VALUES
(
    1,
    'ReactJS Basics',
    'Introduction to ReactJS'
),
(
    1,
    'REST API',
    'Learn RESTful API design'
),
(
    2,
    'PostgreSQL',
    'Database queries and optimization'
),
(
    3,
    'Neural Network',
    'Deep learning fundamentals'
);

-- =========================================================
-- SEED CLASS TEACHERS
-- =========================================================

CREATE TABLE class_teachers (
    class_teacher_id BIGSERIAL PRIMARY KEY,

    class_id BIGINT NOT NULL,
    teacher_id BIGINT NOT NULL,

    added_by BIGINT NOT NULL,

    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    deleted_at TIMESTAMP,

    CONSTRAINT fk_class_teachers_class
        FOREIGN KEY(class_id)
        REFERENCES classes(class_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_class_teachers_teacher
        FOREIGN KEY(teacher_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_class_teachers_added_by
        FOREIGN KEY(added_by)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT uq_class_teacher
        UNIQUE(class_id, teacher_id)
);

-- =========================================================
-- CLASS SUBJECTS
-- =========================================================

CREATE TABLE class_subjects (
    class_subject_id BIGSERIAL PRIMARY KEY,

    class_id BIGINT NOT NULL,
    subject_id BIGINT NOT NULL,

    assigned_teacher_id BIGINT NOT NULL,

    status active_status DEFAULT 'active',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,

    CONSTRAINT fk_class_subjects_class
        FOREIGN KEY(class_id)
        REFERENCES classes(class_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_class_subjects_subject
        FOREIGN KEY(subject_id)
        REFERENCES subjects(subject_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_class_subjects_teacher
        FOREIGN KEY(assigned_teacher_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT uq_class_subject
        UNIQUE(class_id, subject_id)
);

CREATE INDEX idx_class_subjects_class
ON class_subjects(class_id);

CREATE INDEX idx_class_subjects_teacher
ON class_subjects(assigned_teacher_id);

-- =========================================================
-- SEED CLASS TEACHERS
-- =========================================================

INSERT INTO class_teachers (
    class_id,
    teacher_id,
    added_by
)
VALUES
(
    1,
    2,
    1
),
(
    2,
    3,
    1
);

-- =========================================================
-- SEED CLASS SUBJECTS
-- =========================================================

INSERT INTO class_subjects (
    class_id,
    subject_id,
    assigned_teacher_id,
    status
)
VALUES
(
    1,
    1,
    2,
    'active'
),
(
    1,
    2,
    2,
    'active'
),
(
    2,
    3,
    3,
    'active'
);

-- =========================================================
-- SEED CLASS STUDENTS
-- =========================================================

INSERT INTO class_students (
    class_id,
    student_id
)
VALUES
(1, 4),
(1, 5),
(2, 4);

-- =========================================================
-- SEED DOCUMENTS
-- =========================================================

INSERT INTO documents (
    teacher_id,
    title,
    description,
    file_url,
    file_hash,
    file_type,
    file_size
)
VALUES
(
    2,
    'ReactJS Introduction',
    'Basic ReactJS document',
    'https://example.com/react-intro.pdf',
    'hash_react_001',
    'pdf',
    2048000
),
(
    2,
    'REST API Guide',
    'REST API learning material',
    'https://example.com/rest-api.docx',
    'hash_api_001',
    'docx',
    1024000
),
(
    3,
    'Machine Learning Notes',
    'ML theory document',
    'https://example.com/ml-notes.pdf',
    'hash_ml_001',
    'pdf',
    4096000
);

-- =========================================================
-- SEED DOCUMENT TOPICS
-- =========================================================

INSERT INTO document_topics (
    document_id,
    topic_id
)
VALUES
(1, 1),
(2, 2),
(3, 4);

-- =========================================================
-- SEED AI REQUESTS
-- =========================================================

INSERT INTO ai_requests (
    document_topic_id,
    num_questions,
    difficulty,
    content_scope,
    status,
    generated_question_count
)
VALUES
(
    1,
    10,
    'easy',
    'Chapter 1',
    'completed',
    10
),
(
    2,
    5,
    'medium',
    'Full document',
    'processing',
    2
);

-- =========================================================
-- SEED QUESTIONS
-- =========================================================

INSERT INTO questions (
    teacher_id,
    document_topic_id,
    ai_request_id,
    content,
    difficulty,
    source,
    status,
    explanation
)
VALUES
(
    2,
    1,
    1,
    'ReactJS là thư viện dùng để làm gì?',
    'easy',
    'ai',
    'approved',
    'ReactJS dùng để xây dựng giao diện người dùng.'
),
(
    2,
    2,
    2,
    'HTTP method nào dùng để tạo dữ liệu?',
    'medium',
    'manual',
    'approved',
    'POST dùng để tạo dữ liệu mới.'
);

-- =========================================================
-- SEED QUESTION OPTIONS
-- =========================================================

INSERT INTO question_options (
    question_id,
    option_label,
    option_text,
    is_correct,
    order_num
)
VALUES
(1, 'A', 'Xây dựng giao diện', TRUE, 1),
(1, 'B', 'Quản lý database', FALSE, 2),
(1, 'C', 'Tạo server vật lý', FALSE, 3),
(1, 'D', 'Cấu hình mạng', FALSE, 4),

(2, 'A', 'GET', FALSE, 1),
(2, 'B', 'POST', TRUE, 2),
(2, 'C', 'DELETE', FALSE, 3),
(2, 'D', 'PATCH', FALSE, 4);

-- =========================================================
-- SEED PRACTICE SETS
-- =========================================================

INSERT INTO practice_sets (
    student_id,
    subject_id,
    document_topic_id,
    difficulty,
    num_questions_requested,
    num_questions_actual,
    time_limit_minutes
)
VALUES
(
    4,
    1,
    1,
    'easy',
    10,
    10,
    15
);

-- =========================================================
-- SEED PRACTICE SET QUESTIONS
-- =========================================================

INSERT INTO practice_set_questions (
    practice_set_id,
    question_id,
    order_num
)
VALUES
(1, 1, 1),
(1, 2, 2);

-- =========================================================
-- SEED PRACTICE ATTEMPTS
-- =========================================================

INSERT INTO practice_attempts (
    practice_set_id,
    submitted_at,
    score,
    total_correct,
    total_wrong,
    status
)
VALUES
(
    1,
    CURRENT_TIMESTAMP,
    8.50,
    8,
    2,
    'submitted'
);

-- =========================================================
-- SEED STUDENT ANSWERS
-- =========================================================

INSERT INTO student_answers (
    attempt_id,
    question_id,
    selected_option_id,
    is_correct
)
VALUES
(1, 1, 1, TRUE),
(1, 2, 6, TRUE);

-- =========================================================
-- SEED NOTIFICATIONS
-- =========================================================

INSERT INTO notifications (
    user_id,
    title,
    content,
    is_read
)
VALUES
(
    4,
    'New Practice Set',
    'A new practice set has been assigned to you.',
    FALSE
),
(
    2,
    'AI Request Completed',
    'Your AI question generation request has completed.',
    FALSE
);

-- =========================================================
-- UPDATED_AT FUNCTION
-- =========================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

-- =========================================================
-- TRIGGERS
-- =========================================================

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_classes_updated_at
BEFORE UPDATE ON classes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_subjects_updated_at
BEFORE UPDATE ON subjects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_topics_updated_at
BEFORE UPDATE ON topics
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_ai_requests_updated_at
BEFORE UPDATE ON ai_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_questions_updated_at
BEFORE UPDATE ON questions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- END
-- =========================================================
