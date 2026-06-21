import * as client from './client';

// UI Models
export default interface SubjectStat {
  id: string;
  name: string;
  questions: number;
  color: string;
  icon?: string;
  class?: string;
  indexNum?: string;
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
  practice_set_id: number;
  subject: string;
  date: string;
  score: number;
  total: number;
  time: string;
  status: string;
  performance: string;
  started_at: string;
}

export interface PracticeSessionPayload {
  subject: string;
  quantity: number;
  level: string;
  topics: string[];
  mode: string;
}

export interface Option {
  id: number;
  text: string;
}

export interface Question {
  id: number;
  text: string;
  options: Option[];
  selectedOptionId?: number;
}

export interface PracticeDetail {
  id: string;
  subjectName: string;
  duration: number; // in seconds
  startedAt?: string;
  questions: Question[];
}

export interface SubmitPracticePayload {
  answers: { question_id: number, selected_option_id: number }[];
}

export interface SubmitPracticeResponse {
  success: boolean;
  resultId: string;
}

export interface ResultOverview {
  score: number;
  total: number;
  time: string;
  accuracy: number;
}

export interface ResultQuestion {
  text: string;
  options: { id: number, text: string }[];
  userAnswer?: number;
  correctAnswer: number;
  explanation: string;
}

export interface StudentResultData {
  overview: ResultOverview;
  questions: ResultQuestion[];
}


// Helper for subject styles
const getSubjectColor = (id: number): string => {
  const colors = [
    'text-[#b20112]',
    'text-emerald-600',
    'text-blue-600',
    'text-amber-600',
    'text-indigo-600',
    'text-rose-600',
    'text-cyan-600'
  ];
  return colors[id % colors.length];
};

// In-memory cache for Student Dashboard
let cachedDashboard: StudentDashboardData | null = null;
let cachedHistory: HistoryItem[] | null = null;

export const clearHistoryCache = () => {
  cachedHistory = null;
};

export const clearDashboardCache = () => {
  cachedDashboard = null;
  clearProgressCache();
  clearHistoryCache();
};

/**
 * GET /student/dashboard
 * Dynamically queries real database endpoints and caches the combined result.
 */
export const getStudentDashboard = async (forceRefresh = false): Promise<StudentDashboardData> => {
  if (cachedDashboard && !forceRefresh) {
    return cachedDashboard;
  }

  try {
    // 1. Fetch real subjects, history, and progress stats in parallel
    const [rawSubjects, history, progress] = await Promise.all([
      getMySubjects(),
      getStudentHistory(),
      getStudentProgress(forceRefresh)
    ]);

    // 2. Map subjects with sequential numbers
    const subjects = rawSubjects.map((r: any, idx: number) => ({
      id: r.subject_id.toString(),
      name: r.subject.subject_name,
      questions: 50, // default placeholder or computed
      color: getSubjectColor(r.subject_id),
      indexNum: (idx + 1).toString().padStart(2, '0')
    }));

    // 3. Map metrics from progress stats
    const stats = progress.stats;
    const metrics: Metric[] = [
      { label: 'Số đề luyện', value: stats.totalAttempts.toString(), icon: 'local_fire_department', color: 'text-red-500', bg: 'bg-red-50' },
      { label: 'Điểm trung bình', value: stats.avgScore.toFixed(1), icon: 'star', color: 'text-amber-500', bg: 'bg-amber-50' },
      { label: 'Độ chính xác', value: `${stats.accuracy}%`, icon: 'task_alt', color: 'text-blue-500', bg: 'bg-blue-50' },
      { label: 'Thời gian học', value: stats.timeStudied || '0h', icon: 'timer', color: 'text-slate-400', bg: 'bg-slate-50' },
    ];

    // 4. Map recent activities (first 3 items from history)
    const activities = history.slice(0, 3).map((h: any) => ({
      id: h.id.toString(),
      subject: h.subject,
      time: h.date,
      score: `${h.score}/10`
    }));

    cachedDashboard = {
      subjects,
      metrics,
      activities
    };

    return cachedDashboard;
  } catch (error) {
    console.error('Failed to load student dashboard:', error);
    // Fallback if APIs fail but we have a cache
    if (cachedDashboard) {
      return cachedDashboard;
    }
    throw error;
  }
};

