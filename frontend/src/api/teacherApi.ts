import { api } from './client';

export interface TeacherStatItem {
  label: string;
  value: string;
  growth?: string;
  sub?: string;
  icon: string;
  color: string;
  bg: string;
}

export interface RecentQuiz {
  title: string;
  info: string;
  icon: string;
  bg: string;
}

export interface MaterialStatus {
  name: string;
  date: string;
  status: string;
  statusColor: string;
}

export interface TeacherDashboardStats {
  stats: TeacherStatItem[];
  recentQuizzes: RecentQuiz[];
  materials: MaterialStatus[];
}

export interface GeneratedQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  sourceSnippet: string;
  confidence: number;
  isApproved: boolean;
  type?: string;
  level?: string;
  source?: string;
  status?: string;
}

export interface BankSubject {
  id: string;
  name: string;
  count: number;
}

export interface QuestionBankData {
  subjects: BankSubject[];
  questions: GeneratedQuestion[];
}

export interface TeacherResource {
  id: number | string;
  name: string;
  size: string;
  date: string;
  usage: number;
  subject: string;
}

export interface WeakTopic {
  name: string;
  errorRate: number;
  count: number;
}

export interface TeacherStatsData {
  classStats: TeacherStatItem[];
  weakTopics: WeakTopic[];
}

export interface TeacherProfile {
  name: string;
  email: string;
  department: string;
}

export interface AIConfig {
  model: string;
  temperature: number;
  explainDetails: boolean;
  suggestTopics: boolean;
}

export interface TeacherSettings {
  profile: TeacherProfile;
  aiConfig: AIConfig;
}

/**
 * GET /teacher/dashboard/stats
 */
export const getTeacherDashboardStats = async (): Promise<TeacherDashboardStats> => {
  try {
    return await api.get<TeacherDashboardStats>('/teacher/dashboard/stats');
  } catch (error) {
    console.warn('Backend endpoint /teacher/dashboard/stats not ready. Using fallback mock data.', error);
    // TODO: Replace fallback mock when backend endpoint is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          stats: [
            { label: 'Tổng số câu hỏi', value: '1,248', growth: '+12% tháng này', icon: 'quiz', color: 'text-[#b20112]', bg: 'bg-red-50' },
            { label: 'Tài liệu đã tải', value: '56', sub: 'Dung lượng: 245MB', icon: 'description', color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Lớp đang dạy', value: '04', sub: '320 Sinh viên', icon: 'groups', color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Lượt làm bài của SV', value: '8,902', growth: '+8% tuần này', icon: 'task_alt', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ],
          recentQuizzes: [
            { title: 'Cơ sở dữ liệu - Chương 3', info: '20 câu hỏi • 2 phút trước', icon: 'auto_awesome', bg: 'bg-[#b20112]' },
            { title: 'Mạng máy tính - Lab 02', info: '15 câu hỏi • 1 giờ trước', icon: 'lan', bg: 'bg-slate-400' },
            { title: 'An toàn thông tin - Final', info: '50 câu hỏi • 3 giờ trước', icon: 'security', bg: 'bg-[#d62828]' },
          ],
          materials: [
            { name: 'Giao-trinh-CSDL.pdf', date: '12/10/2023', status: 'Đã xử lý AI', statusColor: 'text-emerald-600 bg-emerald-50' },
            { name: 'De-cuong-MMT.docx', date: '14/10/2023', status: 'Đang chờ', statusColor: 'text-amber-600 bg-amber-50' },
            { name: 'Bai-tap-lon-ATTT.pdf', date: '15/10/2023', status: 'Đã xử lý AI', statusColor: 'text-emerald-600 bg-emerald-50' },
            { name: 'Tai-lieu-Java-Nang-cao.pdf', date: '15/10/2023', status: 'Đang chờ', statusColor: 'text-amber-600 bg-amber-50' },
          ]
        });
      }, 500);
    });
  }
};

/**
 * POST /teacher/ai-generator/generate
 */
