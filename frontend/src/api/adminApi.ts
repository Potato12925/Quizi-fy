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
  dept?: string; // High school department, e.g., 'Tổ Toán - Tin', 'Tổ Ngữ Văn'
  status: string; // Hoạt động, Đã khóa
  initial?: string;
  img?: string;
  code?: string; // Student code / username, e.g., HS1001
  classId?: string; // For students, references classes.class_id
  className?: string; // For students, e.g., Lớp 10A1
  subjects?: string[]; // For teachers, assigned subjects
}

export interface AdminClass {
  id: string;
  code: string; // class_code
  name: string; // class_name
  ownerId: string; // owner_id
  ownerName: string; // Teacher's full_name
  dept?: string; // Khối 10, Khối 11, Khối 12
  students: number; // count from class_students
  status: string; // Hoạt động, Tạm khóa
}

export interface AdminSubject {
  id: string;
  name: string; // subject_name
  code: string; // subject_code
  description?: string;
  teacher: string; // Assigned teacher's full_name
  teacherId?: string; // Assigned teacher's user_id
  classes: number; // Count of classes studying this subject
  status: string; // Hoạt động, Tạm khóa
}

// Mappers
export const mapDbClassToAdminClass = (db: DbClass, studentCount: number = 0, ownerName: string = 'Chưa phân công'): AdminClass => ({
  id: db.class_id.toString(),
  code: db.class_code,
  name: db.class_name,
  ownerId: db.owner_id ? db.owner_id.toString() : '',
  ownerName: ownerName,
  dept: db.class_name.includes('10') ? 'Khối 10' : db.class_name.includes('11') ? 'Khối 11' : 'Khối 12',
  students: studentCount,
  status: db.status === 'active' ? 'Hoạt động' : 'Tạm khóa',
});

export const mapDbSubjectToAdminSubject = (db: DbSubject, teacherName: string = 'Chưa gán', classesCount: number = 0, teacherId?: string): AdminSubject => ({
  id: db.subject_id.toString(),
  name: db.subject_name,
  code: db.subject_code,
  description: db.description,
  teacher: teacherName,
  teacherId: teacherId,
  classes: classesCount,
  status: db.status === 'active' ? 'Hoạt động' : 'Tạm khóa',
});

export interface DashboardStats {
  totalUsers: number;
  teachersCount: number;
  studentsCount: number;
  approvedQuestions: string;
  activityGrowth: string;
  users: AdminUser[];
  classes: AdminClass[];
}

/**
 * GET /admin/dashboard/stats
 */