/**
 * Tải báo cáo PDF lịch sử ôn tập: GET /practice-attempts/export-pdf
 */
export const exportStudentHistoryPdf = async (): Promise<void> => {
  try {
    const token = localStorage.getItem('accessToken');
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

    const res = await fetch(`${API_BASE_URL}/practice-attempts/export-pdf`, {
      method: 'GET',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });

    if (!res.ok) {
      throw new Error('Failed to fetch PDF from server');
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'bao_cao_on_luyen.pdf');
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error('Failed to export PDF report:', error);
    alert('Không thể xuất báo cáo PDF lúc này!');
  }
};

/**
 * Lấy lịch sử làm bài: GET /practice-attempts/my-history
 */
export const getStudentHistory = async (forceRefresh = false): Promise<HistoryItem[]> => {
  if (cachedHistory && !forceRefresh) {
    return cachedHistory;
  }
  try {
    const res = await client.api.get('/practice-attempts/my-history');
    const dbAttempts = res.data || [];
    cachedHistory = dbAttempts.map((a: any) => {
      const score = Number(a.score || 0);
      const performance = a.status !== 'submitted'
        ? 'Đang làm'
        : score >= 8
          ? 'Xuất sắc'
          : score >= 6.5
            ? 'Giỏi'
            : score >= 5
              ? 'Khá'
              : 'Trung bình';

      return {
        id: a.attempt_id,
        practice_set_id: a.practice_set_id,
        subject: a.subject_name || 'N/A',
        date: new Date(a.started_at).toLocaleDateString('vi-VN'),
        score,
        total: (a.total_correct || 0) + (a.total_wrong || 0),
        time: a.submitted_at ? 'Hoàn thành' : '--:--',
        status: a.status === 'submitted' ? 'Đã nộp' : 'Đang làm',
        performance,
        started_at: a.started_at
      };
    });
    return cachedHistory!;
  } catch (error) {
    console.warn('Lỗi tải lịch sử:', error);
    return cachedHistory || [];
  }
};

/**
 * Lấy danh sách môn học của học sinh: GET /class-subjects/my-subjects
 */
export const getMySubjects = async (): Promise<any[]> => {
  try {
    const res = await client.api.get('/class-subjects/my-subjects');
    return res.data || [];
  } catch (error) {
    console.error('Lỗi lấy danh sách môn học', error);
    return [];
  }
}

/**
 * Setup bài làm: POST /practice-sets/generate -> POST /practice-attempts/start
 */
export const createPracticeSession = async (payload: PracticeSessionPayload): Promise<{ practiceId: string }> => {
  try {
    // 1. Generate practice set
    const setRes = await client.api.post('/practice-sets/generate', {
      subject_id: parseInt(payload.subject),
      num_questions: payload.quantity,
      difficulty: payload.level === 'Nhận biết' ? 'recognition' :
                  payload.level === 'Thông hiểu' ? 'comprehension' :
                  payload.level === 'Vận dụng' ? 'application' :
                  payload.level === 'Vận dụng cao' ? 'advanced' : 'mix'
    });
    const practiceSetId = setRes.data.practice_set_id;

    // 2. Start attempt
    const attemptRes = await client.api.post('/practice-attempts/start', {
      practice_set_id: practiceSetId
    });

    return { practiceId: attemptRes.data.attempt_id.toString() };
  } catch (error) {
    console.error('Failed to create practice session', error);
    throw error;
  }
};

/**
 * Retake: POST /practice-attempts/start
 */
export const startRetakeSession = async (practiceSetId: number): Promise<{ practiceId: string }> => {
  try {
    const attemptRes = await client.api.post('/practice-attempts/start', {
      practice_set_id: practiceSetId
    });
    clearHistoryCache();
    return { practiceId: attemptRes.data.attempt_id.toString() };
  } catch (error) {
    console.error('Failed to start retake session', error);
    throw error;
  }
};

