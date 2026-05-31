import { api } from './client';

// Database Schema Models
export interface DbDocument {
  document_id: number;
  teacher_id: number;
  subject_id: number | null;
  topic_id?: number;
  title: string;
  description?: string;
  file_url: string;
  file_hash?: string;
  file_type: string;
  file_size: number;
  status: string;
  created_at: string;
  updated_at?: string;
  subject?: { subject_id: number | null; subject_name: string };
  topics?: { topic_id: number; topic_name: string }[];
  ai_request_count?: number;
  question_count?: number;
}

export interface DbSubject {
  subject_id: number;
  subject_code: string;
  subject_name: string;
  description?: string;
  status?: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown> | null;
}

export interface DbOption {
  option_id: number;
  question_id: number;
  option_label: string;
  option_text: string;
  is_correct: boolean;
  order_num: number;
}

export interface DbQuestion {
  question_id: number;
  teacher_id: number;
  subject_id: number;
  topic_id: number;
  document_id?: number;
  ai_request_id?: number;
  content: string;
  difficulty: string;
  source: string;
  status: string;
  explanation?: string;
  options?: DbOption[];
  created_at: string;
}

// UI Models
export interface TeacherStatItem {
  label: string;
  value: string;
  growth?: string;
  sub?: string;
  icon: string;
  color: string;
  bg: string;
}

export interface RecentQuiz {
  title: string;
  info: string;
  icon: string;
  bg: string;
}

export interface MaterialStatus {
  name: string;
  date: string;
  status: string;
  statusColor: string;
}

export interface TeacherDashboardStats {
  stats: TeacherStatItem[];
  recentQuizzes: RecentQuiz[];
  materials: MaterialStatus[];
}

export interface GeneratedQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number; // index
  sourceSnippet?: string;
  confidence?: number;
  isApproved: boolean;
  type?: string;
  level?: string;
  source?: string;
  status?: string;
  explanation?: string;
  subjectId?: string | number;
  topicId?: string | number;
}

// Mappers
export const mapDbQuestionToGeneratedQuestion = (db: DbQuestion): GeneratedQuestion => {
  const options = db.options || [];
  const correctAnswerIndex = options.findIndex(o => o.is_correct);

  return {
    id: db.question_id.toString(),
    text: db.content,
    options: options.map(o => o.option_text),
    correctAnswer: correctAnswerIndex >= 0 ? correctAnswerIndex : 0,
    isApproved: db.status === 'approved',
    level: db.difficulty,
    source: db.source,
    status: db.status,
    explanation: db.explanation,
    subjectId: db.subject_id,
    topicId: db.topic_id,
  };
};

export const mapDbDocumentToTeacherResource = (db: DbDocument, usage: number = 0, subjectName: string = 'N/A', topicName?: string): TeacherResource => ({
  id: db.document_id,
  name: db.title,
  size: `${(db.file_size / (1024 * 1024)).toFixed(1)} MB`,
  date: new Date(db.created_at || Date.now()).toLocaleDateString('vi-VN'),
  usage: db.question_count ?? usage,
  subject: db.subject?.subject_name || subjectName,
  topic: db.topics?.[0]?.topic_name || topicName || 'Tong quan',
  description: db.description,
  status: db.status,
  subjectId: db.subject_id ?? undefined,
  topicIds: db.topics?.map((topic) => topic.topic_id) || [],
});

export interface BankSubject {
  id: string;
  name: string;
  count: number;
}

export interface QuestionBankData {
  subjects: BankSubject[];
  questions: GeneratedQuestion[];
}

export interface TeacherResource {
  id: number | string;
  name: string;
  size: string;
  date: string;
  usage: number;
  subject: string;
  topic?: string;
  description?: string;
  status?: string;
  subjectId?: number;
  topicId?: number;
  topicIds?: number[];
}

export interface TeacherStatsSummary {
  average_score: number;
  completion_rate_pct: number;
  total_study_hours: number;
  total_answered_questions: number;
}

export interface TeacherStatsWeakTopic {
  topic_id: number;
  topic_name: string;
  error_rate_pct: number;
  total_answers: number;
  wrong_answers: number;
}

export interface TeacherStatsStudentDistribution {
  active_rate_pct: number;
  top_student_count: number;
  needs_attention_count: number;
  total_students: number;
}

export interface TeacherStatsData {
  summary: TeacherStatsSummary;
  weak_topics: TeacherStatsWeakTopic[];
  student_distribution: TeacherStatsStudentDistribution;
}

