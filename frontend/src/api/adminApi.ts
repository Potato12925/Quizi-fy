import { api } from './client';

export type AdminCreatableRole = 'student' | 'teacher';

export interface CreateAdminUserPayload {
  username: string;
  password: string;
  full_name: string;
  role_code: AdminCreatableRole;
}

export interface CreatedAdminUser {
  user_id: number;
  username: string;
  full_name: string;
  is_active: boolean;
  must_change_password: boolean;
  roles: string[];
}

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

export interface AdminUserRecord {
  user_id: number;
  username: string;
  full_name: string;
  roles: string[];
  is_active: boolean;
  must_change_password: boolean;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
}

export interface AdminUserListParams {
  page?: number;
  limit?: number;
  role_code?: 'student' | 'teacher' | 'all';
  status?: 'active' | 'inactive' | 'all';
  search?: string;
}

export interface AdminUserListResult {
  items: AdminUserRecord[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  } | null;
}

export interface AdminClassOption {
  class_id: number;
  class_name: string;
}

export interface CreateAdminUserRequest {
  username: string;
  full_name: string;
  role_code: 'student' | 'teacher';
  class_id?: number;
}

export interface UpdateAdminUserRequest {
  username?: string;
  full_name?: string;
  is_active?: boolean;
}

const unwrapData = <T>(response: BackendSuccessEnvelope<T>): T => response.data;

// Database Schema Models matching PostgreSQL ERD
export interface DbClass {
  class_id: number;
  class_code: string;
  class_name: string;
  description?: string;
  owner_id: number; // references users.user_id of teacher
  status: string; // active, inactive
  created_at?: string;
}

export interface DbSubject {
  subject_id: number;
  subject_code: string;
  subject_name: string;
  description?: string;
  status: string; // active, inactive
  created_at?: string;
}

// UI Models matching High School terminology & DB fields
export interface AdminUser {
  id: string;
  name: string; // maps to full_name
  email: string;
  role: string; // student, teacher, admin
  dept?: string; // High school department, e.g., 'Tá»• ToÃ¡n - Tin', 'Tá»• Ngá»¯ VÄƒn'
  status: string; // Hoáº¡t Ä‘á»™ng, ÄÃ£ khÃ³a
  initial?: string;
  img?: string;
  code?: string; // Student code / username, e.g., HS1001
  classId?: string; // For students, references classes.class_id
  className?: string; // For students, e.g., Lá»›p 10A1
  subjects?: string[]; // For teachers, assigned subjects
}

export interface AdminClass {
  id: string;
  code: string; // class_code
  name: string; // class_name
  ownerId: string; // owner_id
  ownerName: string; // Teacher's full_name
  dept?: string; // Khá»‘i 10, Khá»‘i 11, Khá»‘i 12
  students: number; // count from class_students
  status: string; // Hoáº¡t Ä‘á»™ng, Táº¡m khÃ³a
}

export interface AdminSubjectRecord {
  subject_id: number;
  subject_code: string;
  subject_name: string;
  description: string | null;
  status: 'active' | 'inactive';
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
}

export interface AdminSubjectListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'all' | 'active' | 'inactive';
  sort_by?: 'created_at' | 'subject_name' | 'subject_code';
  sort_order?: 'asc' | 'desc';
}

export interface AdminSubjectListResult {
  items: AdminSubjectRecord[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  } | null;
}

export interface AdminSubject {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: string;
}

// Mappers
export const mapDbClassToAdminClass = (db: DbClass, studentCount: number = 0, ownerName: string = 'ChÆ°a phÃ¢n cÃ´ng'): AdminClass => ({
  id: db.class_id.toString(),
  code: db.class_code,
  name: db.class_name,
  ownerId: db.owner_id ? db.owner_id.toString() : '',
  ownerName: ownerName,
  dept: db.class_name.includes('10') ? 'Khá»‘i 10' : db.class_name.includes('11') ? 'Khá»‘i 11' : 'Khá»‘i 12',
  students: studentCount,
  status: db.status === 'active' ? 'Hoáº¡t Ä‘á»™ng' : 'Táº¡m khÃ³a',
});

