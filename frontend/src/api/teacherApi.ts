import { api } from './client';

// Database Schema Models
export interface DbDocument {
  document_id: number;
  teacher_id: number;
  subject_id: number;
  topic_id?: number;
  title: string;
  description?: string;
  file_url: string;
  file_type: string;
  file_size: number;
  status: string;
  created_at: string;
}

export interface DbOption {
  option_id: number;
  question_id: number;
  option_label: string;
  option_text: string;
  is_correct: boolean;
  order_num: number;
}

export interface DbQuestion {
  question_id: number;
  teacher_id: number;
  subject_id: number;
  topic_id: number;
  document_id?: number;
  ai_request_id?: number;
  content: string;
  difficulty: string;
  source: string;
  status: string;
  explanation?: string;
  options?: DbOption[];
  created_at: string;
}

// UI Models
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
  correctAnswer: number; // index
  sourceSnippet?: string;
  confidence?: number;
  isApproved: boolean;
  type?: string;
  level?: string;
  source?: string;
  status?: string;
  explanation?: string;
}

// Mappers
export const mapDbQuestionToGeneratedQuestion = (db: DbQuestion): GeneratedQuestion => {
  const options = db.options || [];
  const correctAnswerIndex = options.findIndex(o => o.is_correct);

  return {
    id: db.question_id.toString(),
    text: db.content,
    options: options.map(o => o.option_text),
    correctAnswer: correctAnswerIndex >= 0 ? correctAnswerIndex : 0,
    isApproved: db.status === 'approved',
    level: db.difficulty,
    source: db.source,
    status: db.status,
    explanation: db.explanation,
  };
};

export const mapDbDocumentToTeacherResource = (db: DbDocument, usage: number = 0, subjectName: string = 'N/A'): TeacherResource => ({
  id: db.document_id,
  name: db.title,
  size: `${(db.file_size / (1024 * 1024)).toFixed(1)} MB`,
  date: new Date(db.created_at || Date.now()).toLocaleDateString('vi-VN'),
  usage: usage,
  subject: subjectName,
});

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
    const dbQuestions = await api.post<DbQuestion[]>('/teacher/ai-generator/generate', payload);
    return dbQuestions.map(mapDbQuestionToGeneratedQuestion);
  } catch (error) {
    console.warn('Backend endpoint /teacher/ai-generator/generate not ready. Using fallback mock data.', error);
    // TODO: Replace fallback mock when backend endpoint is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockQuestions: DbQuestion[] = [
          {
            question_id: 1,
            teacher_id: 1,
            subject_id: 1,
            topic_id: 1,
            content: 'Trong một cây nhị phân đầy đủ, nếu cây có độ cao là h, thì số lượng nút tối đa là bao nhiêu?',
            difficulty: 'medium',
            source: 'ai',
            status: 'draft',
            created_at: new Date().toISOString(),
            options: [
              { option_id: 1, question_id: 1, option_label: 'A', option_text: '2^(h+1) - 1', is_correct: true, order_num: 0 },
              { option_id: 2, question_id: 1, option_label: 'B', option_text: '2^h - 1', is_correct: false, order_num: 1 },
              { option_id: 3, question_id: 1, option_label: 'C', option_text: '2^(h-1)', is_correct: false, order_num: 2 },
              { option_id: 4, question_id: 1, option_label: 'D', option_text: 'h^2', is_correct: false, order_num: 3 },
            ]
          },
          {
            question_id: 2,
            teacher_id: 1,
            subject_id: 1,
            topic_id: 1,
            content: 'Độ phức tạp thời gian trung bình của thao tác tìm kiếm trên Cây nhị phân tìm kiếm (BST) là bao nhiêu?',
            difficulty: 'medium',
            source: 'ai',
            status: 'draft',
            created_at: new Date().toISOString(),
            options: [
              { option_id: 5, question_id: 2, option_label: 'A', option_text: 'O(n)', is_correct: false, order_num: 0 },
              { option_id: 6, question_id: 2, option_label: 'B', option_text: 'O(log n)', is_correct: true, order_num: 1 },
              { option_id: 7, question_id: 2, option_label: 'C', option_text: 'O(n log n)', is_correct: false, order_num: 2 },
              { option_id: 8, question_id: 2, option_label: 'D', option_text: 'O(1)', is_correct: false, order_num: 3 },
            ]
          }
        ];
        resolve(mockQuestions.map(mapDbQuestionToGeneratedQuestion));
      }, 2000); // 2 second delay to simulate AI processing
    });
  }
};

/**
 * GET /teacher/question-bank
 */
