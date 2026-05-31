import { api } from './client';

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown> | null;
}

export type Difficulty = 'easy' | 'medium' | 'hard';
export type AiRequestStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type QuestionStatus = 'draft' | 'approved' | 'inactive' | 'rejected';

export interface TeacherAssignedSubject {
  subject_id: number;
  subject_code: string;
  subject_name: string;
}

export interface TeacherTopicItem {
  topic_id: number;
  class_subject_id: number;
  subject_id: number;
  topic_name: string;
}

export interface TeacherDocumentTopicOption {
  document_topic_id: number;
  document_id: number;
  document_title: string;
  file_type?: string | null;
  file_size?: number | null;
  created_at?: string | null;
  status?: string | null;
  topic_id: number;
  topic_name: string;
  class_subject_id: number;
  subject_id: number;
  subject_name: string;
}

export interface TeacherAiRequestItem {
  request_id: number;
  document_topic_id: number;
  num_questions: number;
  difficulty: Difficulty;
  content_scope?: string | null;
  status: AiRequestStatus;
  generated_question_count: number;
  retry_count: number;
  error_message?: string | null;
  is_reviewed: boolean;
  created_at: string;
  updated_at: string;
  document_topic: TeacherDocumentTopicOption;
}

export interface TeacherAiQuestionOption {
  option_id: number;
  option_label: string;
  option_text: string;
  is_correct: boolean;
  order_num: number;
}

export interface TeacherAiQuestionItem {
  question_id: number;
  teacher_id: number;
  document_topic_id: number;
  ai_request_id?: number | null;
  content: string;
  difficulty: Difficulty;
  source: 'ai' | 'manual';
  status: QuestionStatus;
  explanation?: string | null;
  created_at: string;
  updated_at?: string;
  document_id: number;
  document_title: string;
  topic_id: number;
  topic_name: string;
  class_subject_id: number;
  subject_id: number;
  subject_name: string;
  options: TeacherAiQuestionOption[];
}

export interface CreateTeacherAiRequestPayload {
  document_topic_id: number;
  num_questions: number;
  difficulty: Difficulty;
  content_scope?: string;
}

export interface BulkQuestionStatusPayload {
  question_ids: number[];
}

export interface TeacherAiReviewOptionPayload {
  option_text: string;
  order_num: number;
  is_correct: boolean;
}

export interface TeacherAiReviewQuestionPayload {
  question_id: number;
  content: string;
  difficulty: Difficulty;
  status: Extract<QuestionStatus, 'draft' | 'approved' | 'rejected'>;
  explanation?: string | null;
  options: TeacherAiReviewOptionPayload[];
}

export interface TeacherAiRequestConfirmReviewPayload {
  questions: TeacherAiReviewQuestionPayload[];
}

export interface TeacherAiRequestConfirmReviewResult {
  request: TeacherAiRequestItem;
  updated_question_ids: number[];
  updated_count: number;
}

export const getTeacherAssignedSubjects = async (): Promise<TeacherAssignedSubject[]> => {
  const res = await api.get<ApiEnvelope<TeacherAssignedSubject[]>>('/subjects', {
    params: { page: '1', limit: '100' },
  });
  return res.data || [];
};

export const getTeacherTopicsBySubjectId = async (subjectId: number): Promise<TeacherTopicItem[]> => {
  const res = await api.get<ApiEnvelope<TeacherTopicItem[]>>('/topics', {
    params: { page: '1', limit: '200', subject_id: String(subjectId) },
  });
  return res.data || [];
};

export const getTeacherDocumentsBySubjectTopic = async (
  subjectId: number,
  topicId?: number,
): Promise<TeacherDocumentTopicOption[]> => {
  const params: Record<string, string> = { subject_id: String(subjectId) };
  if (topicId) params.topic_id = String(topicId);
  const res = await api.get<ApiEnvelope<TeacherDocumentTopicOption[]>>('/teacher/question-bank/document-topic-options', {
    params,
  });
  return res.data || [];
};

export const createTeacherAiRequest = async (payload: CreateTeacherAiRequestPayload): Promise<TeacherAiRequestItem> => {
  const res = await api.post<ApiEnvelope<TeacherAiRequestItem>>('/teacher/ai-requests', payload);
  return res.data;
};

export const getTeacherAiRequests = async (
  page = 1,
  limit = 50,
): Promise<{ items: TeacherAiRequestItem[]; meta: Record<string, unknown> | null }> => {
  const res = await api.get<ApiEnvelope<TeacherAiRequestItem[]>>('/teacher/ai-requests', {
    params: { page: String(page), limit: String(limit) },
  });
  return { items: res.data || [], meta: res.meta || null };
};

export const getTeacherAiRequestQuestions = async (requestId: number): Promise<TeacherAiQuestionItem[]> => {
  const res = await api.get<ApiEnvelope<TeacherAiQuestionItem[]>>(`/teacher/ai-requests/${requestId}/questions`);
  return res.data || [];
};

export const retryTeacherAiRequest = async (requestId: number): Promise<TeacherAiRequestItem> => {
  const res = await api.post<ApiEnvelope<TeacherAiRequestItem>>(`/teacher/ai-requests/${requestId}/retry`);
  return res.data;
};

export const bulkApproveTeacherQuestions = async (payload: BulkQuestionStatusPayload): Promise<{ updated_question_ids: number[] }> => {
  const res = await api.post<ApiEnvelope<{ updated_question_ids: number[] }>>('/teacher/questions/bulk-approve', payload);
  return res.data;
};

export const bulkRejectTeacherQuestions = async (payload: BulkQuestionStatusPayload): Promise<{ updated_question_ids: number[] }> => {
  const res = await api.post<ApiEnvelope<{ updated_question_ids: number[] }>>('/teacher/questions/bulk-reject', payload);
  return res.data;
};

export const setTeacherGeneratedQuestionStatus = async (questionId: number, status: QuestionStatus): Promise<void> => {
  await api.patch<ApiEnvelope<{ question_id: number; status: QuestionStatus }>>(`/teacher/question-bank/${questionId}/status`, { status });
};

export const softDeleteTeacherGeneratedQuestion = async (questionId: number): Promise<void> => {
  await api.delete<ApiEnvelope<{ question_id: number; deleted: boolean }>>(`/teacher/question-bank/${questionId}`);
};

export const confirmTeacherAiRequestReview = async (
  requestId: number,
  payload: TeacherAiRequestConfirmReviewPayload,
): Promise<TeacherAiRequestConfirmReviewResult> => {
  const res = await api.post<ApiEnvelope<TeacherAiRequestConfirmReviewResult>>(`/teacher/ai-requests/${requestId}/confirm-review`, payload);
  return res.data;
};