export const generateQuestions = async (payload: any): Promise<GeneratedQuestion[]> => {
  try {
    return await api.post<GeneratedQuestion[]>('/teacher/ai-generator/generate', payload);
  } catch (error) {
    console.warn('Backend endpoint /teacher/ai-generator/generate not ready. Using fallback mock data.', error);
    // TODO: Replace fallback mock when backend endpoint is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            text: 'Trong một cây nhị phân đầy đủ, nếu cây có độ cao là h, thì số lượng nút tối đa là bao nhiêu?',
            options: ['2^(h+1) - 1', '2^h - 1', '2^(h-1)', 'h^2'],
            correctAnswer: 0,
            sourceSnippet: '...Theo định lý về cây nhị phân đầy đủ, số nút tối đa ở mức h là 2^h, và tổng số nút của cây độ cao h là 2^(h+1)-1...',
            confidence: 98,
            isApproved: false
          },
          {
            id: '2',
            text: 'Độ phức tạp thời gian trung bình của thao tác tìm kiếm trên Cây nhị phân tìm kiếm (BST) là bao nhiêu?',
            options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
            correctAnswer: 1,
            sourceSnippet: '...Trên một cây BST cân bằng, các thao tác tìm kiếm, chèn, xóa đều có độ phức tạp trung bình là O(log n)...',
            confidence: 95,
            isApproved: false
          }
        ]);
      }, 2000); // 2 second delay to simulate AI processing
    });
  }
};

/**
 * GET /teacher/question-bank
 */
export const getQuestionBank = async (): Promise<QuestionBankData> => {
  try {
    return await api.get<QuestionBankData>('/teacher/question-bank');
  } catch (error) {
    console.warn('Backend endpoint /teacher/question-bank not ready. Using fallback mock data.', error);
    // TODO: Replace fallback mock when backend endpoint is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          subjects: [
            { id: '1', name: 'Mạng máy tính', count: 156 },
            { id: '2', name: 'Cấu trúc dữ liệu', count: 84 },
            { id: '3', name: 'Hệ điều hành', count: 42 },
          ],
          questions: [
            { id: '1', text: 'Giao thức HTTP hoạt động ở tầng nào của mô hình OSI?', type: 'Trắc nghiệm', level: 'Dễ', source: 'Giao trình MMT - Ch3', status: 'Đã duyệt', options: [], correctAnswer: 0, sourceSnippet: '', confidence: 100, isApproved: true },
            { id: '2', text: 'Trình bày sự khác biệt giữa TCP và UDP?', type: 'Tự luận (AI chấm)', level: 'Khó', source: 'Slide bài giảng 2', status: 'Đã duyệt', options: [], correctAnswer: 0, sourceSnippet: '', confidence: 100, isApproved: true },
            { id: '3', text: 'Độ dài tối đa của một khung hình Ethernet là bao nhiêu?', type: 'Trắc nghiệm', level: 'Trung bình', source: 'Tài liệu bổ trợ', status: 'Đã duyệt', options: [], correctAnswer: 0, sourceSnippet: '', confidence: 100, isApproved: true },
          ]
        });
      }, 500);
    });
  }
};

/**
 * POST /teacher/question-bank
 */
export const saveGeneratedQuestions = async (payload: { questions: GeneratedQuestion[] }): Promise<{ success: boolean }> => {
  try {
    return await api.post<{ success: boolean }>('/teacher/question-bank', payload);
  } catch (error) {
    console.warn('Backend endpoint /teacher/question-bank (POST) not ready. Using fallback mock data.', error);
    // TODO: Replace fallback mock when backend endpoint is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 500);
    });
  }
};

/**
 * GET /teacher/resources
 */
export const getResources = async (): Promise<TeacherResource[]> => {
  try {
    return await api.get<TeacherResource[]>('/teacher/resources');
  } catch (error) {
    console.warn('Backend endpoint /teacher/resources not ready. Using fallback mock data.', error);
    // TODO: Replace fallback mock when backend endpoint is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: 1, name: 'Giao trinh Mang may tinh - Chuong 3.pdf', size: '2.4 MB', date: '20/04/2026', usage: 45, subject: 'Mạng máy tính' },
          { id: 2, name: 'Slide Bai giang Co so du lieu.pptx', size: '12.8 MB', date: '18/04/2026', usage: 12, subject: 'Cơ sở dữ liệu' },
          { id: 3, name: 'Tai lieu on tap He dieu hanh.docx', size: '1.1 MB', date: '15/04/2026', usage: 0, subject: 'Hệ điều hành' },
        ]);
      }, 500);
    });
  }
};

