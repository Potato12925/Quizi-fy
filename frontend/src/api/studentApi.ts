import * as client from './client';

// UI Models
export default interface SubjectStat {
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


/**
 * GET /student/dashboard
 * Mocked because we don't have a dedicated dashboard endpoint yet.
 */
export const getStudentDashboard = async (): Promise<StudentDashboardData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        subjects: [
          { id: '1', name: 'Mạng máy tính', questions: 150, color: 'text-[#b20112]', icon: 'language' },
          { id: '2', name: 'Cấu trúc dữ liệu', questions: 200, color: 'text-emerald-600', icon: 'account_tree' },
        ],
        metrics: [
          { label: 'Hoàn thành', value: '85%', icon: 'task_alt', color: 'text-blue-500', bg: 'bg-blue-50' },
        ],
        activities: []
      });
    }, 500);
  });
};

/**
 * Lấy lịch sử làm bài: GET /practice-attempts/my-history
 */
export const getStudentHistory = async (): Promise<HistoryItem[]> => {
  try {
    const res = await client.api.get('/practice-attempts/my-history');
    const dbAttempts = res.data || [];
    return dbAttempts.map((a: any) => ({
      id: a.attempt_id,
      subject: a.subject_name || 'N/A',
      date: new Date(a.started_at).toLocaleDateString('vi-VN'),
      score: a.score || 0,
      total: (a.total_correct || 0) + (a.total_wrong || 0),
      time: a.submitted_at ? 'Hoàn thành' : '--:--',
      status: a.status === 'submitted' ? 'Đã nộp' : 'Đang làm',
    }));
  } catch (error) {
    console.warn('Lỗi tải lịch sử:', error);
    return [];
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
      difficulty: payload.level === 'Dễ' ? 'easy' : payload.level === 'Khó' ? 'hard' : 'medium'
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
 * GET /practice-attempts/:id/questions
 */
export const getPracticeDetail = async (practiceId: string): Promise<PracticeDetail> => {
  try {
    const res = await client.api.get(`/practice-attempts/${practiceId}/questions`);
    const data = res.data;

    return {
      id: practiceId,
      subjectName: 'Bài luyện tập',
      duration: 1200,
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

    return {
      overview: {
        score: score,
        total: total_q,
        time: '--:--',
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

export const getStudentProgress = async (): Promise<StudentProgressData> => {
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
          ]
        });
      }, 500);
    });
};
