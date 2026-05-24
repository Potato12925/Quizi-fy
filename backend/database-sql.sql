-- =========================================================
-- BKP SYSTEM DATABASE
-- FULL RESET + RECREATE
-- PostgreSQL / Supabase
-- =========================================================

-- =========================================================
-- RESET DATABASE
-- =========================================================

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- =========================================================
-- EXTENSIONS
-- =========================================================

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
-- DEFAULT USERS
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
    '$2b$12$hRU1YPKZALIRE0F/LgchpeANk4d6z.HxwbxKsC1mV7aQ0WlPzpxRy',
    'System Administrator',
    TRUE,
    FALSE
),
(
    'teacher',
    '$2b$12$hRU1YPKZALIRE0F/LgchpeANk4d6z.HxwbxKsC1mV7aQ0WlPzpxRy',
    'Default Teacher',
    TRUE,
    FALSE
),
(
    'student',
    '$2b$12$hRU1YPKZALIRE0F/LgchpeANk4d6z.HxwbxKsC1mV7aQ0WlPzpxRy',
    'Default Student',
    TRUE,
    FALSE
);
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
-- DEFAULT USER ROLES
-- =========================================================

INSERT INTO user_roles (user_id, role_id)
SELECT u.user_id, r.role_id
FROM users u
JOIN roles r
ON (
    (u.username = 'admin' AND r.role_code = 'admin')
    OR
    (u.username = 'teacher' AND r.role_code = 'teacher')
    OR
    (u.username = 'student' AND r.role_code = 'student')
);
-- =========================================================
-- CLASSES
-- =========================================================

CREATE TABLE classes (
    class_id BIGSERIAL PRIMARY KEY,

    class_code VARCHAR(50) UNIQUE NOT NULL,
    class_name VARCHAR(255) NOT NULL,

    description TEXT,

    owner_id BIGINT NOT NULL,

    status active_status DEFAULT 'active',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,

    CONSTRAINT fk_classes_owner
        FOREIGN KEY(owner_id)
        REFERENCES users(user_id)
);

-- =========================================================
-- SUBJECTS
-- =========================================================

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

-- =========================================================
-- TOPICS
-- =========================================================

CREATE TABLE topics (
    topic_id BIGSERIAL PRIMARY KEY,

    subject_id BIGINT NOT NULL,

    topic_name VARCHAR(255) NOT NULL,

    description TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_topics_subject
        FOREIGN KEY(subject_id)
        REFERENCES subjects(subject_id)
        ON DELETE CASCADE,

    CONSTRAINT uq_topic_subject
        UNIQUE(subject_id, topic_name)
);

-- =========================================================
-- CLASS SUBJECTS
-- =========================================================

CREATE TABLE class_subjects (
    class_subject_id BIGSERIAL PRIMARY KEY,

    class_id BIGINT NOT NULL,
    subject_id BIGINT NOT NULL,

    assigned_teacher_id BIGINT,

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
        REFERENCES users(user_id),

    CONSTRAINT uq_class_subject
        UNIQUE(class_id, subject_id)
);

-- =========================================================
-- CLASS STUDENTS
-- =========================================================

CREATE TABLE class_students (
    class_student_id BIGSERIAL PRIMARY KEY,

    class_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,

    invited_by BIGINT NOT NULL,

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

    CONSTRAINT fk_class_students_invited
        FOREIGN KEY(invited_by)
        REFERENCES users(user_id),

    CONSTRAINT uq_class_student
        UNIQUE(class_id, student_id)
);

-- =========================================================
-- CLASS TEACHERS
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
        REFERENCES users(user_id),

    CONSTRAINT uq_class_teacher
        UNIQUE(class_id, teacher_id)
);

-- =========================================================
-- DOCUMENTS
-- =========================================================

CREATE TABLE documents (
    document_id BIGSERIAL PRIMARY KEY,

    teacher_id BIGINT NOT NULL,
    subject_id BIGINT NOT NULL,
    topic_id BIGINT,

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
        REFERENCES users(user_id),

    CONSTRAINT fk_documents_subject
        FOREIGN KEY(subject_id)
        REFERENCES subjects(subject_id),

    CONSTRAINT fk_documents_topic
        FOREIGN KEY(topic_id)
        REFERENCES topics(topic_id)
);

CREATE INDEX idx_documents_subject_topic_status
ON documents(subject_id, topic_id, status);

