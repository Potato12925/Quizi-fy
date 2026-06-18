import { api } from './client';

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown> | null;
}

export type TeacherQuestionImageItem = {
  image_id: number;
  file_url: string;
  file_name?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
  uploaded_by?: number | null;
  created_at?: string | null;
};

export const uploadTeacherQuestionImage = async (
  file: File,
): Promise<TeacherQuestionImageItem> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post<ApiEnvelope<TeacherQuestionImageItem>>(
    '/teacher/question-images/upload',
    formData,
  );
  return res.data;
};

export const deleteTeacherQuestionImage = async (imageId: number): Promise<void> => {
  await api.delete<ApiEnvelope<{ image_id: number; deleted: boolean }>>(
    `/teacher/question-images/${imageId}`,
  );
};
