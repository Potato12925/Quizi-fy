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

export interface AiGeneratorOptionSubject {
  subject_id: number;
  subject_name: string;
}

export interface AiGeneratorOptionTopic {
  topic_id: number;
  topic_name: string;
  subject_id: number;
  subject_name: string;
}

export interface AiGeneratorOptionDocument {
  document_id: number;
  document_title: string;
  subject_id: number;
}

export interface AiGeneratorOptionDocumentTopic {
  document_topic_id: number;
  document_id: number;
  document_title: string;
  topic_id: number;
  topic_name: string;
  subject_id: number;
  subject_name: string;
}

export interface AiGeneratorOptionsResponse {
  subjects: AiGeneratorOptionSubject[];
  topics: AiGeneratorOptionTopic[];
  documents: AiGeneratorOptionDocument[];
  document_topics: AiGeneratorOptionDocumentTopic[];
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
  created_at: string;
  updated_at: string;
  document_topic: AiGeneratorOptionDocumentTopic;
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

export interface UpdateTeacherQuestionPayload {
  content: string;
  difficulty: Difficulty;
  explanation?: string;
  options: string[];
  correct_option_index: number;
}

export interface BulkQuestionStatusPayload {
  question_ids: number[];
}

export interface CreateManualQuestionPayload {
  document_topic_id: number;
  content: string;
  difficulty: Difficulty;
  explanation?: string;
  options: string[];
  correct_option_index: number;
}

export const getTeacherAiGeneratorOptions = async (): Promise<AiGeneratorOptionsResponse> => {
  const res = await api.get<ApiEnvelope<AiGeneratorOptionsResponse>>('/teacher/ai-generator/options');
  return res.data;
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

export const getTeacherAiRequestDetail = async (requestId: number): Promise<TeacherAiRequestItem> => {
  const res = await api.get<ApiEnvelope<TeacherAiRequestItem>>(`/teacher/ai-requests/${requestId}`);
  return res.data;
};

export const getTeacherAiRequestQuestions = async (requestId: number): Promise<TeacherAiQuestionItem[]> => {
  const res = await api.get<ApiEnvelope<TeacherAiQuestionItem[]>>(`/teacher/ai-requests/${requestId}/questions`);
  return res.data || [];
};

export const retryTeacherAiRequest = async (requestId: number): Promise<TeacherAiRequestItem> => {
  const res = await api.post<ApiEnvelope<TeacherAiRequestItem>>(`/teacher/ai-requests/${requestId}/retry`);
  return res.data;
};

export const patchTeacherQuestion = async (
  questionId: number,
  payload: UpdateTeacherQuestionPayload,
): Promise<TeacherAiQuestionItem> => {
  const res = await api.patch<ApiEnvelope<TeacherAiQuestionItem>>(`/teacher/questions/${questionId}`, payload);
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

export const createTeacherManualQuestionFromAiGenerator = async (
  payload: CreateManualQuestionPayload,
): Promise<TeacherAiQuestionItem> => {
  const res = await api.post<ApiEnvelope<TeacherAiQuestionItem>>('/teacher/questions/manual', payload);
  return res.data;
};
