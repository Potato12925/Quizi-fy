import { api } from './client';

export interface TeacherTopicItem {
  topic_id: number;
  topic_name: string;
}

export interface TeacherDocumentTopicItem {
  document_id: number;
  title: string;
  topics: TeacherTopicItem[];
}

export interface TeacherSubjectDocumentTopicItem {
  subject_id: number;
  subject_name: string;
  documents: TeacherDocumentTopicItem[];
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown> | null;
}

export interface AddDocumentTopicRequest {
  topic_name: string;
}

export interface UpdateTopicNameRequest {
  topic_name: string;
}

export const getTeacherSubjectsDocumentsTopics = async (): Promise<TeacherSubjectDocumentTopicItem[]> => {
  const response = await api.get<ApiEnvelope<TeacherSubjectDocumentTopicItem[]>>('/teacher/subjects/documents-topics');
  return response.data || [];
};

export const addTopicToDocument = async (
  documentId: number,
  payload: AddDocumentTopicRequest,
): Promise<{ document_id: number; topic: TeacherTopicItem }> => {
  const response = await api.post<ApiEnvelope<{ document_id: number; topic: TeacherTopicItem }>>(
    `/teacher/documents/${documentId}/topics`,
    payload,
  );
  return response.data;
};

export const updateTeacherTopicName = async (
  topicId: number,
  payload: UpdateTopicNameRequest,
): Promise<TeacherTopicItem> => {
  const response = await api.put<ApiEnvelope<TeacherTopicItem>>(`/teacher/topics/${topicId}`, payload);
  return response.data;
};

export const removeTopicFromDocument = async (documentId: number, topicId: number): Promise<void> => {
  await api.delete(`/teacher/documents/${documentId}/topics/${topicId}`);
};