/**
 * GET /practice-attempts/:id/questions
 */
export const getPracticeDetail = async (practiceId: string): Promise<PracticeDetail> => {
  try {
    const res = await client.api.get(`/practice-attempts/${practiceId}/questions`);
    const data = res.data;

    return {
      id: practiceId,
      subjectName: 'Bài luyện tập',
      duration: Number(data.duration_seconds || 1200),
      startedAt: data.started_at,
      questions: data.questions.map((q: any) => ({
        id: q.question_id,
        text: q.content,
        selectedOptionId: q.selected_option_id,
        options: q.options.map((o: any) => ({ id: o.option_id, text: o.option_text }))
      }))
    };
  } catch (error) {
    console.error('Failed to get practice detail', error);
    throw error;
  }
};

/**
 * POST /practice-attempts/:id/answers
 */
export const autosaveAnswers = async (practiceId: string, payload: SubmitPracticePayload): Promise<void> => {
  try {
    await client.api.post(`/practice-attempts/${practiceId}/answers`, payload);
  } catch (e) {
    console.error("Autosave failed", e);
  }
}

/**
 * POST /practice-attempts/:id/submit
 */
export const submitPractice = async (practiceId: string): Promise<SubmitPracticeResponse> => {
  try {
    await client.api.post(`/practice-attempts/${practiceId}/submit`);
    clearDashboardCache(); // Clear in-memory progress and dashboard cache
    return { success: true, resultId: practiceId };
  } catch (error) {
    console.error('Submit failed', error);
    throw error;
  }
};

/**
 * GET /practice-attempts/:id/result
 */
export const getStudentResultDetail = async (resultId: string): Promise<StudentResultData> => {
  try {
    const res = await client.api.get(`/practice-attempts/${resultId}/result`);
    const data = res.data;

    const questions = data.questions.map((q: any) => {
      // Find correct option
      const correctOpt = q.options.find((o: any) => o.is_correct);
      // Map user answer option_id to index if needed, but we'll return option_id
      return {
        text: q.content,
        options: q.options.map((o: any) => ({ id: o.option_id, text: o.option_text })),
        userAnswer: q.selected_option_id,
        correctAnswer: correctOpt ? correctOpt.option_id : 0,
        explanation: q.explanation || 'Không có giải thích.'
      };
    });

    const score = parseFloat(data.attempt.score) || 0;
    const total_q = data.attempt.total_correct + data.attempt.total_wrong;
    const acc = total_q > 0 ? (data.attempt.total_correct / total_q) * 100 : 0;

    const time = (() => {
      if (data.attempt?.started_at && data.attempt?.submitted_at) {
        const start = new Date(data.attempt.started_at).getTime();
        const end = new Date(data.attempt.submitted_at).getTime();
        const diffSeconds = Math.max(0, Math.floor((end - start) / 1000));
        const mins = Math.floor(diffSeconds / 60);
        const secs = diffSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
      return '--:--';
    })();

    return {
      overview: {
        score: score,
        total: total_q,
        time: time,
        accuracy: Math.round(acc)
      },
      questions: questions
    }
  } catch (error) {
    console.error('Failed to get result', error);
    throw error;
  }
};

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

// In-memory cache for student progress
let cachedProgress: StudentProgressData | null = null;

export const clearProgressCache = () => {
  cachedProgress = null;
};

export const getStudentProgress = async (forceRefresh = false): Promise<StudentProgressData> => {
  if (cachedProgress && !forceRefresh) {
    return cachedProgress;
  }

  try {
    const res = await client.api.get('/practice-attempts/progress');
    // Map backend success response
    cachedProgress = res.data;
    return cachedProgress!;
  } catch (error) {
    console.error('Failed to load student progress:', error);
    if (cachedProgress) {
      return cachedProgress; // Return cache as fallback if API fails
    }
    throw error;
  }
};