export const getAdminDashboardStats = async (): Promise<DashboardStats> => {
  try {
    return await api.get<DashboardStats>('/admin/dashboard/stats');
  } catch (error) {
    console.warn('Backend endpoint /admin/dashboard/stats not ready. Using fallback mock data.', error);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          totalUsers: 1250,
          teachersCount: 50,
          studentsCount: 1200,
          approvedQuestions: '12K+',
          activityGrowth: '+12%',
          users: [
            { id: '101', name: 'Thầy Nguyễn Văn A', email: 'vanna.teacher@quizify.ai', role: 'teacher', dept: 'Tổ Toán - Tin', status: 'Hoạt động', initial: 'VA' },
            { id: '102', name: 'Cô Trần Thị B', email: 'thib.teacher@quizify.ai', role: 'teacher', dept: 'Tổ Ngữ Văn', status: 'Hoạt động', initial: 'TB' },
            { id: '201', name: 'Nguyễn Minh Anh', email: 'anh.student@quizify.ai', role: 'student', className: 'Lớp 10A1', status: 'Hoạt động', initial: 'MA', code: 'HS1001' },
          ],
          classes: [
            mapDbClassToAdminClass({ class_id: 1, class_code: 'L10A1', class_name: 'Lớp 10A1', owner_id: 101, status: 'active' }, 45, 'Thầy Nguyễn Văn A'),
            mapDbClassToAdminClass({ class_id: 2, class_code: 'L11B2', class_name: 'Lớp 11B2', owner_id: 102, status: 'active' }, 42, 'Cô Trần Thị B'),
          ]
        });
      }, 500);
    });
  }
};

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
            { id: '201', name: 'Nguyễn Minh Anh', code: 'HS1001', classId: '1', className: 'Lớp 10A1', email: 'anh.student@quizify.ai', status: 'Hoạt động', role: 'student' },
            { id: '202', name: 'Trần Hoàng Nam', code: 'HS1002', classId: '1', className: 'Lớp 10A1', email: 'nam.student@quizify.ai', status: 'Hoạt động', role: 'student' },
            { id: '203', name: 'Lê Thu Thảo', code: 'HS1003', classId: '2', className: 'Lớp 11B2', email: 'thao.student@quizify.ai', status: 'Đã khóa', role: 'student' },
          ],
          teachers: [
            { id: '101', name: 'Thầy Nguyễn Văn A', email: 'vanna.teacher@quizify.ai', subjects: ['Toán học', 'Tin học'], status: 'Hoạt động', role: 'teacher', dept: 'Tổ Toán - Tin' },
            { id: '102', name: 'Cô Trần Thị B', email: 'thib.teacher@quizify.ai', subjects: ['Ngữ Văn'], status: 'Hoạt động', role: 'teacher', dept: 'Tổ Ngữ Văn' },
            { id: '103', name: 'Thầy Lê Hoàng C', email: 'hoangc.teacher@quizify.ai', subjects: ['Vật lý'], status: 'Đã khóa', role: 'teacher', dept: 'Tổ Vật lý - Hóa học' },
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
    return dbClasses.map(c => mapDbClassToAdminClass(c, 40, 'Thầy Nguyễn Văn A'));
  } catch (error) {
    console.warn('Backend endpoint /admin/classes not ready. Using fallback mock data.', error);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          mapDbClassToAdminClass({ class_id: 1, class_code: 'L10A1', class_name: 'Lớp 10A1', owner_id: 101, status: 'active' }, 45, 'Thầy Nguyễn Văn A'),
          mapDbClassToAdminClass({ class_id: 2, class_code: 'L11B2', class_name: 'Lớp 11B2', owner_id: 102, status: 'active' }, 42, 'Cô Trần Thị B'),
          mapDbClassToAdminClass({ class_id: 3, class_code: 'L12C3', class_name: 'Lớp 12C3', owner_id: 103, status: 'inactive' }, 38, 'Thầy Lê Hoàng C'),
        ]);
      }, 500);
    });
  }
};

/**
 * GET /admin/subjects
 */
export const getSubjects = async (): Promise<AdminSubject[]> => {
  try {
    const dbSubjects = await api.get<DbSubject[]>('/admin/subjects');
    return dbSubjects.map(s => mapDbSubjectToAdminSubject(s, 'GV phụ trách', 2));
  } catch (error) {
    console.warn('Backend endpoint /admin/subjects not ready. Using fallback mock data.', error);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          mapDbSubjectToAdminSubject({ subject_id: 1, subject_code: 'TOAN10', subject_name: 'Toán học 10', description: 'Môn Toán học khối 10, bám sát chương trình THPT mới của Bộ GD&ĐT.', status: 'active' }, 'Thầy Nguyễn Văn A', 3, '101'),
          mapDbSubjectToAdminSubject({ subject_id: 2, subject_code: 'VAN10', subject_name: 'Ngữ Văn 10', description: 'Môn Ngữ Văn khối 10, biên soạn chuyên sâu giúp học sinh ôn tập chuẩn quốc gia.', status: 'active' }, 'Cô Trần Thị B', 2, '102'),
          mapDbSubjectToAdminSubject({ subject_id: 3, subject_code: 'LY10', subject_name: 'Vật lý 10', description: 'Môn Vật lý khối 10 định hướng ban tự nhiên, bồi dưỡng kiến thức thi tốt nghiệp.', status: 'active' }, 'Chưa gán', 0),
        ]);
      }, 500);
    });
  }
};

