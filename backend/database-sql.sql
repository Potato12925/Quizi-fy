-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.ai_requests (
  request_id bigint NOT NULL DEFAULT nextval('ai_requests_request_id_seq'::regclass),
  document_topic_id bigint NOT NULL,
  num_questions integer NOT NULL,
  difficulty USER-DEFINED NOT NULL,
  content_scope text,
  status USER-DEFINED DEFAULT 'pending'::ai_request_status,
  generated_question_count integer DEFAULT 0,
  retry_count integer DEFAULT 0,
  error_message text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  is_reviewed boolean NOT NULL DEFAULT false,
  CONSTRAINT ai_requests_pkey PRIMARY KEY (request_id),
  CONSTRAINT ai_requests_document_topic_id_fkey FOREIGN KEY (document_topic_id) REFERENCES public.document_topics(document_topic_id)
);
CREATE TABLE public.class_students (
  class_student_id bigint NOT NULL DEFAULT nextval('class_students_class_student_id_seq'::regclass),
  class_id bigint NOT NULL,
  student_id bigint NOT NULL,
  joined_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  CONSTRAINT class_students_pkey PRIMARY KEY (class_student_id),
  CONSTRAINT class_students_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(class_id),
  CONSTRAINT class_students_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.class_subjects (
  class_subject_id bigint NOT NULL DEFAULT nextval('class_subjects_class_subject_id_seq'::regclass),
  class_id bigint NOT NULL,
  subject_id bigint NOT NULL,
  assigned_teacher_id bigint,
  status USER-DEFINED DEFAULT 'active'::active_status,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  CONSTRAINT class_subjects_pkey PRIMARY KEY (class_subject_id),
  CONSTRAINT class_subjects_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(class_id),
  CONSTRAINT class_subjects_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(subject_id),
  CONSTRAINT class_subjects_assigned_teacher_id_fkey FOREIGN KEY (assigned_teacher_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.class_teachers (
  class_teacher_id bigint NOT NULL DEFAULT nextval('class_teachers_class_teacher_id_seq'::regclass),
  class_id bigint NOT NULL,
  teacher_id bigint NOT NULL,
  joined_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  CONSTRAINT class_teachers_pkey PRIMARY KEY (class_teacher_id),
  CONSTRAINT class_teachers_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(class_id),
  CONSTRAINT class_teachers_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.classes (
  class_id bigint NOT NULL DEFAULT nextval('classes_class_id_seq'::regclass),
  class_code character varying NOT NULL UNIQUE,
  class_name character varying NOT NULL,
  description text,
  teacher_id bigint NOT NULL,
  status USER-DEFINED DEFAULT 'active'::active_status,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  CONSTRAINT classes_pkey PRIMARY KEY (class_id),
  CONSTRAINT classes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.document_topics (
  document_topic_id bigint NOT NULL DEFAULT nextval('document_topics_document_topic_id_seq'::regclass),
  document_id bigint NOT NULL,
  topic_id bigint NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT document_topics_pkey PRIMARY KEY (document_topic_id),
  CONSTRAINT document_topics_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(document_id),
  CONSTRAINT document_topics_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.topics(topic_id)
);
CREATE TABLE public.documents (
  document_id bigint NOT NULL DEFAULT nextval('documents_document_id_seq'::regclass),
  teacher_id bigint NOT NULL,
  title character varying NOT NULL,
  description text,
  file_url text NOT NULL,
  file_hash character varying,
  file_type character varying NOT NULL,
  file_size bigint NOT NULL,
  status USER-DEFINED DEFAULT 'active'::active_status,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  CONSTRAINT documents_pkey PRIMARY KEY (document_id),
  CONSTRAINT documents_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.notifications (
  notification_id bigint NOT NULL DEFAULT nextval('notifications_notification_id_seq'::regclass),
  user_id bigint NOT NULL,
  title character varying,
  content text,
  is_read boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT notifications_pkey PRIMARY KEY (notification_id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.practice_attempts (
  attempt_id bigint NOT NULL DEFAULT nextval('practice_attempts_attempt_id_seq'::regclass),
  practice_set_id bigint NOT NULL,
  started_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  submitted_at timestamp without time zone,
  score numeric,
  total_correct integer DEFAULT 0,
  total_wrong integer DEFAULT 0,
  status USER-DEFINED DEFAULT 'in_progress'::practice_attempt_status,
  CONSTRAINT practice_attempts_pkey PRIMARY KEY (attempt_id),
  CONSTRAINT practice_attempts_practice_set_id_fkey FOREIGN KEY (practice_set_id) REFERENCES public.practice_sets(practice_set_id)
);
CREATE TABLE public.practice_set_questions (
  practice_set_question_id bigint NOT NULL DEFAULT nextval('practice_set_questions_practice_set_question_id_seq'::regclass),
  practice_set_id bigint NOT NULL,
  question_id bigint NOT NULL,
  order_num integer NOT NULL,
  CONSTRAINT practice_set_questions_pkey PRIMARY KEY (practice_set_question_id),
  CONSTRAINT practice_set_questions_practice_set_id_fkey FOREIGN KEY (practice_set_id) REFERENCES public.practice_sets(practice_set_id),
  CONSTRAINT practice_set_questions_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(question_id)
);
CREATE TABLE public.practice_sets (
  practice_set_id bigint NOT NULL DEFAULT nextval('practice_sets_practice_set_id_seq'::regclass),
  student_id bigint NOT NULL,
  subject_id bigint NOT NULL,
  document_topic_id bigint,
  difficulty USER-DEFINED,
  num_questions_requested integer NOT NULL,
  num_questions_actual integer,
  time_limit_minutes integer,
  prioritize_unanswered boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT practice_sets_pkey PRIMARY KEY (practice_set_id),
  CONSTRAINT practice_sets_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(user_id),
  CONSTRAINT practice_sets_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(subject_id),
  CONSTRAINT practice_sets_document_topic_id_fkey FOREIGN KEY (document_topic_id) REFERENCES public.document_topics(document_topic_id)
);
CREATE TABLE public.question_history (
  history_id bigint NOT NULL DEFAULT nextval('question_history_history_id_seq'::regclass),
  question_id bigint NOT NULL,
  changed_by bigint NOT NULL,
  old_data jsonb,
  new_data jsonb,
  change_type character varying,
  changed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT question_history_pkey PRIMARY KEY (history_id),
  CONSTRAINT question_history_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(question_id),
  CONSTRAINT question_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(user_id)
);
CREATE TABLE public.question_options (
  option_id bigint NOT NULL DEFAULT nextval('question_options_option_id_seq'::regclass),
  question_id bigint NOT NULL,
  option_label character varying NOT NULL,
  option_text text NOT NULL,
  is_correct boolean DEFAULT false,
  order_num integer NOT NULL,
  CONSTRAINT question_options_pkey PRIMARY KEY (option_id),
  CONSTRAINT question_options_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(question_id)
);
CREATE TABLE public.questions (
  question_id bigint NOT NULL DEFAULT nextval('questions_question_id_seq'::regclass),
  teacher_id bigint NOT NULL,
  document_topic_id bigint,
  ai_request_id bigint,
  content text NOT NULL,
  difficulty USER-DEFINED NOT NULL,
  source USER-DEFINED NOT NULL,
  status USER-DEFINED DEFAULT 'draft'::question_status,
  explanation text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  CONSTRAINT questions_pkey PRIMARY KEY (question_id),
  CONSTRAINT questions_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.users(user_id),
  CONSTRAINT questions_document_topic_id_fkey FOREIGN KEY (document_topic_id) REFERENCES public.document_topics(document_topic_id),
  CONSTRAINT questions_ai_request_id_fkey FOREIGN KEY (ai_request_id) REFERENCES public.ai_requests(request_id)
);
CREATE TABLE public.roles (
  role_id bigint NOT NULL DEFAULT nextval('roles_role_id_seq'::regclass),
  role_code character varying NOT NULL UNIQUE,
  role_name character varying NOT NULL,
  description text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT roles_pkey PRIMARY KEY (role_id)
);
CREATE TABLE public.student_answers (
  answer_id bigint NOT NULL DEFAULT nextval('student_answers_answer_id_seq'::regclass),
  attempt_id bigint NOT NULL,
  question_id bigint NOT NULL,
  selected_option_id bigint,
  is_correct boolean,
  answered_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT student_answers_pkey PRIMARY KEY (answer_id),
  CONSTRAINT student_answers_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES public.practice_attempts(attempt_id),
  CONSTRAINT student_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(question_id),
  CONSTRAINT student_answers_selected_option_id_fkey FOREIGN KEY (selected_option_id) REFERENCES public.question_options(option_id)
);
CREATE TABLE public.subjects (
  subject_id bigint NOT NULL DEFAULT nextval('subjects_subject_id_seq'::regclass),
  subject_code character varying NOT NULL UNIQUE,
  subject_name character varying NOT NULL,
  description text,
  status USER-DEFINED DEFAULT 'active'::active_status,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  CONSTRAINT subjects_pkey PRIMARY KEY (subject_id)
);
CREATE TABLE public.topics (
  topic_id bigint NOT NULL DEFAULT nextval('topics_topic_id_seq'::regclass),
  topic_name character varying NOT NULL,
  description text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  class_subject_id bigint,
  CONSTRAINT topics_pkey PRIMARY KEY (topic_id),
  CONSTRAINT topics_class_subject_id_fkey FOREIGN KEY (class_subject_id) REFERENCES public.class_subjects(class_subject_id)
);
CREATE TABLE public.user_roles (
  user_role_id bigint NOT NULL DEFAULT nextval('user_roles_user_role_id_seq'::regclass),
  user_id bigint NOT NULL,
  role_id bigint NOT NULL,
  assigned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_roles_pkey PRIMARY KEY (user_role_id),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id),
  CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id)
);
CREATE TABLE public.users (
  user_id bigint NOT NULL DEFAULT nextval('users_user_id_seq'::regclass),
  username character varying NOT NULL UNIQUE,
  password_hash character varying NOT NULL,
  full_name character varying NOT NULL,
  is_active boolean DEFAULT true,
  must_change_password boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  deleted_at timestamp without time zone,
  CONSTRAINT users_pkey PRIMARY KEY (user_id)
);