export const getQuestionBank = async (): Promise<QuestionBankData> => {
  try {
    const response = await api.get<{ subjects: BankSubject[], questions: DbQuestion[] }>('/teacher/question-bank');
    return {
      subjects: response.subjects,
      questions: response.questions.map(mapDbQuestionToGeneratedQuestion)
    };
  } catch (error) {
    console.warn('Backend endpoint /teacher/question-bank not ready. Using fallback mock data.', error);
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockQuestions: DbQuestion[] = [
          {
            question_id: 1,
            teacher_id: 1,
            subject_id: 1,
            topic_id: 1,
            content: 'Giao thức HTTP hoạt động ở tầng nào của mô hình OSI?',
            difficulty: 'easy',
            source: 'manual',
            status: 'approved',
            explanation: 'HTTP là giao thức tầng ứng dụng, cung cấp giao diện cho người dùng.',
            created_at: new Date().toISOString(),
            options: [
              { option_id: 1, question_id: 1, option_label: 'A', option_text: 'Ứng dụng', is_correct: true, order_num: 0 },
              { option_id: 2, question_id: 1, option_label: 'B', option_text: 'Giao thức', is_correct: false, order_num: 1 },
              { option_id: 3, question_id: 1, option_label: 'C', option_text: 'Mạng', is_correct: false, order_num: 2 },
              { option_id: 4, question_id: 1, option_label: 'D', option_text: 'Vật lý', is_correct: false, order_num: 3 }
            ]
          },
        ];
        resolve({
          subjects: [
            { id: '1', name: 'Mạng máy tính', count: 156 },
            { id: '2', name: 'Cấu trúc dữ liệu', count: 84 },
            { id: '3', name: 'Hệ điều hành', count: 42 },
          ],
          questions: mockQuestions.map(mapDbQuestionToGeneratedQuestion)
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

export interface ManualQuestionPayload {
  subjectId: string;
  topicId: string;
  content: string;
  difficulty: string;
  options: string[];
  correctOptionLabel: string; // A, B, C, D
  explanation?: string;
}

/**
 * POST /teacher/question-bank/manual
 */
export const createManualQuestion = async (payload: ManualQuestionPayload): Promise<{ success: boolean; question?: GeneratedQuestion }> => {
  try {
    return await api.post<{ success: boolean; question?: GeneratedQuestion }>('/teacher/question-bank/manual', payload);
  } catch (error) {
    console.warn('Backend endpoint /teacher/question-bank/manual not ready. Using fallback mock data.', error);
    // TODO: Replace fallback mock when backend endpoint is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        const newQuestion: GeneratedQuestion = {
          id: Date.now().toString(),
          text: payload.content,
          options: payload.options,
          correctAnswer: payload.options.indexOf(payload.options.find((_, i) => ['A', 'B', 'C', 'D'][i] === payload.correctOptionLabel) || '') || 0,
          isApproved: true,
          level: payload.difficulty,
          source: 'manual',
          status: 'approved',
          explanation: payload.explanation
        };
        resolve({ success: true, question: newQuestion });
      }, 800);
    });
  }
};

/**
 * PUT /teacher/question-bank/:id
 */
export const updateQuestion = async (id: string, payload: ManualQuestionPayload): Promise<{ success: boolean }> => {
  try {
    return await api.put<{ success: boolean }>(`/teacher/question-bank/${id}`, payload);
  } catch (error) {
    console.warn(`Backend endpoint /teacher/question-bank/${id} (PUT) not ready. Using fallback mock data.`, error);
    // TODO: Replace fallback mock when backend endpoint is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 500);
    });
  }
};

/**
 * DELETE /teacher/question-bank/:id
 */
export const deleteQuestion = async (id: string): Promise<{ success: boolean }> => {
  try {
    return await api.delete<{ success: boolean }>(`/teacher/question-bank/${id}`);
  } catch (error) {
    console.warn(`Backend endpoint /teacher/question-bank/${id} (DELETE) not ready. Using fallback mock data.`, error);
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
    const dbDocs = await api.get<DbDocument[]>('/teacher/resources');
    return dbDocs.map(d => mapDbDocumentToTeacherResource(d, 10, 'Môn học Mock'));
  } catch (error) {
    console.warn('Backend endpoint /teacher/resources not ready. Using fallback mock data.', error);
    // TODO: Replace fallback mock when backend endpoint is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockDocs: DbDocument[] = [
          { document_id: 1, teacher_id: 1, subject_id: 1, title: 'Giao trinh Mang may tinh - Chuong 3.pdf', file_url: '', file_type: 'pdf', file_size: 2516582, status: 'active', created_at: '2026-04-20T00:00:00Z' },
          { document_id: 2, teacher_id: 1, subject_id: 1, title: 'Slide Bai giang Co so du lieu.pptx', file_url: '', file_type: 'pptx', file_size: 13421772, status: 'active', created_at: '2026-04-18T00:00:00Z' },
        ];
        resolve(mockDocs.map(d => mapDbDocumentToTeacherResource(d, 45, 'Mạng máy tính')));
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