/**
 * POST /users
 * Admin creates a student or teacher account
 */
export const createUserByAdmin = async (
  payload: CreateAdminUserPayload
): Promise<CreatedAdminUser> => {
  return await api.post<CreatedAdminUser>('/user', payload);
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
          status: payload.status || 'Hoạt động',
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
          name: payload.name || 'Người dùng Mock',
          email: payload.email || 'mock@quizify.ai',
          role: payload.role || 'student',
          status: payload.status || 'Hoạt động',
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
    return mapDbClassToAdminClass(dbClass, 0, 'Thầy Nguyễn Văn A');
  } catch (error) {
    console.warn('Backend endpoint /admin/classes (POST) not ready. Using fallback mock data.', error);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: Date.now().toString(),
          code: payload.classCode,
          name: payload.className,
          ownerId: payload.owner,
          ownerName: 'Thầy Nguyễn Văn A',
          students: 0,
          status: 'Hoạt động',
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
      status: payload.status === 'Hoạt động' ? 'active' : 'inactive'
    });
    return mapDbClassToAdminClass(dbClass, payload.students || 0, payload.ownerName || 'Chưa phân công');
  } catch (error) {
    console.warn(`Backend endpoint /admin/classes/${id} (PUT) not ready. Using fallback mock data.`, error);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id,
          code: payload.code || 'MOCK_CLASS',
          name: payload.name || 'Lớp học Mock',
          ownerId: payload.ownerId || '101',
          ownerName: payload.ownerName || 'Thầy Nguyễn Văn A',
          students: payload.students || 0,
          status: payload.status || 'Hoạt động',
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
 * POST /admin/subjects
 */
export const createSubject = async (payload: { code: string; name: string; description?: string; status?: string }): Promise<AdminSubject> => {
  try {
    const dbSubject = await api.post<DbSubject>('/admin/subjects', {
      subject_code: payload.code,
      subject_name: payload.name,
      description: payload.description,
      status: payload.status === 'Tạm khóa' ? 'inactive' : 'active'
    });
    return mapDbSubjectToAdminSubject(dbSubject, 'Chưa gán', 0);
  } catch (error) {
    console.warn('Backend endpoint /admin/subjects (POST) not ready. Using fallback mock data.', error);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: Date.now().toString(),
          name: payload.name,
          code: payload.code,
          description: payload.description,
          teacher: 'Chưa gán',
          classes: 0,
          status: payload.status || 'Hoạt động'
        });
      }, 500);
    });
  }
};

/**
 * PUT /admin/subjects/:id
 */
export const updateSubject = async (id: string, payload: Partial<AdminSubject>): Promise<AdminSubject> => {
  try {
    const dbSubject = await api.put<DbSubject>(`/admin/subjects/${id}`, {
      subject_code: payload.code,
      subject_name: payload.name,
      description: payload.description,
      status: payload.status === 'Tạm khóa' ? 'inactive' : 'active'
    });
    return mapDbSubjectToAdminSubject(dbSubject, payload.teacher || 'Chưa gán', payload.classes || 0);
  } catch (error) {
    console.warn(`Backend endpoint /admin/subjects/${id} (PUT) not ready. Using fallback mock data.`, error);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id,
          name: payload.name || 'Môn học Mock',
          code: payload.code || 'MOCK_SUB',
          description: payload.description,
          teacher: payload.teacher || 'Chưa gán',
          classes: payload.classes || 0,
          status: payload.status || 'Hoạt động'
        });
      }, 500);
    });
  }
};

/**
 * DELETE /admin/subjects/:id
 */
export const deleteSubject = async (id: string): Promise<void> => {
  try {
    await api.delete<void>(`/admin/subjects/${id}`);
  } catch (error) {
    console.warn(`Backend endpoint /admin/subjects/${id} (DELETE) not ready. Using fallback mock data.`, error);
    return new Promise((resolve) => {
      setTimeout(resolve, 500);
    });
  }
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