const mapSubjectRecordToAdminSubject = (record: AdminSubjectRecord): AdminSubject => ({
  id: String(record.subject_id),
  name: record.subject_name,
  code: record.subject_code,
  description: record.description || undefined,
  status: record.status === 'active' ? 'Ho\u1ea1t \u0111\u1ed9ng' : 'T\u1ea1m kh\u00f3a',
});



/**
 * GET /admin/users
 */
export const getUsers = async (): Promise<{ students: AdminUser[], teachers: AdminUser[] }> => {
  try {
    return await api.get<{ students: AdminUser[], teachers: AdminUser[] }>('/admin/users');
  } catch (error) {
    console.warn('Backend endpoint /admin/users not ready. Using fallback mock data.', error);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          students: [
            { id: '201', name: 'Nguyá»…n Minh Anh', code: 'HS1001', classId: '1', className: 'Lá»›p 10A1', email: 'anh.student@quizify.ai', status: 'Hoáº¡t Ä‘á»™ng', role: 'student' },
            { id: '202', name: 'Tráº§n HoÃ ng Nam', code: 'HS1002', classId: '1', className: 'Lá»›p 10A1', email: 'nam.student@quizify.ai', status: 'Hoáº¡t Ä‘á»™ng', role: 'student' },
            { id: '203', name: 'LÃª Thu Tháº£o', code: 'HS1003', classId: '2', className: 'Lá»›p 11B2', email: 'thao.student@quizify.ai', status: 'ÄÃ£ khÃ³a', role: 'student' },
          ],
          teachers: [
            { id: '101', name: 'Tháº§y Nguyá»…n VÄƒn A', email: 'vanna.teacher@quizify.ai', subjects: ['ToÃ¡n há»c', 'Tin há»c'], status: 'Hoáº¡t Ä‘á»™ng', role: 'teacher', dept: 'Tá»• ToÃ¡n - Tin' },
            { id: '102', name: 'CÃ´ Tráº§n Thá»‹ B', email: 'thib.teacher@quizify.ai', subjects: ['Ngá»¯ VÄƒn'], status: 'Hoáº¡t Ä‘á»™ng', role: 'teacher', dept: 'Tá»• Ngá»¯ VÄƒn' },
            { id: '103', name: 'Tháº§y LÃª HoÃ ng C', email: 'hoangc.teacher@quizify.ai', subjects: ['Váº­t lÃ½'], status: 'ÄÃ£ khÃ³a', role: 'teacher', dept: 'Tá»• Váº­t lÃ½ - HÃ³a há»c' },
          ]
        });
      }, 500);
    });
  }
};

/**
 * GET /admin/classes
 */
export const getClasses = async (): Promise<AdminClass[]> => {
  try {
    const dbClasses = await api.get<DbClass[]>('/admin/classes');
    return dbClasses.map(c => mapDbClassToAdminClass(c, 40, 'Tháº§y Nguyá»…n VÄƒn A'));
  } catch (error) {
    console.warn('Backend endpoint /admin/classes not ready. Using fallback mock data.', error);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          mapDbClassToAdminClass({ class_id: 1, class_code: 'L10A1', class_name: 'Lá»›p 10A1', owner_id: 101, status: 'active' }, 45, 'Tháº§y Nguyá»…n VÄƒn A'),
          mapDbClassToAdminClass({ class_id: 2, class_code: 'L11B2', class_name: 'Lá»›p 11B2', owner_id: 102, status: 'active' }, 42, 'CÃ´ Tráº§n Thá»‹ B'),
          mapDbClassToAdminClass({ class_id: 3, class_code: 'L12C3', class_name: 'Lá»›p 12C3', owner_id: 103, status: 'inactive' }, 38, 'Tháº§y LÃª HoÃ ng C'),
        ]);
      }, 500);
    });
  }
};

