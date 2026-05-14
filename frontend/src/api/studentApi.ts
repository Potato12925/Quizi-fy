import { api } from './client';

export interface SubjectStat {
  id: string;
  name: string;
  questions: number;
  color: string;
  icon: string;
  class?: string;
}

export interface Metric {
  label: string;
  value: string;
  icon: string;
  color: string;
  bg: string;
}

export interface Activity {
  id: string;
  subject: string;
  time: string;
  score: string;
}

export interface StudentDashboardData {
  subjects: SubjectStat[];
  metrics: Metric[];
  activities: Activity[];
}

export interface HistoryItem {
  id: number;
  subject: string;
  date: string;
  score: number;
  total: number;
  time: string;
  status: string;
}

export interface Topic {
  name: string;
  status: string;
}

export interface PracticeModule {
  name: string;
  topics: number;
  completed: number;
  icon: string;
  color: string;
}

export interface OngoingExam {
  title: string;
  deadline: string;
  questions: number;
  duration: string;
}

export interface PracticeSubjectData {
  modules: PracticeModule[];
  exams: OngoingExam[];
}

export interface PracticeSessionPayload {
  subject: string;
  quantity: number;
  level: string;
  topics: string[];
  mode: string;
}

export interface Question {
  id: number;
  text: string;
  options: string[];
}

export interface PracticeDetail {
  id: string;
  subjectName: string;
  duration: number; // in seconds
  questions: Question[];
}

export interface SubmitPracticePayload {
  answers: Record<number, number>;
}

export interface SubmitPracticeResponse {
  success: boolean;
  resultId: string;
}

export interface ProgressStats {
  avgScore: number;
  totalAttempts: number;
  totalQuestions: number;
  timeStudied: string;
  accuracy: number;
}

export interface SubjectPerformance {
  name: string;
  score: number;
  color: string;
}

export interface StudentProgressData {
  stats: ProgressStats;
  subjectPerformance: SubjectPerformance[];
}

export interface ResultOverview {
  score: number;
  total: number;
  time: string;
  accuracy: number;
}

export interface ResultQuestion {
  text: string;
  options: string[];
  userAnswer: number;
  correctAnswer: number;
  explanation: string;
}

export interface StudentResultData {
  overview: ResultOverview;
  questions: ResultQuestion[];
}

/**
 * GET /student/dashboard
 */
export const getStudentDashboard = async (): Promise<StudentDashboardData> => {
  try {
    return await api.get<StudentDashboardData>('/student/dashboard');
  } catch (error) {
    console.warn('Backend endpoint /student/dashboard not ready. Using fallback mock data.', error);
    // TODO: Replace fallback mock when backend endpoint is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          subjects: [
            { id: '1', name: 'Mạng máy tính', questions: 150, color: 'text-[#b20112]', icon: 'language' },
            { id: '2', name: 'Cấu trúc dữ liệu', questions: 200, color: 'text-emerald-600', icon: 'account_tree' },
            { id: '3', name: 'Hệ điều hành', questions: 120, color: 'text-blue-600', icon: 'terminal' },
          ],
          metrics: [
            { label: 'Chuỗi ngày', value: '12', icon: 'local_fire_department', color: 'text-red-500', bg: 'bg-red-50' },
            { label: 'Điểm tích lũy', value: '2,450', icon: 'star', color: 'text-amber-500', bg: 'bg-amber-50' },
            { label: 'Hoàn thành', value: '85%', icon: 'task_alt', color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'Thời gian học', value: '4.2h', icon: 'timer', color: 'text-slate-400', bg: 'bg-slate-50' },
          ],
          activities: [
            { id: '1', subject: 'Cấu trúc dữ liệu', time: 'Hôm qua, 14:20', score: '9/10' },
            { id: '2', subject: 'Mạng máy tính', time: '2 ngày trước', score: '8/10' },
          ]
        });
      }, 500);
    });
  }
};

/**
 * GET /student/history
 */