CREATE INDEX idx_documents_teacher_created
ON documents(teacher_id, created_at);

-- =========================================================
-- AI REQUESTS
-- =========================================================

CREATE TABLE ai_requests (
    request_id BIGSERIAL PRIMARY KEY,

    teacher_id BIGINT NOT NULL,

    document_id BIGINT NOT NULL,

    num_questions INT NOT NULL,

    difficulty difficulty_level NOT NULL,

    content_scope TEXT,

    status ai_request_status DEFAULT 'pending',

    generated_question_count INT DEFAULT 0,

    retry_count INT DEFAULT 0,

    error_message TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ai_requests_teacher
        FOREIGN KEY(teacher_id)
        REFERENCES users(user_id),

    CONSTRAINT fk_ai_requests_document
        FOREIGN KEY(document_id)
        REFERENCES documents(document_id)
);

CREATE INDEX idx_ai_requests_teacher_created
ON ai_requests(teacher_id, created_at);

CREATE INDEX idx_ai_requests_status_created
ON ai_requests(status, created_at);

-- =========================================================
-- QUESTIONS
-- =========================================================

CREATE TABLE questions (
    question_id BIGSERIAL PRIMARY KEY,

    teacher_id BIGINT NOT NULL,

    subject_id BIGINT NOT NULL,
    topic_id BIGINT NOT NULL,

    document_id BIGINT,
    ai_request_id BIGINT,

    content TEXT NOT NULL,

    difficulty difficulty_level NOT NULL,

    source question_source NOT NULL,

    status question_status DEFAULT 'draft',

    explanation TEXT,

    approved_by BIGINT,
    approved_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,

    CONSTRAINT fk_questions_teacher
        FOREIGN KEY(teacher_id)
        REFERENCES users(user_id),

    CONSTRAINT fk_questions_subject
        FOREIGN KEY(subject_id)
        REFERENCES subjects(subject_id),

    CONSTRAINT fk_questions_topic
        FOREIGN KEY(topic_id)
        REFERENCES topics(topic_id),

    CONSTRAINT fk_questions_document
        FOREIGN KEY(document_id)
        REFERENCES documents(document_id),

    CONSTRAINT fk_questions_ai_request
        FOREIGN KEY(ai_request_id)
        REFERENCES ai_requests(request_id),

    CONSTRAINT fk_questions_approved_by
        FOREIGN KEY(approved_by)
        REFERENCES users(user_id)
);

CREATE INDEX idx_questions_subject_topic
ON questions(subject_id, topic_id, difficulty, status);

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
);

CREATE INDEX idx_question_history_question_changed
ON question_history(question_id, changed_at);

-- =========================================================
-- PRACTICE SETS
-- =========================================================

CREATE TABLE practice_sets (
    practice_set_id BIGSERIAL PRIMARY KEY,

    student_id BIGINT NOT NULL,

    subject_id BIGINT NOT NULL,
    topic_id BIGINT,

    difficulty difficulty_level,

    num_questions_requested INT NOT NULL,

    num_questions_actual INT,

    time_limit_minutes INT,

    prioritize_unanswered BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_practice_sets_student
        FOREIGN KEY(student_id)
        REFERENCES users(user_id),

    CONSTRAINT fk_practice_sets_subject
        FOREIGN KEY(subject_id)
        REFERENCES subjects(subject_id),

    CONSTRAINT fk_practice_sets_topic
        FOREIGN KEY(topic_id)
        REFERENCES topics(topic_id)
);

CREATE INDEX idx_practice_sets_student_created
ON practice_sets(student_id, created_at);

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
        REFERENCES questions(question_id),

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

CREATE INDEX idx_practice_attempts_set
ON practice_attempts(practice_set_id);

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
        REFERENCES questions(question_id),

    CONSTRAINT fk_student_answers_option
        FOREIGN KEY(selected_option_id)
        REFERENCES question_options(option_id),

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

CREATE INDEX idx_notifications_user_read
ON notifications(user_id, is_read);

-- =========================================================
-- AUTO UPDATE FUNCTION
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

CREATE TRIGGER trg_class_subjects_updated_at
BEFORE UPDATE ON class_subjects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- DEFAULT ROLES
-- =========================================================

INSERT INTO roles(role_code, role_name, description)
VALUES
('admin', 'Administrator', 'System administrator'),
('teacher', 'Teacher', 'Teacher role'),
('student', 'Student', 'Student role');

-- =========================================================
-- END
-- =========================================================