/**
 * GET /subjects
 */
export const getAdminSubjects = async (
  params: AdminSubjectListParams = {},
): Promise<AdminSubjectListResult> => {
  const response = await api.get<BackendSuccessEnvelope<AdminSubjectRecord[]>>('/subjects', {
    params: {
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 50),
      status: params.status ?? 'all',
      sort_by: params.sort_by ?? 'created_at',
      sort_order: params.sort_order ?? 'desc',
      ...(params.search ? { search: params.search } : {}),
    },
  });

  return {
    items: response.data ?? [],
    meta: response.meta ?? null,
  };
};

export const getSubjects = async (): Promise<AdminSubject[]> => {
  const result = await getAdminSubjects({
    page: 1,
    limit: 9999,
    status: 'all',
    sort_by: 'created_at',
    sort_order: 'desc',
  });
  return result.items.map(mapSubjectRecordToAdminSubject);
};

export const createSubject = async (payload: {
  code: string;
  name: string;
  description?: string;
  status?: string;
}): Promise<AdminSubject> => {
  const created = await createAdminSubject({
    subject_code: payload.code,
    subject_name: payload.name,
    description: payload.description,
    status: payload.status === 'Tạm khóa' ? 'inactive' : 'active',
  });
  return mapSubjectRecordToAdminSubject(created);
};

export const updateSubject = async (
  id: string,
  payload: Partial<AdminSubject>,
): Promise<AdminSubject> => {
  const updated = await updateAdminSubject(Number(id), {
    subject_code: payload.code,
    subject_name: payload.name,
    description: payload.description,
    status: payload.status === 'Tạm khóa' ? 'inactive' : payload.status === 'Hoạt động' ? 'active' : undefined,
  });
  return mapSubjectRecordToAdminSubject(updated);
};

export const deleteSubject = async (id: string): Promise<void> => {
  await deleteAdminSubject(Number(id));
};
/**
 * POST /users
 * Admin creates a student or teacher account
 */
export const createUserByAdmin = async (
  payload: CreateAdminUserPayload
): Promise<CreatedAdminUser> => {
  const response = await api.post<BackendSuccessEnvelope<CreatedAdminUser>>('/user', payload);
  return unwrapData(response);
};

export const listAdminUsers = async (
  params: AdminUserListParams = {}
): Promise<AdminUserListResult> => {
  const response = await api.get<BackendSuccessEnvelope<AdminUserRecord[]>>('/user', {
    params: {
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 100),
      role_code: params.role_code ?? 'all',
      status: params.status ?? 'all',
      ...(params.search ? { search: params.search } : {}),
    },
  });

  return {
    items: response.data,
    meta: response.meta ?? null,
  };
};

export const createAdminUser = async (
  payload: CreateAdminUserRequest
): Promise<AdminUserRecord> => {
  const response = await api.post<BackendSuccessEnvelope<AdminUserRecord>>('/user', payload);
  return unwrapData(response);
};

export const updateAdminUser = async (
  userId: number,
  payload: UpdateAdminUserRequest
): Promise<AdminUserRecord> => {
  const response = await api.put<BackendSuccessEnvelope<AdminUserRecord>>(`/user/${userId}`, payload);
  return unwrapData(response);
};

export const updateAdminUserStatus = async (
  userId: number,
  isActive: boolean
): Promise<AdminUserRecord> => {
  const response = await api.patch<BackendSuccessEnvelope<AdminUserRecord>>(`/user/${userId}/status`, {
    is_active: isActive,
  });
  return unwrapData(response);
};

export const softDeleteAdminUser = async (userId: number): Promise<{ user_id: number; deleted: boolean; locked?: boolean }> => {
  const response = await api.delete<BackendSuccessEnvelope<{ user_id: number; deleted: boolean; locked?: boolean }>>(`/user/${userId}`);
  return response.data;
};