export const getStudentHistory = async (): Promise<HistoryItem[]> => {
  try {
    return await api.get<HistoryItem[]>('/student/history');
  } catch (error) {
    console.warn('Backend endpoint /student/history not ready. Using fallback mock data.', error);
    // TODO: Replace fallback mock when backend endpoint is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: 1, subject: 'Mạng máy tính', date: '25/04/2024', score: 8, total: 10, time: '12:45', status: 'Giỏi' },
          { id: 2, subject: 'Cấu trúc dữ liệu', date: '24/04/2024', score: 9, total: 10, time: '15:20', status: 'Xuất sắc' },
          { id: 3, subject: 'Lập trình hướng đối tượng', date: '23/04/2024', score: 6, total: 10, time: '18:10', status: 'Khá' },
          { id: 4, subject: 'Cơ sở dữ liệu', date: '22/04/2024', score: 7, total: 10, time: '14:30', status: 'Khá' },
          { id: 5, subject: 'Mạng máy tính', date: '21/04/2024', score: 5, total: 10, time: '20:00', status: 'TB' },
        ]);
      }, 500);
    });
  }
};

/**
 * GET /student/practice
 */
export const getPracticeList = async (): Promise<PracticeSubjectData> => {
  try {
    return await api.get<PracticeSubjectData>('/student/practice');
  } catch (error) {
    console.warn('Backend endpoint /student/practice not ready. Using fallback mock data.', error);
    // TODO: Replace fallback mock when backend endpoint is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          modules: [
            { name: 'Cấu trúc dữ liệu & Giải thuật', topics: 12, completed: 8, icon: 'account_tree', color: 'bg-red-500' },
            { name: 'Mạng máy tính', topics: 10, completed: 4, icon: 'settings_input_antenna', color: 'bg-blue-500' },
            { name: 'Lập trình Java nâng cao', topics: 15, completed: 12, icon: 'code', color: 'bg-purple-500' },
            { name: 'Cơ sở dữ liệu', topics: 8, completed: 7, icon: 'database', color: 'bg-orange-500' },
          ],
          exams: [
            { title: 'Kiểm tra giữa kỳ - Mạng máy tính', deadline: 'Còn 2 ngày', questions: 40, duration: '60 phút' },
            { title: 'Bài tập tuần 4 - Java', deadline: 'Hôm nay', questions: 20, duration: '30 phút' },
          ]
        });
      }, 500);
    });
  }
};

/**
 * POST /student/practice/setup
 */
export const createPracticeSession = async (payload: PracticeSessionPayload): Promise<{ practiceId: string }> => {
  try {
    return await api.post<{ practiceId: string }>('/student/practice/setup', payload);
  } catch (error) {
    console.warn('Backend endpoint /student/practice/setup not ready. Using fallback mock data.', error);
    // TODO: Replace fallback mock when backend endpoint is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ practiceId: 'demo-practice-id' });
      }, 1000); // Simulate AI generation
    });
  }
};

/**
 * GET /student/practice/:id
 */
export const getPracticeDetail = async (practiceId: string): Promise<PracticeDetail> => {
  try {
    return await api.get<PracticeDetail>(`/student/practice/${practiceId}`);
  } catch (error) {
    console.warn(`Backend endpoint /student/practice/${practiceId} not ready. Using fallback mock data.`, error);
    // TODO: Replace fallback mock when backend endpoint is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: practiceId,
          subjectName: 'Môn học Demo',
          duration: 1200, // 20 minutes
          questions: [
            {
              id: 1,
              text: 'Trong mô hình OSI, tầng nào chịu trách nhiệm nén dữ liệu và mã hóa?',
              options: ['Tầng ứng dụng (Application)', 'Tầng trình diễn (Presentation)', 'Tầng phiên (Session)', 'Tầng giao vận (Transport)'],
            },
            {
              id: 2,
              text: 'Giao thức nào sau đây được sử dụng để truyền tải file trên Internet?',
              options: ['HTTP', 'SMTP', 'FTP', 'DNS'],
            },
            {
              id: 3,
              text: 'Địa chỉ IPv4 có độ dài bao nhiêu bit?',
              options: ['16 bit', '32 bit', '64 bit', '128 bit'],
            },
            {
              id: 4,
              text: 'Thiết bị Switch hoạt động ở tầng nào của mô hình OSI?',
              options: ['Tầng 1 (Physical)', 'Tầng 2 (Data Link)', 'Tầng 3 (Network)', 'Tầng 4 (Transport)'],
            },
          ]
        });
      }, 500);
    });
  }
};

