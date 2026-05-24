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

// Types derived from existing UI mock data
// Database Schema Models
export interface DbClass {
  class_id: number;
  class_code: string;
  class_name: string;
  description?: string;
  owner_id: number;
  status: string;
  created_at: string;
}

export interface DbSubject {
  subject_id: number;
  subject_code: string;
  subject_name: string;
  description?: string;
  status: string;
  created_at: string;
}

// UI Models (keeping compatible with existing UI)
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  dept?: string;
  status: string;
  initial?: string;
  img?: string;
  code?: string;
  class?: string;
  subjects?: string[];
}

export interface AdminClass {
  id: string;
  code: string;
  name: string;
  dept?: string;
  major?: string;
  students: number;
  status: string;
}

export interface AdminSubject {
  id: string;
  name: string;
  code: string;
  credits: number;
  teacher: string;
  classes: number;
}

// Mappers
export const mapDbClassToAdminClass = (db: DbClass, studentCount: number = 0): AdminClass => ({
  id: db.class_id.toString(),
  code: db.class_code,
  name: db.class_name,
  dept: 'Khoa CNTT 1', // Placeholder
  students: studentCount,
  status: db.status === 'active' ? 'Hoạt động' : 'Bị khóa',
});

export const mapDbSubjectToAdminSubject = (db: DbSubject, teacherName: string = 'N/A', classesCount: number = 0): AdminSubject => ({
  id: db.subject_id.toString(),
  name: db.subject_name,
  code: db.subject_code,
  credits: 3, // Placeholder or from DB if available
  teacher: teacherName,
  classes: classesCount,
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
    // TODO: Replace fallback mock when backend endpoint is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          totalUsers: 3650,
          teachersCount: 150,
          studentsCount: 3500,
          approvedQuestions: '45K+',
          activityGrowth: '+18%',
          users: [
            { id: '1', name: 'Nguyễn Văn Hùng', email: 'hung.nv@ptit.edu.vn', role: 'GIẢNG VIÊN', dept: 'Khoa CNTT 1', status: 'Hoạt động', initial: 'NH' },
            { id: '2', name: 'Trần Thị Mai', email: 'mai.tt@student.ptit.edu.vn', role: 'SINH VIÊN', dept: 'D21CQCN04-B', status: 'Hoạt động', img: 'https://lh3.googleusercontent.com/aida-public/...' },
            { id: '3', name: 'Lê Anh Tuấn', email: 'tuan.la@student.ptit.edu.vn', role: 'SINH VIÊN', dept: 'D20CQAT01-N', status: 'Ngoại tuyến', initial: 'LA' },
          ],
          classes: [
            mapDbClassToAdminClass({ class_id: 1, class_code: 'D21CQCN04-B', class_name: 'D21CQCN04-B', owner_id: 1, status: 'active', created_at: '' }, 85),
            mapDbClassToAdminClass({ class_id: 2, class_code: 'D20CQAT01-N', class_name: 'D20CQAT01-N', owner_id: 1, status: 'active', created_at: '' }, 62),
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
    // Backend would return { students: DbUser[], teachers: DbUser[] }
    // We would map them using authApi's mapper or local ones
    return await api.get<{ students: AdminUser[], teachers: AdminUser[] }>('/admin/users');
  } catch (error) {
    console.warn('Backend endpoint /admin/users not ready. Using fallback mock data.', error);
    // TODO: Replace fallback mock when backend endpoint is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          students: [
            { id: '1', name: 'Nguyễn Minh Anh', code: 'B21DCCN001', class: 'D21CQCN01-B', status: 'Hoạt động', email: '', role: 'student' },
            { id: '2', name: 'Trần Hoàng Nam', code: 'B21DCCN002', class: 'D21CQCN01-B', status: 'Hoạt động', email: '', role: 'student' },
            { id: '3', name: 'Lê Thu Thảo', code: 'B21DCCN003', class: 'D21CQCN02-B', status: 'Đã khóa', email: '', role: 'student' },
          ],
          teachers: [
            { id: '1', name: 'TS. Nguyễn Văn A', email: 'vanna@ptit.edu.vn', subjects: ['Mạng máy tính', 'An toàn hệ thống'], status: 'Hoạt động', role: 'teacher' },
            { id: '2', name: 'ThS. Trần Thị B', email: 'thib@ptit.edu.vn', subjects: ['Cấu trúc dữ liệu'], status: 'Hoạt động', role: 'teacher' },
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
    return dbClasses.map(c => mapDbClassToAdminClass(c, 40));
  } catch (error) {
    console.warn('Backend endpoint /admin/classes not ready. Using fallback mock data.', error);
    // TODO: Replace fallback mock when backend endpoint is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          mapDbClassToAdminClass({ class_id: 1, class_code: 'CN01', class_name: 'D21CQCN01-B', owner_id: 1, status: 'active', created_at: '' }, 45),
          mapDbClassToAdminClass({ class_id: 2, class_code: 'CN02', class_name: 'D21CQCN02-B', owner_id: 1, status: 'active', created_at: '' }, 42),
          mapDbClassToAdminClass({ class_id: 3, class_code: 'CN03', class_name: 'D21CQCN03-B', owner_id: 1, status: 'inactive', created_at: '' }, 38),
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
    return dbSubjects.map(s => mapDbSubjectToAdminSubject(s, 'GV Mock', 2));
  } catch (error) {
    console.warn('Backend endpoint /admin/subjects not ready. Using fallback mock data.', error);
    // TODO: Replace fallback mock when backend endpoint is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          mapDbSubjectToAdminSubject({ subject_id: 1, subject_code: 'INT1339', subject_name: 'Mạng máy tính', status: 'active', created_at: '' }, 'TS. Nguyễn Văn A', 3),
          mapDbSubjectToAdminSubject({ subject_id: 2, subject_code: 'INT1306', subject_name: 'Cấu trúc dữ liệu và Giải thuật', status: 'active', created_at: '' }, 'ThS. Trần Thị B', 5),
          mapDbSubjectToAdminSubject({ subject_id: 3, subject_code: 'INT1313', subject_name: 'Hệ điều hành', status: 'active', created_at: '' }, 'Chưa gán', 2),
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
