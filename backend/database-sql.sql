-- =========================================================
-- BKP SYSTEM DATABASE
-- PostgreSQL / Supabase
-- Fixed: topics -> class_subjects via class_subject_id
-- =========================================================

DROP TABLE IF EXISTS student_answers CASCADE;
DROP TABLE IF EXISTS practice_attempts CASCADE;
DROP TABLE IF EXISTS practice_set_questions CASCADE;
DROP TABLE IF EXISTS practice_sets CASCADE;
DROP TABLE IF EXISTS question_options CASCADE;
DROP TABLE IF EXISTS question_history CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS ai_request_difficulty_distribution CASCADE;
DROP TABLE IF EXISTS ai_requests CASCADE;
DROP TABLE IF EXISTS document_topics CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS topics CASCADE;
DROP TABLE IF EXISTS class_students CASCADE;
DROP TABLE IF EXISTS class_subjects CASCADE;
DROP TABLE IF EXISTS class_teachers CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS images CASCADE;
DROP TABLE IF EXISTS image_types CASCADE;

DROP TYPE IF EXISTS active_status CASCADE;
DROP TYPE IF EXISTS difficulty_level CASCADE;
DROP TYPE IF EXISTS ai_request_status CASCADE;
DROP TYPE IF EXISTS question_source CASCADE;
DROP TYPE IF EXISTS question_status CASCADE;
DROP TYPE IF EXISTS practice_attempt_status CASCADE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE active_status AS ENUM ('active', 'inactive');
CREATE TYPE difficulty_level AS ENUM ('recognition', 'comprehension', 'application', 'advanced');
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
CREATE TABLE image_types (
    image_type_id BIGSERIAL PRIMARY KEY,
    type_code VARCHAR(50) UNIQUE NOT NULL,
    type_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO image_types (type_code, type_name, description)
VALUES ('question_image', 'Question Image', 'Images that can be attached to questions');

CREATE TABLE images (
    image_id BIGSERIAL PRIMARY KEY,
    image_type_id BIGINT NOT NULL REFERENCES image_types(image_type_id),
    uploaded_by BIGINT REFERENCES users(user_id) ON DELETE SET NULL,

    file_name VARCHAR(255),
    file_url TEXT NOT NULL,
    file_hash VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
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

CREATE TABLE topics (
    topic_id BIGSERIAL PRIMARY KEY,
    topic_name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    class_subject_id BIGINT REFERENCES class_subjects(class_subject_id) ON DELETE CASCADE,
    CONSTRAINT uq_topic_class_subject UNIQUE(class_subject_id, topic_name)
);

CREATE INDEX idx_topics_class_subject ON topics(class_subject_id);

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
    deleted_at TIMESTAMP,
    CONSTRAINT uq_document_topic UNIQUE(document_id, topic_id)
);

CREATE INDEX idx_document_topics_document ON document_topics(document_id);
CREATE INDEX idx_document_topics_topic ON document_topics(topic_id);

CREATE TABLE ai_requests (
    request_id BIGSERIAL PRIMARY KEY,
    document_topic_id BIGINT NOT NULL REFERENCES document_topics(document_topic_id) ON DELETE CASCADE,
    num_questions INT NOT NULL,
    content_scope TEXT,
    status ai_request_status DEFAULT 'pending',
    generated_question_count INT DEFAULT 0,
    retry_count INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_reviewed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE ai_request_difficulty_distribution (
    distribution_id BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL REFERENCES ai_requests(request_id) ON DELETE CASCADE,
    difficulty difficulty_level NOT NULL,
    percentage INT,
    question_count INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_ai_request_distribution UNIQUE(request_id, difficulty),
    CONSTRAINT chk_ai_request_distribution_question_count CHECK (question_count > 0),
    CONSTRAINT chk_ai_request_distribution_percentage CHECK (percentage IS NULL OR (percentage >= 0 AND percentage <= 100))
);

CREATE INDEX idx_ai_request_distribution_request_id ON ai_request_difficulty_distribution(request_id);

CREATE TABLE questions (
    question_id BIGSERIAL PRIMARY KEY,
    teacher_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    topic_id BIGINT NOT NULL REFERENCES topics(topic_id) ON DELETE CASCADE,
    ai_request_id BIGINT REFERENCES ai_requests(request_id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    difficulty difficulty_level NOT NULL,
    source question_source NOT NULL,
    status question_status DEFAULT 'draft',
    explanation TEXT,
    image_id BIGINT REFERENCES images(image_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_questions_topic ON questions(topic_id);
CREATE INDEX idx_questions_topic_difficulty_status ON questions(topic_id, difficulty, status);
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
    topic_id BIGINT REFERENCES topics(topic_id) ON DELETE SET NULL,
    difficulty difficulty_level,
    num_questions_requested INT NOT NULL,
    num_questions_actual INT,
    time_limit_minutes INT,
    prioritize_unanswered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
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
    status practice_attempt_status DEFAULT 'in_progress',
    deleted_at TIMESTAMP
);

CREATE TABLE student_answers (
    answer_id BIGSERIAL PRIMARY KEY,
    attempt_id BIGINT NOT NULL REFERENCES practice_attempts(attempt_id) ON DELETE CASCADE,
    question_id BIGINT NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,
    selected_option_id BIGINT REFERENCES question_options(option_id) ON DELETE SET NULL,
    is_correct BOOLEAN,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
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

-- ================= RELATIONSHIP SUMMARY =================
-- users 1---n user_roles n---1 roles
-- users 1---n classes (teacher_id)
-- classes 1---n class_teachers n---1 users
-- classes 1---n class_subjects n---1 subjects
-- class_subjects 1---n topics
-- classes 1---n class_students n---1 users
-- users 1---n documents
-- documents 1---n document_topics n---1 topics
-- document_topics 1---n ai_requests
-- ai_requests 1---n ai_request_difficulty_distribution
-- users 1---n questions
-- topics 1---n questions
-- ai_requests 1---n questions
-- questions 1---n question_options
-- questions 1---n question_history
-- users 1---n question_history
-- users 1---n practice_sets
-- subjects 1---n practice_sets
-- topics 1---n practice_sets
-- practice_sets 1---n practice_set_questions n---1 questions
-- practice_sets 1---n practice_attempts
-- practice_attempts 1---n student_answers n---1 questions
-- question_options 1---n student_answers
-- users 1---n notifications
-- image_types 1---n images
-- users 1---n images
-- images 1---n questions
-- questions n---1 images
-- ================= SEED DATA =================
-- Seed data is generated separately by:
-- python database/generate_seed_sql.py
-- Output file:
-- database/seed_data.sql

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

CREATE TRIGGER trg_class_subjects_updated_at
BEFORE UPDATE ON class_subjects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_topics_updated_at
BEFORE UPDATE ON topics
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