export const listAdminClasses = async (): Promise<AdminClassOption[]> => {
  try {
    const response = await api.get<BackendSuccessEnvelope<AdminClassOption[]>>('/classes', {
      params: {
        page: '1',
        limit: '100',
      },
    });
    return response.data;
  } catch (error) {
    console.warn('Unable to load classes for admin user form. Fallback to empty list.', error);
    return [];
  }
};

/**
 * POST /admin/users
 */
export const createUser = async (payload: Omit<AdminUser, 'id'>): Promise<AdminUser> => {
  try {
    return await api.post<AdminUser>('/admin/users', payload);
  } catch (error) {
    console.warn('Backend endpoint /admin/users (POST) not ready. Using fallback mock data.', error);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: Date.now().toString(),
          ...payload,
          status: payload.status || 'Hoáº¡t Ä‘á»™ng',
          initial: payload.name.split(' ').slice(-2).map(item => item[0]).join('')
        });
      }, 500);
    });
  }
};

/**
 * PUT /admin/users/:id
 */
export const updateUser = async (id: string, payload: Partial<AdminUser>): Promise<AdminUser> => {
  try {
    return await api.put<AdminUser>(`/admin/users/${id}`, payload);
  } catch (error) {
    console.warn(`Backend endpoint /admin/users/${id} (PUT) not ready. Using fallback mock data.`, error);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id,
          name: payload.name || 'NgÆ°á»i dÃ¹ng Mock',
          email: payload.email || 'mock@quizify.ai',
          role: payload.role || 'student',
          status: payload.status || 'Hoáº¡t Ä‘á»™ng',
          ...payload
        });
      }, 500);
    });
  }
};

/**
 * DELETE /admin/users/:id
 */
export const deleteUser = async (id: string): Promise<void> => {
  try {
    await api.delete<void>(`/admin/users/${id}`);
  } catch (error) {
    console.warn(`Backend endpoint /admin/users/${id} (DELETE) not ready. Using fallback mock data.`, error);
    return new Promise((resolve) => {
      setTimeout(resolve, 500);
    });
  }
};

/**
 * POST /admin/classes
 */
export const createClass = async (payload: { classCode: string; className: string; description?: string; owner: string }): Promise<AdminClass> => {
  try {
    const dbClass = await api.post<DbClass>('/admin/classes', {
      class_code: payload.classCode,
      class_name: payload.className,
      description: payload.description,
      owner_id: parseInt(payload.owner) || 101,
      status: 'active'
    });
    return mapDbClassToAdminClass(dbClass, 0, 'Tháº§y Nguyá»…n VÄƒn A');
  } catch (error) {
    console.warn('Backend endpoint /admin/classes (POST) not ready. Using fallback mock data.', error);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: Date.now().toString(),
          code: payload.classCode,
          name: payload.className,
          ownerId: payload.owner,
          ownerName: 'Tháº§y Nguyá»…n VÄƒn A',
          students: 0,
          status: 'Hoáº¡t Ä‘á»™ng',
        });
      }, 500);
    });
  }
};

/**
 * PUT /admin/classes/:id
 */
export const updateClass = async (id: string, payload: Partial<AdminClass>): Promise<AdminClass> => {
  try {
    const dbClass = await api.put<DbClass>(`/admin/classes/${id}`, {
      class_code: payload.code,
      class_name: payload.name,
      owner_id: payload.ownerId ? parseInt(payload.ownerId) : undefined,
      status: payload.status === 'Hoáº¡t Ä‘á»™ng' ? 'active' : 'inactive'
    });
    return mapDbClassToAdminClass(dbClass, payload.students || 0, payload.ownerName || 'ChÆ°a phÃ¢n cÃ´ng');
  } catch (error) {
    console.warn(`Backend endpoint /admin/classes/${id} (PUT) not ready. Using fallback mock data.`, error);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id,
          code: payload.code || 'MOCK_CLASS',
          name: payload.name || 'Lá»›p há»c Mock',
          ownerId: payload.ownerId || '101',
          ownerName: payload.ownerName || 'Tháº§y Nguyá»…n VÄƒn A',
          students: payload.students || 0,
          status: payload.status || 'Hoáº¡t Ä‘á»™ng',
        });
      }, 500);
    });
  }
};

