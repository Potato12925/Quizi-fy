import { api } from './client';

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown> | null;
}

export interface TeacherDocument {
  document_id: number;
  teacher_id: number;
  subject_id: number;
  title: string;
  description?: string;
  file_url: string;
  file_type: string;
  file_size: number;
  status: string;
  created_at: string;
  updated_at?: string;
  subject: { subject_id: number; subject_name: string };
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

export interface UploadTeacherDocumentPayload {
  title: string;
  subject_id: number;
  topic_ids?: number[];
  description?: string;
  file: File;
}

export interface UpdateTeacherDocumentPayload {
  title?: string;
  subject_id?: number;
  topic_ids?: number[];
  description?: string;
  status?: string;
  file?: File;
}

export const getTeacherDocuments = async (params: TeacherDocumentListParams = {}): Promise<{ items: TeacherDocument[]; meta?: Record<string, unknown> | null }> => {
  const query: Record<string, string> = {
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 20),
  };
  if (params.search) query.search = params.search;
  if (params.subject_id) query.subject_id = String(params.subject_id);
  if (params.topic_id) query.topic_id = String(params.topic_id);
  if (params.uploaded_from) query.uploaded_from = params.uploaded_from;
  if (params.uploaded_to) query.uploaded_to = params.uploaded_to;
  if (params.status) query.status = params.status;

  const res = await api.get<ApiEnvelope<TeacherDocument[]>>('/documents', { params: query });
  return { items: res.data || [], meta: res.meta };
};

export const getTeacherDocumentDetail = async (documentId: number): Promise<TeacherDocument> => {
  const res = await api.get<ApiEnvelope<TeacherDocument>>(`/documents/${documentId}`);
  return res.data;
};

export const uploadTeacherDocument = async (payload: UploadTeacherDocumentPayload): Promise<TeacherDocument> => {
  const formData = new FormData();
  formData.append('file', payload.file);
  formData.append('title', payload.title);
  formData.append('subject_id', String(payload.subject_id));
  if (payload.description) formData.append('description', payload.description);
  for (const topicId of payload.topic_ids || []) {
    formData.append('topic_ids', String(topicId));
  }

  const res = await api.post<ApiEnvelope<TeacherDocument>>('/documents/upload', formData);
  return res.data;
};

export const updateTeacherDocument = async (documentId: number, payload: UpdateTeacherDocumentPayload): Promise<TeacherDocument> => {
  const formData = new FormData();
  if (payload.title !== undefined) formData.append('title', payload.title);
  if (payload.description !== undefined) formData.append('description', payload.description);
  if (payload.subject_id !== undefined) formData.append('subject_id', String(payload.subject_id));
  if (payload.status !== undefined) formData.append('status', payload.status);
  for (const topicId of payload.topic_ids || []) {
    formData.append('topic_ids', String(topicId));
  }
  if (payload.file) formData.append('file', payload.file);

  const res = await api.put<ApiEnvelope<TeacherDocument>>(`/documents/${documentId}`, formData);
  return res.data;
};

export const softDeleteTeacherDocument = async (documentId: number): Promise<{ document_id: number; deleted: boolean }> => {
  const res = await api.delete<ApiEnvelope<{ document_id: number; deleted: boolean }>>(`/documents/${documentId}`);
  return res.data;
};