export interface TeacherProfile {
  name: string;
  email: string;
  department: string;
}

export interface AIConfig {
  model: string;
  temperature: number;
  explainDetails: boolean;
  suggestTopics: boolean;
}

export interface TeacherSettings {
  profile: TeacherProfile;
  aiConfig: AIConfig;
}

/**
 * GET /teacher/dashboard/stats
 */
export const getTeacherDashboardStats = async (): Promise<TeacherDashboardStats> => {
  return await api.get<TeacherDashboardStats>('/teacher/dashboard/stats');
};

/**
 * POST /teacher/ai-generator/generate
 */
export const generateQuestions = async (payload: any): Promise<GeneratedQuestion[]> => {
  const dbQuestions = await api.post<DbQuestion[]>('/teacher/ai-generator/generate', payload);
  return dbQuestions.map(mapDbQuestionToGeneratedQuestion);
};

/**
 * GET /teacher/question-bank
 */
export const getQuestionBank = async (): Promise<QuestionBankData> => {
  const response = await api.get<{ subjects: BankSubject[]; questions: DbQuestion[] }>('/teacher/question-bank');
  return {
    subjects: response.subjects,
    questions: response.questions.map(mapDbQuestionToGeneratedQuestion),
  };
};

/**
 * POST /teacher/question-bank
 */
export const saveGeneratedQuestions = async (payload: { questions: GeneratedQuestion[] }): Promise<{ success: boolean }> => {
  return await api.post<{ success: boolean }>('/teacher/question-bank', payload);
};

export interface ManualQuestionPayload {
  subjectId: string;
  topicId: string;
  content: string;
  difficulty: string;
  options: string[];
  correctOptionLabel: string; // A, B, C, D
  explanation?: string;
}

/**
 * POST /teacher/question-bank/manual
 */
export const createManualQuestion = async (payload: ManualQuestionPayload): Promise<{ success: boolean; question?: GeneratedQuestion }> => {
  return await api.post<{ success: boolean; question?: GeneratedQuestion }>('/teacher/question-bank/manual', payload);
};

/**
 * PUT /teacher/question-bank/:id
 */
export const updateQuestion = async (id: string, payload: ManualQuestionPayload): Promise<{ success: boolean }> => {
  return await api.put<{ success: boolean }>(`/teacher/question-bank/${id}`, payload);
};

/**
 * DELETE /teacher/question-bank/:id
 */
export const deleteQuestion = async (id: string): Promise<{ success: boolean }> => {
  return await api.delete<{ success: boolean }>(`/teacher/question-bank/${id}`);
};

/**
 * GET /teacher/resources
 */
export const getResources = async (userId: number): Promise<TeacherResource[]> => {
  const [docsRes, subjectsRes] = await Promise.all([
    api.get<ApiEnvelope<DbDocument[]>>('/documents', {
      params: { page: '1', limit: '100' },
    }),
    api.get<ApiEnvelope<DbSubject[]>>('/subjects', {
      params: { page: '1', limit: '100' },
    }),
  ]);

  const dbDocs = (docsRes.data || []).filter((doc) => doc.teacher_id === userId);
  const subjects = subjectsRes.data || [];
  const subjectNameById = new Map<number, string>(
    subjects.map((subject) => [subject.subject_id, subject.subject_name]),
  );

  return dbDocs.map((doc) => {
    const sid = doc.subject_id ?? doc.subject?.subject_id ?? null;
    const resolvedName = sid ? subjectNameById.get(sid) || doc.subject?.subject_name || 'N/A' : doc.subject?.subject_name || 'N/A';
    return mapDbDocumentToTeacherResource(doc, 0, resolvedName);
  });
};

export interface UploadResourcePayload {
  title: string;
  subject_id?: number;
  topic_id?: number;
  topic_ids?: number[];
  description?: string;
  file: File;
}

export interface TeacherDocument {
  document_id: number;
  teacher_id: number;
  subject_id: number | null;
  title: string;
  description?: string;
  file_url: string;
  file_type: string;
  file_size: number;
  status: string;
  created_at: string;
  updated_at?: string;
  subject: { subject_id: number | null; subject_name: string };
  topics: { topic_id: number; topic_name: string }[];
  ai_request_count?: number;
  question_count?: number;
  warning?: { has_related_history: boolean; message: string };
}

export interface TeacherDocumentListParams {
  page?: number;
  limit?: number;
  search?: string;
  subject_id?: number;
  topic_id?: number;
  uploaded_from?: string;
  uploaded_to?: string;
  status?: 'active' | 'inactive';
}