/**
 * DELETE /admin/classes/:id
 */
export const deleteClass = async (id: string): Promise<void> => {
  try {
    await api.delete<void>(`/admin/classes/${id}`);
  } catch (error) {
    console.warn(`Backend endpoint /admin/classes/${id} (DELETE) not ready. Using fallback mock data.`, error);
    return new Promise((resolve) => {
      setTimeout(resolve, 500);
    });
  }
};

/**
 * POST /subjects
 */
export const createAdminSubject = async (payload: {
  subject_code: string;
  subject_name: string;
  description?: string;
  status?: 'active' | 'inactive';
}): Promise<AdminSubjectRecord> => {
  const response = await api.post<BackendSuccessEnvelope<AdminSubjectRecord>>('/subjects', payload);
  return unwrapData(response);
};

/**
 * PUT /subjects/:id
 */
export const updateAdminSubject = async (
  subjectId: number,
  payload: {
    subject_code?: string;
    subject_name?: string;
    description?: string;
    status?: 'active' | 'inactive';
  },
): Promise<AdminSubjectRecord> => {
  const response = await api.put<BackendSuccessEnvelope<AdminSubjectRecord>>(`/subjects/${subjectId}`, payload);
  return unwrapData(response);
};

/**
 * DELETE /subjects/:id
 */
export const deleteAdminSubject = async (subjectId: number): Promise<void> => {
  await api.delete<BackendSuccessEnvelope<{ subject_id: number; deleted: boolean }>>(`/subjects/${subjectId}`);
};
/**
 * POST /admin/classes/:classId/subjects
 */
export const assignSubjectToClass = async (classId: string, subjectCode: string, teacherName: string): Promise<void> => {
  try {
    await api.post<void>(`/admin/classes/${classId}/subjects`, { subject_code: subjectCode, teacher_name: teacherName });
  } catch (error) {
    console.warn(`Backend endpoint /admin/classes/${classId}/subjects not ready. Using fallback mock data.`, error);
    return new Promise((resolve) => {
      setTimeout(resolve, 500);
    });
  }
};

/**
 * POST /admin/classes/:classId/students
 */
export const assignStudentToClass = async (classId: string, studentId: string): Promise<void> => {
  try {
    await api.post<void>(`/admin/classes/${classId}/students`, { student_id: studentId });
  } catch (error) {
    console.warn(`Backend endpoint /admin/classes/${classId}/students not ready. Using fallback mock data.`, error);
    return new Promise((resolve) => {
      setTimeout(resolve, 500);
    });
  }
};

/**
 * DELETE /admin/classes/:classId/students/:studentId
 */
export const removeStudentFromClass = async (classId: string, studentId: string): Promise<void> => {
  try {
    await api.delete<void>(`/admin/classes/${classId}/students/${studentId}`);
  } catch (error) {
    console.warn(`Backend endpoint /admin/classes/${classId}/students/${studentId} (DELETE) not ready. Using fallback mock data.`, error);
    return new Promise((resolve) => {
      setTimeout(resolve, 500);
    });
  }
};

/**
 * DELETE /admin/classes/:classId/subjects/:subjectCode
 */
export const removeSubjectFromClass = async (classId: string, subjectCode: string): Promise<void> => {
  try {
    await api.delete<void>(`/admin/classes/${classId}/subjects/${subjectCode}`);
  } catch (error) {
    console.warn(`Backend endpoint /admin/classes/${classId}/subjects/${subjectCode} (DELETE) not ready. Using fallback mock data.`, error);
    return new Promise((resolve) => {
      setTimeout(resolve, 500);
    });
  }
};




