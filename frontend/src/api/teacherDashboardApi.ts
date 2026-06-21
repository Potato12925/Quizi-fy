import { api } from './client';

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown> | null;
}

export interface TeacherDashboardTeacher {
  user_id: number;
  username: string;
}

export interface TeacherDashboardSummary {
  total_assigned_subjects: number;
  total_topics: number;
  total_documents: number;
  total_ai_requests: number;
  total_questions: number;
}

export interface TeacherAiRequestStatuses {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled: number;
}

export interface TeacherQuestionStatuses {
  draft: number;
  approved: number;
  rejected: number;
  inactive: number;
}

export interface TeacherQuestionDifficulty {
  recognition: number;
  comprehension: number;
  application: number;
  advanced: number;
}

export interface TeacherDashboardInsights {
  ai_completion_rate_pct: number;
  question_approval_rate_pct: number;
  pending_ai_requests: number;
  draft_questions: number;
}

export interface TeacherDashboardRecentAiRequest {
  request_id: number;
  document_topic_id: number;
  document_id: number | null;
  document_title: string | null;
  topic_id: number | null;
  topic_name: string | null;
  subject_id: number | null;
  subject_name: string | null;
  num_questions: number;
  difficulty: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | string;
  generated_question_count: number;
  is_reviewed: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface TeacherDashboardRecentDocument {
  document_id: number;
  title: string;
  status: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string | null;
  updated_at: string | null;
  subject_id: number | null;
  subject_name: string | null;
  topic_ids: number[];
  topic_names: string[];
  ai_request_count: number;
  question_count: number;
  latest_ai_status: string | null;
}

export interface TeacherDashboardRecentApprovedQuestion {
  question_id: number;
  document_topic_id: number;
  ai_request_id: number | null;
  content: string;
  difficulty: string;
  source: string;
  status: string;
  document_id: number | null;
  document_title: string | null;
  topic_id: number | null;
  topic_name: string | null;
  subject_id: number | null;
  subject_name: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface TeacherDashboardUploadTopic {
  topic_id: number;
  topic_name: string;
}

export interface TeacherDashboardUploadSubject {
  subject_id: number;
  subject_name: string;
  topics: TeacherDashboardUploadTopic[];
}

export interface TeacherDashboardData {
  teacher: TeacherDashboardTeacher;
  summary: TeacherDashboardSummary;
  ai_request_statuses: TeacherAiRequestStatuses;
  question_statuses: TeacherQuestionStatuses;
  question_difficulty: TeacherQuestionDifficulty;
  insights: TeacherDashboardInsights;
  recent_ai_requests: TeacherDashboardRecentAiRequest[];
  recent_documents: TeacherDashboardRecentDocument[];
  recent_approved_questions: TeacherDashboardRecentApprovedQuestion[];
  upload_subjects: TeacherDashboardUploadSubject[];
}

export interface UploadTeacherDashboardDocumentPayload {
  title: string;
  topic_ids: number[];
  description?: string;
  file: File;
}

export const getTeacherDashboardStats = async (recentLimit = 5): Promise<TeacherDashboardData> => {
  const response = await api.get<ApiEnvelope<TeacherDashboardData>>('/teacher/dashboard/stats', {
    params: { recent_limit: String(recentLimit) },
  });
  return response.data;
};

export const uploadTeacherDashboardDocument = async (
  payload: UploadTeacherDashboardDocumentPayload,
): Promise<void> => {
  const formData = new FormData();
  formData.append('file', payload.file);
  formData.append('title', payload.title);
  if (payload.description) formData.append('description', payload.description);
  for (const topicId of payload.topic_ids) {
    formData.append('topic_ids', String(topicId));
  }
  await api.post<ApiEnvelope<unknown>>('/documents/upload', formData);
};