/**
 * GET /subjects
 */
export const getSubjects = async (userId: number): Promise<DbSubject[]> => {
  const [subjectsRes, docsRes] = await Promise.all([
    api.get<ApiEnvelope<DbSubject[]>>('/subjects', {
      params: { page: '1', limit: '100' },
    }),
    api.get<ApiEnvelope<DbDocument[]>>('/documents', {
      params: { page: '1', limit: '100', teacher_id: userId.toString() },
    }),
  ]);

  const subjects = subjectsRes.data || [];
  const docs = (docsRes.data || []).filter((doc) => doc.teacher_id === userId);
  const subjectIds = new Set(
    docs
      .map((doc) => doc.subject_id ?? doc.subject?.subject_id ?? null)
      .filter((id): id is number => id !== null),
  );
  return subjects.filter((subject) => subjectIds.has(subject.subject_id));
};

/**
 * GET /topics
 */
export const getTopics = async (userId: number): Promise<DbTopic[]> => {
  const topicsRes = await api.get<ApiEnvelope<DbTopic[]>>('/topics', {
    params: { page: '1', limit: '200' },
  });
  return topicsRes.data || [];
};

/**
 * POST /documents/upload
 */
export const uploadDocument = async (payload: UploadResourcePayload): Promise<DbDocument> => {
  const formData = new FormData();
  formData.append('file', payload.file);
  formData.append('title', payload.title);
  if (payload.topic_id !== undefined) formData.append('topic_ids', payload.topic_id.toString());
  for (const topicId of payload.topic_ids || []) {
    formData.append('topic_ids', topicId.toString());
  }
  if (payload.description) formData.append('description', payload.description);

  const res = await api.post<ApiEnvelope<DbDocument>>('/documents/upload', formData);
  return res.data;
};

export const uploadResource = async (payload: UploadResourcePayload): Promise<TeacherResource> => {
  const doc = await uploadDocument(payload);
  return mapDbDocumentToTeacherResource(doc, 0, 'Moi tai len');
};

/**
 * PUT /teacher/resources/:id
 */
export const updateResource = async (id: number | string, payload: Partial<UploadResourcePayload>): Promise<{ success: boolean; data?: TeacherResource }> => {
  const res = await api.put<ApiEnvelope<DbDocument>>(`/documents/${id}`, payload);
  return {
    success: res.success,
    data: res.data ? mapDbDocumentToTeacherResource(res.data, 0) : undefined,
  };
};

/**
 * DELETE /teacher/resources/:id
 */
export const deleteResource = async (id: number | string): Promise<{ success: boolean }> => {
  const res = await api.delete<ApiEnvelope<{ document_id: number; deleted: boolean }>>(`/documents/${id}`);
  return { success: res.success };
};

/**
 * GET /teacher/stats
 */
export interface GetTeacherStatsParams {
  subjectId?: number;
  topicId?: number;
  debug?: boolean;
}

export const getTeacherStats = async (params: GetTeacherStatsParams = {}): Promise<TeacherStatsData> => {
  const query: Record<string, string> = {};
  if (params.subjectId) {
    query.subject_id = String(params.subjectId);
  }
  if (params.topicId) {
    query.topic_id = String(params.topicId);
  }
  if (params.debug) {
    query.debug = 'true';
  }

  const response = await api.get<ApiEnvelope<TeacherStatsData>>('/teacher/stats', {
    params: query,
  });
  return response.data;
};
export interface DbTopic {
  topic_id: number;
  subject_id?: number;
  topic_name: string;
  description?: string;
  status?: string;
}

/**
 * GET /teacher/topics?subject_id=...
 */
export const getTopicsBySubject = async (subjectId: string | number): Promise<DbTopic[]> => {
  return await api.get<DbTopic[]>(`/teacher/topics?subject_id=${subjectId}`);
};

/**
 * POST /teacher/topics
 */
export const createTopic = async (payload: { subject_id: number; topic_name: string; description?: string }): Promise<DbTopic> => {
  return await api.post<DbTopic>('/teacher/topics', payload);
};

/**
 * PUT /teacher/topics/:id
 */
export const updateTopic = async (id: string | number, payload: Partial<DbTopic>): Promise<DbTopic> => {
  return await api.put<DbTopic>(`/teacher/topics/${id}`, payload);
};

/**
 * DELETE /teacher/topics/:id
 */
export const deleteTopic = async (id: string | number): Promise<void> => {
  await api.delete<void>(`/teacher/topics/${id}`);
};



