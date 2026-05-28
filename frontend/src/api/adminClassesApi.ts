import { api } from './client';

interface BackendSuccessEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  } | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface ClassListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  sort_by?: 'created_at' | 'class_name';
  sort_order?: 'asc' | 'desc';
}

export interface AdminClassRecord {
  class_id: number;
  class_code: string;
  class_name: string;
  description: string | null;
  teacher_id: number;
  teacher_name: string;
  status: 'active' | 'inactive';
  created_at: string | null;
  updated_at: string | null;
  student_count: number;
  teacher_count: number;
  subject_count: number;
}

export interface AdminClassSubjectRecord {
  class_subject_id: number;
  class_id: number;
  subject_id: number;
  subject_code: string | null;
  subject_name: string | null;
  assigned_teacher_id: number | null;
  assigned_teacher_name: string | null;
  status: 'active' | 'inactive';
  created_at: string | null;
  updated_at: string | null;
}

export interface AdminClassStudentRecord {
  class_student_id: number;
  class_id: number;
  student_id: number;
  username: string | null;
  full_name: string | null;
  joined_at: string | null;
}

export interface AdminClassTeacherOption {
  user_id: number;
  username: string;
  full_name: string;
  is_active: boolean;
}

export interface AdminClassStudentOption {
  user_id: number;
  username: string;
  full_name: string;
  is_active: boolean;
}

export interface AdminSubjectOption {
  subject_id: number;
  subject_code: string;
  subject_name: string;
  description: string | null;
  status: 'active' | 'inactive';
}

const toParams = (params: Record<string, string | undefined>) => {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== '');
  return Object.fromEntries(entries) as Record<string, string>;
};

export const getAdminClasses = async (
  params: ClassListParams = {},
): Promise<{ items: AdminClassRecord[]; meta: PaginationMeta | null }> => {
  const response = await api.get<BackendSuccessEnvelope<AdminClassRecord[]>>('/classes', {
    params: toParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 10),
      search: params.search?.trim() || undefined,
      status: params.status ?? 'all',
      sort_by: params.sort_by ?? 'created_at',
      sort_order: params.sort_order ?? 'desc',
    }),
  });
  return {
    items: response.data || [],
    meta: response.meta ?? null,
  };
};

export const getAdminClassDetail = async (classId: number): Promise<AdminClassRecord> => {
  const response = await api.get<BackendSuccessEnvelope<AdminClassRecord>>(`/classes/${classId}`);
  return response.data;
};

export const createAdminClass = async (payload: {
  class_code: string;
  class_name: string;
  description?: string;
  teacher_id: number;
}): Promise<AdminClassRecord> => {
  const response = await api.post<BackendSuccessEnvelope<AdminClassRecord>>('/classes', payload);
  return response.data;
};

export const updateAdminClass = async (
  classId: number,
  payload: {
    class_code?: string;
    class_name?: string;
    description?: string;
    teacher_id?: number;
    status?: 'active' | 'inactive';
  },
): Promise<AdminClassRecord> => {
  const response = await api.put<BackendSuccessEnvelope<AdminClassRecord>>(`/classes/${classId}`, payload);
  return response.data;
};

export const deleteAdminClass = async (classId: number): Promise<{ class_id: number; deleted: boolean; status?: string }> => {
  const response = await api.delete<BackendSuccessEnvelope<{ class_id: number; deleted: boolean; status?: string }>>(
    `/classes/${classId}`,
  );
  return response.data;
};

export const getAdminClassSubjects = async (classId: number): Promise<AdminClassSubjectRecord[]> => {
  const response = await api.get<BackendSuccessEnvelope<AdminClassSubjectRecord[]>>(`/classes/${classId}/subjects`);
  return response.data || [];
};

export const assignSubjectToAdminClass = async (
  classId: number,
  payload: { subject_id: number; assigned_teacher_id: number },
): Promise<AdminClassSubjectRecord> => {
  const response = await api.post<BackendSuccessEnvelope<AdminClassSubjectRecord>>(
    `/classes/${classId}/subjects`,
    payload,
  );
  return response.data;
};

export const removeSubjectFromAdminClass = async (classId: number, subjectId: number): Promise<void> => {
  await api.delete<BackendSuccessEnvelope<{ deleted: boolean }>>(`/classes/${classId}/subjects/${subjectId}`);
};

export const getAdminClassStudents = async (classId: number): Promise<AdminClassStudentRecord[]> => {
  const response = await api.get<BackendSuccessEnvelope<AdminClassStudentRecord[]>>(`/classes/${classId}/students`);
  return response.data || [];
};

export const assignStudentToAdminClass = async (
  classId: number,
  payload: { student_id: number },
): Promise<AdminClassStudentRecord> => {
  const response = await api.post<BackendSuccessEnvelope<AdminClassStudentRecord>>(
    `/classes/${classId}/students`,
    payload,
  );
  return response.data;
};

export const removeStudentFromAdminClass = async (classId: number, studentId: number): Promise<void> => {
  await api.delete<BackendSuccessEnvelope<{ deleted: boolean }>>(`/classes/${classId}/students/${studentId}`);
};

export const getAdminTeacherOptions = async (): Promise<AdminClassTeacherOption[]> => {
  const response = await api.get<BackendSuccessEnvelope<AdminClassTeacherOption[]>>('/user', {
    params: {
      page: '1',
      limit: '100',
      role_code: 'teacher',
      status: 'all',
    },
  });
  return response.data || [];
};

export const getAdminStudentOptions = async (): Promise<AdminClassStudentOption[]> => {
  const response = await api.get<BackendSuccessEnvelope<AdminClassStudentOption[]>>('/user', {
    params: {
      page: '1',
      limit: '100',
      role_code: 'student',
      status: 'all',
    },
  });
  return response.data || [];
};

export const getAdminSubjectOptions = async (): Promise<AdminSubjectOption[]> => {
  const response = await api.get<BackendSuccessEnvelope<AdminSubjectOption[]>>('/subjects', {
    params: {
      page: '1',
      limit: '100',
    },
  });
  return response.data || [];
};
