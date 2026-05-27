import { api } from './client';

// Database Schema Models
export interface DbDocument {
  document_id: number;
  teacher_id: number;
  subject_id: number | null;
  topic_id?: number;
  title: string;
  description?: string;
  file_url: string;
  file_hash?: string;
  file_type: string;
  file_size: number;
  status: string;
  created_at: string;
  updated_at?: string;
  subject?: { subject_id: number | null; subject_name: string };
  topics?: { topic_id: number; topic_name: string }[];
  ai_request_count?: number;
  question_count?: number;
}

export interface DbSubject {
  subject_id: number;
  subject_code: string;
  subject_name: string;
  description?: string;
  status?: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown> | null;
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
  subjectId?: string | number;
  topicId?: string | number;
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
    subjectId: db.subject_id,
    topicId: db.topic_id,
  };
};

export const mapDbDocumentToTeacherResource = (db: DbDocument, usage: number = 0, subjectName: string = 'N/A', topicName?: string): TeacherResource => ({
  id: db.document_id,
  name: db.title,
  size: `${(db.file_size / (1024 * 1024)).toFixed(1)} MB`,
  date: new Date(db.created_at || Date.now()).toLocaleDateString('vi-VN'),
  usage: db.question_count ?? usage,
  subject: db.subject?.subject_name || subjectName,
  topic: db.topics?.[0]?.topic_name || topicName || 'Tong quan',
  description: db.description,
  status: db.status,
  subjectId: db.subject_id ?? undefined,
  topicIds: db.topics?.map((topic) => topic.topic_id) || [],
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
  topic?: string;
  description?: string;
  status?: string;
  subjectId?: number;
  topicId?: number;
  topicIds?: number[];
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
// In-memory mock storage for teacher questions
let mockQuestionsList: DbQuestion[] = [
  // Mạng máy tính (subject_id: 1)
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
      { option_id: 1, question_id: 1, option_label: 'A', option_text: 'Ứng dụng (Application)', is_correct: true, order_num: 0 },
      { option_id: 2, question_id: 1, option_label: 'B', option_text: 'Giao thức (Transport)', is_correct: false, order_num: 1 },
      { option_id: 3, question_id: 1, option_label: 'C', option_text: 'Mạng (Network)', is_correct: false, order_num: 2 },
      { option_id: 4, question_id: 1, option_label: 'D', option_text: 'Vật lý (Physical)', is_correct: false, order_num: 3 }
    ]
  },
  {
    question_id: 2,
    teacher_id: 1,
    subject_id: 1,
    topic_id: 2,
    content: 'Cổng mặc định (default port) được sử dụng cho giao thức HTTPS bảo mật là cổng nào?',
    difficulty: 'easy',
    source: 'manual',
    status: 'approved',
    explanation: 'HTTPS sử dụng cổng 443 làm cổng mặc định cho việc mã hóa SSL/TLS.',
    created_at: new Date().toISOString(),
    options: [
      { option_id: 5, question_id: 2, option_label: 'A', option_text: '80', is_correct: false, order_num: 0 },
      { option_id: 6, question_id: 2, option_label: 'B', option_text: '443', is_correct: true, order_num: 1 },
      { option_id: 7, question_id: 2, option_label: 'C', option_text: '22', is_correct: false, order_num: 2 },
      { option_id: 8, question_id: 2, option_label: 'D', option_text: '8080', is_correct: false, order_num: 3 }
    ]
  },
  {
    question_id: 3,
    teacher_id: 1,
    subject_id: 1,
    topic_id: 3,
    content: 'Trong giao thức TCP, cơ chế "Bắt tay 3 bước" (3-way handshake) được dùng để làm gì?',
    difficulty: 'medium',
    source: 'manual',
    status: 'approved',
    explanation: 'Bắt tay 3 bước khởi tạo kết nối tin cậy giữa client và server bằng cách đồng bộ số SEQ.',
    created_at: new Date().toISOString(),
    options: [
      { option_id: 9, question_id: 3, option_label: 'A', option_text: 'Thiết lập kết nối trước khi truyền dữ liệu', is_correct: true, order_num: 0 },
      { option_id: 10, question_id: 3, option_label: 'B', option_text: 'Mã hóa dữ liệu gửi đi', is_correct: false, order_num: 1 },
      { option_id: 11, question_id: 3, option_label: 'C', option_text: 'Kiểm tra lỗi truyền file', is_correct: false, order_num: 2 },
      { option_id: 12, question_id: 3, option_label: 'D', option_text: 'Ngắt kết nối sau khi hoàn thành', is_correct: false, order_num: 3 }
    ]
  },
  {
    question_id: 4,
    teacher_id: 1,
    subject_id: 1,
    topic_id: 4,
    content: 'Địa chỉ IPv4 có độ dài bao nhiêu bit?',
    difficulty: 'easy',
    source: 'manual',
    status: 'approved',
    explanation: 'IPv4 dài 32 bit, trong khi IPv6 dài 128 bit.',
    created_at: new Date().toISOString(),
    options: [
      { option_id: 13, question_id: 4, option_label: 'A', option_text: '32 bit', is_correct: true, order_num: 0 },
      { option_id: 14, question_id: 4, option_label: 'B', option_text: '48 bit', is_correct: false, order_num: 1 },
      { option_id: 15, question_id: 4, option_label: 'C', option_text: '64 bit', is_correct: false, order_num: 2 },
      { option_id: 16, question_id: 4, option_label: 'D', option_text: '128 bit', is_correct: false, order_num: 3 }
    ]
  },

  // Cấu trúc dữ liệu (subject_id: 2)
  {
    question_id: 5,
    teacher_id: 1,
    subject_id: 2,
    topic_id: 5,
    content: 'Độ phức tạp thời gian truy xuất phần tử theo chỉ số trong Mảng một chiều (Array) là bao nhiêu?',
    difficulty: 'easy',
    source: 'manual',
    status: 'approved',
    explanation: 'Mảng hỗ trợ truy cập ngẫu nhiên trực tiếp thông qua chỉ số với độ phức tạp không đổi O(1).',
    created_at: new Date().toISOString(),
    options: [
      { option_id: 17, question_id: 5, option_label: 'A', option_text: 'O(1)', is_correct: true, order_num: 0 },
      { option_id: 18, question_id: 5, option_label: 'B', option_text: 'O(log n)', is_correct: false, order_num: 1 },
      { option_id: 19, question_id: 5, option_label: 'C', option_text: 'O(n)', is_correct: false, order_num: 2 },
      { option_id: 20, question_id: 5, option_label: 'D', option_text: 'O(n^2)', is_correct: false, order_num: 3 }
    ]
  },
  {
    question_id: 6,
    teacher_id: 1,
    subject_id: 2,
    topic_id: 6,
    content: 'Cây nhị phân tìm kiếm (BST) có tính chất nào sau đây?',
    difficulty: 'medium',
    source: 'manual',
    status: 'approved',
    explanation: 'BST có khóa của mọi nút ở cây con trái đều nhỏ hơn khóa nút gốc, và khóa cây con phải lớn hơn khóa nút gốc.',
    created_at: new Date().toISOString(),
    options: [
      { option_id: 21, question_id: 6, option_label: 'A', option_text: 'Nút con bên trái luôn có giá trị lớn hơn nút cha', is_correct: false, order_num: 0 },
      { option_id: 22, question_id: 6, option_label: 'B', option_text: 'Nút con bên trái nhỏ hơn nút cha, nút con bên phải lớn hơn nút cha', is_correct: true, order_num: 1 },
      { option_id: 23, question_id: 6, option_label: 'C', option_text: 'Tất cả các nút lá phải nằm ở cùng một độ sâu', is_correct: false, order_num: 2 },
      { option_id: 24, question_id: 6, option_label: 'D', option_text: 'Mỗi nút có đúng hai nút con', is_correct: false, order_num: 3 }
    ]
  },

  // Hệ điều hành (subject_id: 3)
  {
    question_id: 7,
    teacher_id: 1,
    subject_id: 3,
    topic_id: 7,
    content: 'Hiện tượng "Deadlock" xảy ra khi nào?',
    difficulty: 'hard',
    source: 'manual',
    status: 'approved',
    explanation: 'Deadlock xảy ra khi hai hoặc nhiều tiến trình bị khóa vĩnh viễn vì mỗi tiến trình đang giữ tài nguyên và chờ tài nguyên khác.',
    created_at: new Date().toISOString(),
    options: [
      { option_id: 25, question_id: 7, option_label: 'A', option_text: 'Hệ điều hành hết dung lượng RAM khả dụng', is_correct: false, order_num: 0 },
      { option_id: 26, question_id: 7, option_label: 'B', option_text: 'Một tiến trình chạy vòng lặp vô hạn', is_correct: false, order_num: 1 },
      { option_id: 27, question_id: 7, option_label: 'C', option_text: 'Nhiều tiến trình chờ đợi lẫn nhau giải phóng tài nguyên tạo thành chu kỳ', is_correct: true, order_num: 2 },
      { option_id: 28, question_id: 7, option_label: 'D', option_text: 'CPU bị quá nhiệt và tự tắt', is_correct: false, order_num: 3 }
    ]
  }
];

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
        resolve({
          subjects: [
            { id: '1', name: 'Mạng máy tính', count: mockQuestionsList.filter(q => q.subject_id === 1).length },
            { id: '2', name: 'Cấu trúc dữ liệu', count: mockQuestionsList.filter(q => q.subject_id === 2).length },
            { id: '3', name: 'Hệ điều hành', count: mockQuestionsList.filter(q => q.subject_id === 3).length },
          ],
          questions: mockQuestionsList.map(mapDbQuestionToGeneratedQuestion)
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
    return new Promise((resolve) => {
      setTimeout(() => {
        payload.questions.forEach(q => {
          const newDbQ: DbQuestion = {
            question_id: parseInt(q.id) || Date.now() + Math.floor(Math.random() * 1000),
            teacher_id: 1,
            subject_id: parseInt(q.subjectId?.toString() || '1'),
            topic_id: parseInt(q.topicId?.toString() || '1'),
            content: q.text,
            difficulty: q.level || 'medium',
            source: q.source || 'ai',
            status: 'approved',
            explanation: q.explanation,
            created_at: new Date().toISOString(),
            options: q.options.map((opt, i) => ({
              option_id: Date.now() + i,
              question_id: 0,
              option_label: ['A', 'B', 'C', 'D'][i] || '',
              option_text: opt,
              is_correct: i === q.correctAnswer,
              order_num: i
            }))
          };
          mockQuestionsList.push(newDbQ);
        });
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
    return new Promise((resolve) => {
      setTimeout(() => {
        const questionId = Date.now();
        const newDbQ: DbQuestion = {
          question_id: questionId,
          teacher_id: 1,
          subject_id: parseInt(payload.subjectId),
          topic_id: parseInt(payload.topicId),
          content: payload.content,
          difficulty: payload.difficulty,
          source: 'manual',
          status: 'approved',
          explanation: payload.explanation,
          created_at: new Date().toISOString(),
          options: payload.options.map((opt, i) => ({
            option_id: Date.now() + i,
            question_id: questionId,
            option_label: ['A', 'B', 'C', 'D'][i],
            option_text: opt,
            is_correct: ['A', 'B', 'C', 'D'][i] === payload.correctOptionLabel,
            order_num: i
          }))
        };
        mockQuestionsList.push(newDbQ);
        resolve({ success: true, question: mapDbQuestionToGeneratedQuestion(newDbQ) });
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
    return new Promise((resolve) => {
      setTimeout(() => {
        const idx = mockQuestionsList.findIndex(q => q.question_id.toString() === id);
        if (idx !== -1) {
          mockQuestionsList[idx] = {
            ...mockQuestionsList[idx],
            subject_id: parseInt(payload.subjectId),
            topic_id: parseInt(payload.topicId),
            content: payload.content,
            difficulty: payload.difficulty,
            explanation: payload.explanation,
            options: payload.options.map((opt, i) => ({
              option_id: mockQuestionsList[idx].options?.[i]?.option_id || Date.now() + i,
              question_id: parseInt(id),
              option_label: ['A', 'B', 'C', 'D'][i],
              option_text: opt,
              is_correct: ['A', 'B', 'C', 'D'][i] === payload.correctOptionLabel,
              order_num: i
            }))
          };
        }
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
    return new Promise((resolve) => {
      setTimeout(() => {
        mockQuestionsList = mockQuestionsList.filter(q => q.question_id.toString() !== id);
        resolve({ success: true });
      }, 500);
    });
  }
};

/**
 * GET /teacher/resources
 */
export const getResources = async (userId: number): Promise<TeacherResource[]> => {
  const [docsRes, subjectsRes] = await Promise.all([
    api.get<ApiEnvelope<DbDocument[]>>('/documents', {
      params: { page: '1', limit: '100' },
    }),
    api.get<ApiEnvelope<DbSubject[]>>('/subjects', {
      params: { page: '1', limit: '100' },
    }),
  ]);

  const dbDocs = (docsRes.data || []).filter((doc) => doc.teacher_id === userId);
  const subjects = subjectsRes.data || [];
  const subjectNameById = new Map<number, string>(
    subjects.map((subject) => [subject.subject_id, subject.subject_name]),
  );

  return dbDocs.map((doc) => {
    const sid = doc.subject_id ?? doc.subject?.subject_id ?? null;
    const resolvedName = sid ? subjectNameById.get(sid) || doc.subject?.subject_name || 'N/A' : doc.subject?.subject_name || 'N/A';
    return mapDbDocumentToTeacherResource(doc, 0, resolvedName);
  });
};

export interface UploadResourcePayload {
  title: string;
  topic_id?: number;
  topic_ids?: number[];
  description?: string;
  file: File;
}

export interface TeacherDocument {
  document_id: number;
  teacher_id: number;
  subject_id: number | null;
  title: string;
  description?: string;
  file_url: string;
  file_type: string;
  file_size: number;
  status: string;
  created_at: string;
  updated_at?: string;
  subject: { subject_id: number | null; subject_name: string };
  topics: { topic_id: number; topic_name: string }[];
  ai_request_count?: number;
  question_count?: number;
  warning?: { has_related_history: boolean; message: string };
}

export interface TeacherDocumentListParams {
  page?: number;
  limit?: number;
  search?: string;
  subject_id?: number;
  topic_id?: number;
  uploaded_from?: string;
  uploaded_to?: string;
  status?: 'active' | 'inactive';
}

/**
 * GET /subjects
 */
export const getSubjects = async (userId: number): Promise<DbSubject[]> => {
  const [subjectsRes, docsRes] = await Promise.all([
    api.get<ApiEnvelope<DbSubject[]>>('/subjects', {
      params: { page: '1', limit: '100' },
    }),
    api.get<ApiEnvelope<DbDocument[]>>('/documents', {
      params: { page: '1', limit: '100', teacher_id: userId.toString() },
    }),
  ]);

  const subjects = subjectsRes.data || [];
  const docs = (docsRes.data || []).filter((doc) => doc.teacher_id === userId);
  const subjectIds = new Set(
    docs
      .map((doc) => doc.subject_id ?? doc.subject?.subject_id ?? null)
      .filter((id): id is number => id !== null),
  );
  return subjects.filter((subject) => subjectIds.has(subject.subject_id));
};

/**
 * GET /topics
 */
export const getTopics = async (userId: number): Promise<DbTopic[]> => {
  const topicsRes = await api.get<ApiEnvelope<DbTopic[]>>('/topics', {
    params: { page: '1', limit: '200' },
  });
  return topicsRes.data || [];
};

/**
 * POST /documents/upload
 */
export const uploadDocument = async (payload: UploadResourcePayload): Promise<DbDocument> => {
  const formData = new FormData();
  formData.append('file', payload.file);
  formData.append('title', payload.title);
  if (payload.topic_id !== undefined) formData.append('topic_ids', payload.topic_id.toString());
  for (const topicId of payload.topic_ids || []) {
    formData.append('topic_ids', topicId.toString());
  }
  if (payload.description) formData.append('description', payload.description);

  const res = await api.post<ApiEnvelope<DbDocument>>('/documents/upload', formData);
  return res.data;
};

export const uploadResource = async (payload: UploadResourcePayload): Promise<TeacherResource> => {
  try {
    const doc = await uploadDocument(payload);
    return mapDbDocumentToTeacherResource(doc, 0, 'Mới tải lên');
  } catch (error) {
    console.warn('Backend endpoint /teacher/resources/upload not ready. Using fallback mock data.', error);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: Date.now(),
          name: payload.title || payload.file.name,
          size: `${(payload.file.size / (1024 * 1024)).toFixed(1)} MB`,
          date: new Date().toLocaleDateString('vi-VN'),
          usage: 0,
          subject: 'Kỹ thuật lập trình',
          topic: 'Đệ quy'
        });
      }, 1000);
    });
  }
};

/**
 * PUT /teacher/resources/:id
 */
export const updateResource = async (id: number | string, payload: Partial<UploadResourcePayload>): Promise<{ success: boolean; data?: TeacherResource }> => {
  const res = await api.put<ApiEnvelope<DbDocument>>(`/documents/${id}`, payload);
  return {
    success: res.success,
    data: res.data ? mapDbDocumentToTeacherResource(res.data, 0) : undefined,
  };
};

/**
 * DELETE /teacher/resources/:id
 */
export const deleteResource = async (id: number | string): Promise<{ success: boolean }> => {
  const res = await api.delete<ApiEnvelope<{ document_id: number; deleted: boolean }>>(`/documents/${id}`);
  return { success: res.success };
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

export interface DbTopic {
  topic_id: number;
  subject_id?: number;
  topic_name: string;
  description?: string;
  status?: string;
}

// Local mock storage for teacher topics
let mockTopics: DbTopic[] = [
  // Subject 1: Mạng máy tính
  { topic_id: 1, subject_id: 1, topic_name: 'Chương 1: Tổng quan mạng máy tính', description: 'Giới thiệu các khái niệm mạng cơ bản, mô hình OSI/TCP-IP', status: 'active' },
  { topic_id: 2, subject_id: 1, topic_name: 'Chương 2: Tầng ứng dụng', description: 'Tìm hiểu giao thức HTTP, DNS, SMTP, FTP', status: 'active' },
  { topic_id: 3, subject_id: 1, topic_name: 'Chương 3: Tầng vận chuyển', description: 'Tìm hiểu giao thức TCP và UDP, kiểm soát lưu lượng', status: 'active' },
  { topic_id: 4, subject_id: 1, topic_name: 'Chương 4: Tầng mạng', description: 'Định tuyến IP, giao thức định tuyến RIP/OSPF', status: 'active' },
  
  // Subject 2: Cấu trúc dữ liệu
  { topic_id: 5, subject_id: 2, topic_name: 'Chương 1: Mảng và Danh sách liên kết', description: 'Cấu trúc dữ liệu tuyến tính cơ bản', status: 'active' },
  { topic_id: 6, subject_id: 2, topic_name: 'Chương 2: Cây nhị phân và Cây BST', description: 'Cây nhị phân tìm kiếm và các phép toán', status: 'active' },
  
  // Subject 3: Hệ điều hành
  { topic_id: 7, subject_id: 3, topic_name: 'Chương 1: Quản lý Tiến trình (Process)', description: 'Lập lịch tiến trình, đồng bộ hóa và deadlock', status: 'active' }
];

/**
 * GET /teacher/topics?subject_id=...
 */
export const getTopicsBySubject = async (subjectId: string | number): Promise<DbTopic[]> => {
  try {
    return await api.get<DbTopic[]>(`/teacher/topics?subject_id=${subjectId}`);
  } catch (error) {
    console.warn(`Backend endpoint /teacher/topics not ready. Using fallback mock data for subject ${subjectId}.`, error);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockTopics.filter(t => t.subject_id === parseInt(subjectId.toString())));
      }, 300);
    });
  }
};

/**
 * POST /teacher/topics
 */
export const createTopic = async (payload: { subject_id: number; topic_name: string; description?: string }): Promise<DbTopic> => {
  try {
    return await api.post<DbTopic>('/teacher/topics', payload);
  } catch (error) {
    console.warn('Backend /teacher/topics (POST) not ready. Using mock.', error);
    return new Promise((resolve) => {
      setTimeout(() => {
        const newTopic: DbTopic = {
          topic_id: Date.now(),
          subject_id: payload.subject_id,
          topic_name: payload.topic_name,
          description: payload.description,
          status: 'active'
        };
        mockTopics.push(newTopic);
        resolve(newTopic);
      }, 500);
    });
  }
};

/**
 * PUT /teacher/topics/:id
 */
export const updateTopic = async (id: string | number, payload: Partial<DbTopic>): Promise<DbTopic> => {
  try {
    return await api.put<DbTopic>(`/teacher/topics/${id}`, payload);
  } catch (error) {
    console.warn(`Backend /teacher/topics/${id} (PUT) not ready. Using mock.`, error);
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = mockTopics.findIndex(t => t.topic_id === parseInt(id.toString()));
        if (index !== -1) {
          mockTopics[index] = { ...mockTopics[index], ...payload };
          resolve(mockTopics[index]);
        } else {
          resolve({
            topic_id: parseInt(id.toString()),
            subject_id: 1,
            topic_name: payload.topic_name || 'Mock',
            description: payload.description,
            status: 'active'
          });
        }
      }, 500);
    });
  }
};

/**
 * DELETE /teacher/topics/:id
 */
export const deleteTopic = async (id: string | number): Promise<void> => {
  try {
    await api.delete<void>(`/teacher/topics/${id}`);
  } catch (error) {
    console.warn(`Backend /teacher/topics/${id} (DELETE) not ready. Using mock.`, error);
    return new Promise((resolve) => {
      setTimeout(() => {
        mockTopics = mockTopics.filter(t => t.topic_id !== parseInt(id.toString()));
        resolve();
      }, 500);
    });
  }
};


