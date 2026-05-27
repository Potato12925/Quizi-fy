-- =========================================================
-- BKP SYSTEM DATABASE
-- MATCHED WITH DBDIAGRAM
-- PostgreSQL / Supabase
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
DROP TABLE IF EXISTS class_subjects CASCADE;
DROP TABLE IF EXISTS class_teachers CASCADE;
DROP TABLE IF EXISTS topics CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS active_status CASCADE;
DROP TYPE IF EXISTS difficulty_level CASCADE;
DROP TYPE IF EXISTS ai_request_status CASCADE;
DROP TYPE IF EXISTS question_source CASCADE;
DROP TYPE IF EXISTS question_status CASCADE;
DROP TYPE IF EXISTS practice_attempt_status CASCADE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE active_status AS ENUM ('active', 'inactive');
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE ai_request_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE question_source AS ENUM ('ai', 'manual');
CREATE TYPE question_status AS ENUM ('draft', 'approved', 'inactive', 'rejected');
CREATE TYPE practice_attempt_status AS ENUM ('in_progress', 'submitted', 'timeout');

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

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_is_active ON users(is_active);

CREATE TABLE roles (
    role_id BIGSERIAL PRIMARY KEY,
    role_code VARCHAR(50) UNIQUE NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_roles (
    user_role_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_role UNIQUE(user_id, role_id)
);

CREATE TABLE classes (
    class_id BIGSERIAL PRIMARY KEY,
    class_code VARCHAR(50) UNIQUE NOT NULL,
    class_name VARCHAR(255) NOT NULL,
    description TEXT,
    teacher_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    status active_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE subjects (
    subject_id BIGSERIAL PRIMARY KEY,
    subject_code VARCHAR(50) UNIQUE NOT NULL,
    subject_name VARCHAR(255) NOT NULL,
    description TEXT,
    status active_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE topics (
    topic_id BIGSERIAL PRIMARY KEY,
    subject_id BIGINT NOT NULL REFERENCES subjects(subject_id) ON DELETE CASCADE,
    topic_name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT uq_topic_subject UNIQUE(subject_id, topic_name)
);

CREATE INDEX idx_topics_subject ON topics(subject_id);

CREATE TABLE class_teachers (
    class_teacher_id BIGSERIAL PRIMARY KEY,
    class_id BIGINT NOT NULL REFERENCES classes(class_id) ON DELETE CASCADE,
    teacher_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT uq_class_teacher UNIQUE(class_id, teacher_id)
);

CREATE TABLE class_subjects (
    class_subject_id BIGSERIAL PRIMARY KEY,
    class_id BIGINT NOT NULL REFERENCES classes(class_id) ON DELETE CASCADE,
    subject_id BIGINT NOT NULL REFERENCES subjects(subject_id) ON DELETE CASCADE,
    assigned_teacher_id BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
    status active_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT uq_class_subject UNIQUE(class_id, subject_id)
);

CREATE TABLE class_students (
    class_student_id BIGSERIAL PRIMARY KEY,
    class_id BIGINT NOT NULL REFERENCES classes(class_id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT uq_class_student UNIQUE(class_id, student_id)
);

CREATE TABLE documents (
    document_id BIGSERIAL PRIMARY KEY,
    teacher_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_hash VARCHAR(255),
    file_type VARCHAR(20) NOT NULL,
    file_size BIGINT NOT NULL,
    status active_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_documents_teacher_created ON documents(teacher_id, created_at);
CREATE INDEX idx_documents_status ON documents(status);

CREATE TABLE document_topics (
    document_topic_id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
    topic_id BIGINT NOT NULL REFERENCES topics(topic_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_document_topic UNIQUE(document_id, topic_id)
);

CREATE INDEX idx_document_topics_document ON document_topics(document_id);
CREATE INDEX idx_document_topics_topic ON document_topics(topic_id);

CREATE TABLE ai_requests (
    request_id BIGSERIAL PRIMARY KEY,
    document_topic_id BIGINT NOT NULL REFERENCES document_topics(document_topic_id) ON DELETE CASCADE,
    num_questions INT NOT NULL,
    difficulty difficulty_level NOT NULL,
    content_scope TEXT,
    status ai_request_status DEFAULT 'pending',
    generated_question_count INT DEFAULT 0,
    retry_count INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE questions (
    question_id BIGSERIAL PRIMARY KEY,
    teacher_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    document_topic_id BIGINT NOT NULL REFERENCES document_topics(document_topic_id) ON DELETE CASCADE,
    ai_request_id BIGINT REFERENCES ai_requests(request_id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    difficulty difficulty_level NOT NULL,
    source question_source NOT NULL,
    status question_status DEFAULT 'draft',
    explanation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_questions_document_topic ON questions(document_topic_id);
CREATE INDEX idx_questions_topic_difficulty_status ON questions(document_topic_id, difficulty, status);
CREATE INDEX idx_questions_status ON questions(status);
CREATE INDEX idx_questions_teacher_created ON questions(teacher_id, created_at);

CREATE TABLE question_options (
    option_id BIGSERIAL PRIMARY KEY,
    question_id BIGINT NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,
    option_label VARCHAR(5) NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    order_num INT NOT NULL,
    CONSTRAINT uq_question_option_order UNIQUE(question_id, order_num)
);

CREATE TABLE question_history (
    history_id BIGSERIAL PRIMARY KEY,
    question_id BIGINT NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,
    changed_by BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    old_data JSONB,
    new_data JSONB,
    change_type VARCHAR(100),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE practice_sets (
    practice_set_id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    subject_id BIGINT NOT NULL REFERENCES subjects(subject_id) ON DELETE CASCADE,
    document_topic_id BIGINT REFERENCES document_topics(document_topic_id) ON DELETE SET NULL,
    difficulty difficulty_level,
    num_questions_requested INT NOT NULL,
    num_questions_actual INT,
    time_limit_minutes INT,
    prioritize_unanswered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE practice_set_questions (
    practice_set_question_id BIGSERIAL PRIMARY KEY,
    practice_set_id BIGINT NOT NULL REFERENCES practice_sets(practice_set_id) ON DELETE CASCADE,
    question_id BIGINT NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,
    order_num INT NOT NULL,
    CONSTRAINT uq_psq_question UNIQUE(practice_set_id, question_id),
    CONSTRAINT uq_psq_order UNIQUE(practice_set_id, order_num)
);

CREATE TABLE practice_attempts (
    attempt_id BIGSERIAL PRIMARY KEY,
    practice_set_id BIGINT NOT NULL REFERENCES practice_sets(practice_set_id) ON DELETE CASCADE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP,
    score DECIMAL(5,2),
    total_correct INT DEFAULT 0,
    total_wrong INT DEFAULT 0,
    status practice_attempt_status DEFAULT 'in_progress'
);

CREATE TABLE student_answers (
    answer_id BIGSERIAL PRIMARY KEY,
    attempt_id BIGINT NOT NULL REFERENCES practice_attempts(attempt_id) ON DELETE CASCADE,
    question_id BIGINT NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,
    selected_option_id BIGINT REFERENCES question_options(option_id) ON DELETE SET NULL,
    is_correct BOOLEAN,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_attempt_question UNIQUE(attempt_id, question_id)
);

CREATE TABLE notifications (
    notification_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255),
    content TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================= SEED DATA =================

INSERT INTO users(username, password_hash, full_name, is_active, must_change_password)
VALUES
('admin', '$2b$12$2PG4GGwGcNh8u2fjrdTVKe41hbycEVsuCsviJxCQrC15zaDuanWLO', 'System Administrator', TRUE, FALSE),
('teacher01', '$2b$12$2PG4GGwGcNh8u2fjrdTVKe41hbycEVsuCsviJxCQrC15zaDuanWLO', 'Nguyen Van Teacher', TRUE, FALSE),
('teacher02', '$2b$12$2PG4GGwGcNh8u2fjrdTVKe41hbycEVsuCsviJxCQrC15zaDuanWLO', 'Tran Thi Teacher', TRUE, FALSE),
('student01', '$2b$12$2PG4GGwGcNh8u2fjrdTVKe41hbycEVsuCsviJxCQrC15zaDuanWLO', 'Le Van Student', TRUE, FALSE),
('student02', '$2b$12$2PG4GGwGcNh8u2fjrdTVKe41hbycEVsuCsviJxCQrC15zaDuanWLO', 'Pham Thi Student', TRUE, FALSE);

INSERT INTO roles(role_code, role_name, description)
VALUES
('admin', 'Administrator', 'System administrator'),
('teacher', 'Teacher', 'Teacher role'),
('student', 'Student', 'Student role');

INSERT INTO user_roles(user_id, role_id)
SELECT u.user_id, r.role_id
FROM users u
JOIN roles r ON
    (u.username = 'admin' AND r.role_code = 'admin')
 OR (u.username IN ('teacher01', 'teacher02') AND r.role_code = 'teacher')
 OR (u.username IN ('student01', 'student02') AND r.role_code = 'student');

INSERT INTO classes(class_code, class_name, description, teacher_id)
VALUES
('SE0601', 'Software Engineering 01', 'Class managed by teacher01', 2),
('AI0601', 'Artificial Intelligence 01', 'Class managed by teacher02', 3);

INSERT INTO subjects(subject_code, subject_name, description)
VALUES
('PRN212', 'Web Development', 'Frontend and Backend development'),
('DBI202', 'Database Systems', 'Database design and SQL'),
('AIL302', 'Machine Learning', 'Introduction to machine learning');

INSERT INTO class_teachers(class_id, teacher_id)
VALUES
(1, 2),
(2, 3);

INSERT INTO class_subjects(class_id, subject_id, assigned_teacher_id, status)
VALUES
(1, 1, 2, 'active'),
(1, 2, 2, 'active'),
(2, 3, 3, 'active');

INSERT INTO topics(subject_id, topic_name, description)
VALUES
(1, 'ReactJS Basics', 'Introduction to ReactJS'),
(1, 'REST API', 'Learn RESTful API design'),
(2, 'PostgreSQL', 'Database queries and optimization'),
(3, 'Neural Network', 'Deep learning fundamentals');

INSERT INTO class_students(class_id, student_id)
VALUES
(1, 4),
(1, 5),
(2, 4);

INSERT INTO documents(teacher_id, title, description, file_url, file_hash, file_type, file_size)
VALUES
(2, 'ReactJS Introduction', 'Basic ReactJS document', 'https://example.com/react-intro.pdf', 'hash_react_001', 'pdf', 2048000),
(2, 'REST API Guide', 'REST API learning material', 'https://example.com/rest-api.docx', 'hash_api_001', 'docx', 1024000),
(3, 'Machine Learning Notes', 'ML theory document', 'https://example.com/ml-notes.pdf', 'hash_ml_001', 'pdf', 4096000);

INSERT INTO document_topics(document_id, topic_id)
VALUES
(1, 1),
(2, 2),
(3, 4);

INSERT INTO ai_requests(document_topic_id, num_questions, difficulty, content_scope, status, generated_question_count)
VALUES
(1, 10, 'easy', 'Chapter 1', 'completed', 10),
(2, 5, 'medium', 'Full document', 'processing', 2);

INSERT INTO questions(teacher_id, document_topic_id, ai_request_id, content, difficulty, source, status, explanation)
VALUES
(2, 1, 1, 'ReactJS là thư viện dùng để làm gì?', 'easy', 'ai', 'approved', 'ReactJS dùng để xây dựng giao diện người dùng.'),
(2, 2, 2, 'HTTP method nào dùng để tạo dữ liệu?', 'medium', 'manual', 'approved', 'POST dùng để tạo dữ liệu mới.');

INSERT INTO question_options(question_id, option_label, option_text, is_correct, order_num)
VALUES
(1, 'A', 'Xây dựng giao diện', TRUE, 1),
(1, 'B', 'Quản lý database', FALSE, 2),
(1, 'C', 'Tạo server vật lý', FALSE, 3),
(1, 'D', 'Cấu hình mạng', FALSE, 4),
(2, 'A', 'GET', FALSE, 1),
(2, 'B', 'POST', TRUE, 2),
(2, 'C', 'DELETE', FALSE, 3),
(2, 'D', 'PATCH', FALSE, 4);

INSERT INTO practice_sets(student_id, subject_id, document_topic_id, difficulty, num_questions_requested, num_questions_actual, time_limit_minutes)
VALUES
(4, 1, 1, 'easy', 10, 10, 15);

INSERT INTO practice_set_questions(practice_set_id, question_id, order_num)
VALUES
(1, 1, 1),
(1, 2, 2);

INSERT INTO practice_attempts(practice_set_id, submitted_at, score, total_correct, total_wrong, status)
VALUES
(1, CURRENT_TIMESTAMP, 8.50, 8, 2, 'submitted');

INSERT INTO student_answers(attempt_id, question_id, selected_option_id, is_correct)
VALUES
(1, 1, 1, TRUE),
(1, 2, 6, TRUE);

INSERT INTO notifications(user_id, title, content, is_read)
VALUES
(4, 'New Practice Set', 'A new practice set has been assigned to you.', FALSE),
(2, 'AI Request Completed', 'Your AI question generation request has completed.', FALSE);

-- ================= UPDATED_AT TRIGGERS =================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_classes_updated_at
BEFORE UPDATE ON classes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_subjects_updated_at
BEFORE UPDATE ON subjects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_topics_updated_at
BEFORE UPDATE ON topics
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_class_subjects_updated_at
BEFORE UPDATE ON class_subjects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_ai_requests_updated_at
BEFORE UPDATE ON ai_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_questions_updated_at
BEFORE UPDATE ON questions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();