/**
 * POST /student/practice/:id/submit
 */
export const submitPractice = async (practiceId: string, payload: SubmitPracticePayload): Promise<SubmitPracticeResponse> => {
  try {
    return await api.post<SubmitPracticeResponse>(`/student/practice/${practiceId}/submit`, payload);
  } catch (error) {
    console.warn(`Backend endpoint /student/practice/${practiceId}/submit not ready. Using fallback mock data.`, error);
    // TODO: Replace fallback mock when backend endpoint is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, resultId: 'demo-result-id' });
      }, 800);
    });
  }
};

/**
 * GET /student/progress
 */
export const getStudentProgress = async (): Promise<StudentProgressData> => {
  try {
    return await api.get<StudentProgressData>('/student/progress');
  } catch (error) {
    console.warn('Backend endpoint /student/progress not ready. Using fallback mock data.', error);
    // TODO: Replace fallback mock when backend endpoint is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          stats: {
            avgScore: 8.4,
            totalAttempts: 32,
            totalQuestions: 480,
            timeStudied: '24h 15m',
            accuracy: 78
          },
          subjectPerformance: [
            { name: 'Mạng máy tính', score: 85, color: 'bg-[#b20112]' },
            { name: 'Cấu trúc dữ liệu', score: 65, color: 'bg-emerald-500' },
            { name: 'Hệ điều hành', score: 40, color: 'bg-blue-500' },
            { name: 'Giải tích 1', score: 90, color: 'bg-amber-500' },
          ]
        });
      }, 500);
    });
  }
};

/**
 * GET /student/results
 */
export const getStudentResults = async (): Promise<any[]> => {
  try {
    return await api.get<any[]>('/student/results');
  } catch (error) {
    console.warn('Backend endpoint /student/results not ready. Using fallback mock data.', error);
    // TODO: Replace fallback mock when backend endpoint is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([]); // Returning empty for now, detail page is more important
      }, 500);
    });
  }
};

/**
 * GET /student/results/:id
 */
export const getStudentResultDetail = async (resultId: string): Promise<StudentResultData> => {
  try {
    return await api.get<StudentResultData>(`/student/results/${resultId}`);
  } catch (error) {
    console.warn(`Backend endpoint /student/results/${resultId} not ready. Using fallback mock data.`, error);
    // TODO: Replace fallback mock when backend endpoint is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          overview: { score: 8.5, total: 20, time: '14:30', accuracy: 85 },
          questions: [
            {
              text: 'Trong mô hình OSI, tầng nào chịu trách nhiệm nén dữ liệu và mã hóa?',
              options: ['Tầng ứng dụng (Application)', 'Tầng trình diễn (Presentation)', 'Tầng phiên (Session)', 'Tầng giao vận (Transport)'],
              userAnswer: 1,
              correctAnswer: 1,
              explanation: 'Tầng trình diễn (Presentation) có nhiệm vụ mã hóa, giải mã và nén dữ liệu để đảm bảo các thiết bị khác nhau có thể hiểu nhau.'
            },
            {
              text: 'Địa chỉ IPv4 có độ dài bao nhiêu bit?',
              options: ['16 bit', '32 bit', '64 bit', '128 bit'],
              userAnswer: 2, // incorrect
              correctAnswer: 1,
              explanation: 'IPv4 là phiên bản thứ tư của Internet Protocol, sử dụng không gian địa chỉ 32 bit.'
            }
          ]
        });
      }, 500);
    });
  }
};
