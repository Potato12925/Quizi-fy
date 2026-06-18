import { ApiError, api } from './client';

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown> | null;
}

export type QuestionDifficulty =
  | 'recognition'
  | 'comprehension'
  | 'application'
  | 'advanced';

export type QuestionImageInfo = {
  image_id: number;
  file_url: string;
  file_name?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
};

export interface AssignedSubject {
  subject_id: number;
  subject_code: string;
  subject_name: string;
}

export interface TopicItem {
  topic_id: number;
  class_subject_id: number;
  subject_id: number;
  topic_name: string;
}

export interface QuestionOptionItem {
  option_id: number;
  option_label: string;
  option_text: string;
  is_correct: boolean;
  order_num: number;
}

export interface TeacherQuestionBankItem {
  question_id: number;
  content: string;
  difficulty: QuestionDifficulty;
  source: string;
  status: 'draft' | 'approved' | 'inactive' | 'rejected';
  explanation?: string;
  created_at: string;
  updated_at?: string;
  document_topic_id: number;
  image_id?: number | null;
  image?: QuestionImageInfo | null;
  topic_id: number;
  topic_name: string;
  subject_id: number;
  subject_name: string;
  document_id: number;
  document_title: string;
  options: QuestionOptionItem[];
}

export interface DocumentTopicOption {
  document_topic_id: number;
  document_id: number;
  document_title: string;
  topic_id: number;
  topic_name: string;
  subject_id: number;
  subject_name: string;
}

export interface QuestionBankFilters {
  page?: number;
  limit?: number;
  class_subject_id?: number;
  subject_id?: number;
  topic_id?: number;
  difficulty?: QuestionDifficulty;
  status?: 'draft' | 'approved' | 'inactive' | 'rejected';
  source?: string;
  keyword?: string;
}

export interface ManualQuestionPayloadV2 {
  document_topic_id?: number;
  topic_id?: number;
  image_id?: number | null;
  content: string;
  difficulty: QuestionDifficulty;
  status: 'draft' | 'approved' | 'inactive' | 'rejected';
  explanation?: string;
  options: string[];
  correct_option_index: number;
}

export const getTeacherQuestionImageErrorMessage = (
  error: unknown,
  fallback = 'Có lỗi xảy ra khi lưu dữ liệu',
) => {
  if (!(error instanceof ApiError)) return fallback;

  const errorCode = error.data?.error?.code;
  if (errorCode === 'QUESTION_IMAGE_NOT_FOUND') return 'Không tìm thấy ảnh minh họa';
  if (errorCode === 'QUESTION_IMAGE_INVALID_TYPE') return 'Ảnh không đúng loại dành cho câu hỏi';
  if (errorCode === 'QUESTION_IMAGE_FORBIDDEN') return 'Bạn không có quyền sử dụng ảnh này';

  return typeof error.data?.message === 'string' && error.data.message.trim()
    ? error.data.message
    : fallback;
};

export const getAssignedSubjects = async (): Promise<AssignedSubject[]> => {
  const res = await api.get<ApiEnvelope<AssignedSubject[]>>('/subjects', {
    params: { page: '1', limit: '100' },
  });
  return res.data || [];
};

export const getTopicsBySubjectId = async (subjectId: number): Promise<TopicItem[]> => {
  const res = await api.get<ApiEnvelope<TopicItem[]>>('/topics', {
    params: { page: '1', limit: '100', subject_id: String(subjectId) },
  });
  return res.data || [];
};

export const getTeacherQuestionBank = async (
  filters: QuestionBankFilters,
): Promise<{ items: TeacherQuestionBankItem[]; meta: Record<string, unknown> | null }> => {
  const params: Record<string, string> = {
    page: String(filters.page ?? 1),
    limit: String(filters.limit ?? 50),
  };
  if (filters.class_subject_id) params.class_subject_id = String(filters.class_subject_id);
  if (filters.subject_id) params.subject_id = String(filters.subject_id);
  if (filters.topic_id) params.topic_id = String(filters.topic_id);
  if (filters.difficulty) params.difficulty = filters.difficulty;
  if (filters.status) params.status = filters.status;
  if (filters.source) params.source = filters.source;
  if (filters.keyword) params.keyword = filters.keyword;

  const res = await api.get<ApiEnvelope<TeacherQuestionBankItem[]>>('/teacher/question-bank', { params });
  return { items: res.data || [], meta: res.meta || null };
};

export const getDocumentTopicOptions = async (
  subjectId: number,
  topicId?: number,
): Promise<DocumentTopicOption[]> => {
  const params: Record<string, string> = { subject_id: String(subjectId) };
  if (topicId) params.topic_id = String(topicId);
  const res = await api.get<ApiEnvelope<DocumentTopicOption[]>>(
    '/teacher/question-bank/document-topic-options',
    { params },
  );
  return res.data || [];
};

export const createTeacherManualQuestion = async (
  payload: ManualQuestionPayloadV2,
): Promise<TeacherQuestionBankItem> => {
  const res = await api.post<ApiEnvelope<TeacherQuestionBankItem>>(
    '/teacher/question-bank/manual',
    payload,
  );
  return res.data;
};

export const updateTeacherQuestion = async (
  questionId: number,
  payload: ManualQuestionPayloadV2,
): Promise<TeacherQuestionBankItem> => {
  const res = await api.put<ApiEnvelope<TeacherQuestionBankItem>>(
    `/teacher/question-bank/${questionId}`,
    payload,
  );
  return res.data;
};

export const updateTeacherQuestionStatus = async (
  questionId: number,
  status: 'draft' | 'approved' | 'inactive' | 'rejected',
): Promise<void> => {
  await api.patch<ApiEnvelope<{ question_id: number; status: string }>>(
    `/teacher/question-bank/${questionId}/status`,
    { status },
  );
};

export const softDeleteTeacherQuestion = async (questionId: number): Promise<void> => {
  await api.delete<ApiEnvelope<{ question_id: number; deleted: boolean }>>(
    `/teacher/question-bank/${questionId}`,
  );
};
