import { api } from './client';

// Types derived from existing UI mock data
export interface AdminUser {
  name: string;
  email: string;
  role: string;
  dept?: string;
  status: string;
  initial?: string;
  img?: string;
  code?: string; // from AdminUsers student
  class?: string; // from AdminUsers student
  subjects?: string[]; // from AdminUsers teacher
  id?: string;
}

export interface AdminClass {
  id: string;
  dept?: string; // from Dashboard
  major?: string; // from AdminClasses
  students: number;
  name?: string; // from AdminClasses
  status?: string; // from AdminClasses
}

export interface AdminSubject {
  id: string;
  name: string;
  code: string;
  credits: number;
  teacher: string;
  classes: number;
}

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
            { name: 'Nguyễn Văn Hùng', email: 'hung.nv@ptit.edu.vn', role: 'GIẢNG VIÊN', dept: 'Khoa CNTT 1', status: 'Hoạt động', initial: 'NH' },
            { name: 'Trần Thị Mai', email: 'mai.tt@student.ptit.edu.vn', role: 'SINH VIÊN', dept: 'D21CQCN04-B', status: 'Hoạt động', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBuQl1RZD-kRNkSRTfA1SEFEjdKoYR9214tXXINxvQ9b3Tr5v8IwFvh-8vC1Ig_r65LtOEaDuCRgy4-GW50cYEou0DVtZZcKleHZZSfwiLMP2bjTObt4AscZiomzWzCK1TG5VUm2IYnTmEVKp-FkdHizyYpf-7E_yenOOfMj-X4ST9fc4XZQMbX0htIy63cNYJnAspYPyYE01O71_QR3xFYoPO_cOzMACc5tl0odiUZEdjjMw0A05x8FAC5EbZkVUHanSo3EC5YjSk' },
            { name: 'Lê Anh Tuấn', email: 'tuan.la@student.ptit.edu.vn', role: 'SINH VIÊN', dept: 'D20CQAT01-N', status: 'Ngoại tuyến', initial: 'LA' },
          ],
          classes: [
            { id: 'D21CQCN04-B', dept: 'Khoa Công nghệ thông tin 1', students: 85 },
            { id: 'D20CQAT01-N', dept: 'Khoa An toàn thông tin', students: 62 },
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
    return await api.get<AdminClass[]>('/admin/classes');
  } catch (error) {
    console.warn('Backend endpoint /admin/classes not ready. Using fallback mock data.', error);
    // TODO: Replace fallback mock when backend endpoint is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: '1', name: 'D21CQCN01-B', major: 'Công nghệ thông tin', students: 45, status: 'Đang hoạt động' },
          { id: '2', name: 'D21CQCN02-B', major: 'Công nghệ thông tin', students: 42, status: 'Đang hoạt động' },
          { id: '3', name: 'D21CQCN03-B', major: 'An toàn thông tin', students: 38, status: 'Đã khóa' },
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
    return await api.get<AdminSubject[]>('/admin/subjects');
  } catch (error) {
    console.warn('Backend endpoint /admin/subjects not ready. Using fallback mock data.', error);
    // TODO: Replace fallback mock when backend endpoint is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: '1', name: 'Mạng máy tính', code: 'INT1339', credits: 3, teacher: 'TS. Nguyễn Văn A', classes: 3 },
          { id: '2', name: 'Cấu trúc dữ liệu và Giải thuật', code: 'INT1306', credits: 4, teacher: 'ThS. Trần Thị B', classes: 5 },
          { id: '3', name: 'Hệ điều hành', code: 'INT1313', credits: 3, teacher: 'Chưa gán', classes: 2 },
        ]);
      }, 500);
    });
  }
};