/**
 * POST /teacher/resources/upload
 */
export const uploadResource = async (file: File): Promise<TeacherResource> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    return await api.post<TeacherResource>('/teacher/resources/upload', formData, {
      headers: {
        // Fetch API automatically sets correct Content-Type with boundary when body is FormData
        // We just need to make sure we don't accidentally set it to application/json
        'Content-Type': undefined as any
      }
    });
  } catch (error) {
    console.warn('Backend endpoint /teacher/resources/upload not ready. Using fallback mock data.', error);
    // TODO: Replace fallback mock when backend endpoint is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: Date.now(),
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          date: new Date().toLocaleDateString('vi-VN'),
          usage: 0,
          subject: 'Chưa phân loại'
        });
      }, 1000);
    });
  }
};

/**
 * GET /teacher/stats
 */
export const getTeacherStats = async (): Promise<TeacherStatsData> => {
  try {
    return await api.get<TeacherStatsData>('/teacher/stats');
  } catch (error) {
    console.warn('Backend endpoint /teacher/stats not ready. Using fallback mock data.', error);
    // TODO: Replace fallback mock when backend endpoint is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          classStats: [
            { label: 'Điểm trung bình lớp', value: '7.8', icon: 'auto_graph', color: 'text-[#b20112]', bg: 'bg-red-50' },
            { label: 'Tỉ lệ hoàn thành', value: '92%', icon: 'checklist', color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Số giờ tự học', value: '142h', icon: 'timer', color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Bài tập đã làm', value: '1,240', icon: 'quiz', color: 'text-amber-600', bg: 'bg-amber-50' },
          ],
          weakTopics: [
            { name: 'Giao thức TCP/UDP', errorRate: 45, count: 120 },
            { name: 'Định tuyến IP', errorRate: 38, count: 95 },
            { name: 'Mô hình OSI', errorRate: 25, count: 210 },
            { name: 'Tầng vật lý', errorRate: 12, count: 180 },
          ]
        });
      }, 500);
    });
  }
};

/**
 * GET /teacher/settings
 */
export const getTeacherSettings = async (): Promise<TeacherSettings> => {
  try {
    return await api.get<TeacherSettings>('/teacher/settings');
  } catch (error) {
    console.warn('Backend endpoint /teacher/settings not ready. Using fallback mock data.', error);
    // TODO: Replace fallback mock when backend endpoint is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          profile: {
            name: 'Nguyễn Văn A',
            email: 'a.nv@ptit.edu.vn',
            department: 'Khoa CNTT 1',
          },
          aiConfig: {
            model: 'Gemini 1.5 Pro',
            temperature: 0.7,
            explainDetails: true,
            suggestTopics: false,
          }
        });
      }, 500);
    });
  }
};

/**
 * PUT /teacher/settings
 */
export const updateTeacherSettings = async (payload: Partial<TeacherSettings>): Promise<TeacherSettings> => {
  try {
    return await api.put<TeacherSettings>('/teacher/settings', payload);
  } catch (error) {
    console.warn('Backend endpoint /teacher/settings (PUT) not ready. Using fallback mock data.', error);
    // TODO: Replace fallback mock when backend endpoint is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        // Return dummy merged settings
        resolve({
          profile: {
            name: payload.profile?.name || 'Nguyễn Văn A',
            email: payload.profile?.email || 'a.nv@ptit.edu.vn',
            department: 'Khoa CNTT 1',
          },
          aiConfig: {
            model: payload.aiConfig?.model || 'Gemini 1.5 Pro',
            temperature: payload.aiConfig?.temperature || 0.7,
            explainDetails: payload.aiConfig?.explainDetails !== undefined ? payload.aiConfig.explainDetails : true,
            suggestTopics: payload.aiConfig?.suggestTopics !== undefined ? payload.aiConfig.suggestTopics : false,
          }
        });
      }, 1000);
    });
  }
};
