import { ApiError, api } from './client';

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown> | null;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export type QuestionDifficulty =
  | 'recognition'
  | 'comprehension'
  | 'application'
  | 'advanced';

export type QuestionImageInfo = {
  image_id: number;
  file_url: string;
  file_name?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
};

export interface AssignedSubject {
  class_subject_id: number;
  class_id: number;
  class_code?: string | null;
  class_name?: string | null;
  subject_id: number;
  subject_code?: string | null;
  subject_name: string;
  assigned_teacher_id?: number | null;
  topics: TopicItem[];
}

export interface TopicItem {
  topic_id: number;
  class_subject_id: number;
  subject_id: number;
  topic_name: string;
  description?: string | null;
  class_id?: number | null;
  class_code?: string | null;
  class_name?: string | null;
  subject_code?: string | null;
  subject_name?: string | null;
  assigned_teacher_id?: number | null;
}

export interface QuestionOptionItem {
  option_id: number;
  option_label: string;
  option_text: string;
  is_correct: boolean;
  order_num: number;
}

export interface TeacherQuestionBankItem {
  question_id: number;
  content: string;
  difficulty: QuestionDifficulty;
  source: string;
  status: 'draft' | 'approved' | 'inactive' | 'rejected';
  explanation?: string;
  created_at: string;
  updated_at?: string;
  document_topic_id?: number | null;
  image_id?: number | null;
  image?: QuestionImageInfo | null;
  topic_id: number;
  topic_name: string;
  class_subject_id: number;
  class_id?: number | null;
  class_code?: string | null;
  class_name?: string | null;
  subject_id: number;
  subject_code?: string | null;
  subject_name: string;
  document_id?: number | null;
  document_title?: string | null;
  options: QuestionOptionItem[];
}

export interface QuestionBankFilters {
  page?: number;
  limit?: number;
  class_subject_id?: number;
  subject_id?: number;
  topic_id?: number;
  difficulty?: QuestionDifficulty;
  status?: 'draft' | 'approved' | 'inactive' | 'rejected';
  source?: string;
  keyword?: string;
}

export interface ManualQuestionPayloadV2 {
  topic_id: number;
  image_id?: number | null;
  content: string;
  difficulty: QuestionDifficulty;
  status: 'draft' | 'approved' | 'inactive' | 'rejected';
  explanation?: string;
  options: string[];
  correct_option_index: number;
}

export const getTeacherQuestionImageErrorMessage = (
  error: unknown,
  fallback = 'Có lỗi xảy ra khi lưu dữ liệu',
) => {
  if (!(error instanceof ApiError)) return fallback;

  const errorCode = error.data?.error?.code;
  if (errorCode === 'QUESTION_IMAGE_NOT_FOUND') return 'Không tìm thấy ảnh minh họa';
  if (errorCode === 'QUESTION_IMAGE_INVALID_TYPE') return 'Ảnh không đúng loại dành cho câu hỏi';
  if (errorCode === 'QUESTION_IMAGE_FORBIDDEN') return 'Bạn không có quyền sử dụng ảnh này';

  return typeof error.data?.message === 'string' && error.data.message.trim()
    ? error.data.message
    : fallback;
};

const fetchAllPaginated = async <T>(
  endpoint: string,
  limit: number,
  params: Record<string, string> = {},
): Promise<T[]> => {
  let page = 1;
  let totalPages = 1;
  const items: T[] = [];

  while (page <= totalPages) {
    const res = await api.get<ApiEnvelope<T[]>>(endpoint, {
      params: {
        page: String(page),
        limit: String(limit),
        ...params,
      },
    });
    items.push(...(res.data || []));
    totalPages = Math.max(Number((res.meta as PaginationMeta | null | undefined)?.total_pages || 1), 1);
    page += 1;
  }

  return items;
};

export const getAssignedSubjects = async (): Promise<AssignedSubject[]> => {
  const items = await fetchAllPaginated<AssignedSubject>('/subjects', 200, {
    include_topics: 'true',
  });

  return items.map((item) => ({
    class_subject_id: item.class_subject_id,
    class_id: item.class_id,
    class_code: item.class_code ?? null,
    class_name: item.class_name ?? null,
    subject_id: item.subject_id,
    subject_code: item.subject_code ?? null,
    subject_name: item.subject_name,
    assigned_teacher_id: item.assigned_teacher_id ?? null,
    topics: (item.topics || []).map((topic) => ({
      topic_id: topic.topic_id,
      class_subject_id: topic.class_subject_id,
      subject_id: topic.subject_id,
      topic_name: topic.topic_name,
      description: topic.description ?? null,
      class_id: topic.class_id ?? null,
      class_code: topic.class_code ?? null,
      class_name: topic.class_name ?? null,
      subject_code: topic.subject_code ?? null,
      subject_name: topic.subject_name ?? null,
      assigned_teacher_id: topic.assigned_teacher_id ?? null,
    })),
  }));
};

export const getTopicsByClassSubjectId = async (classSubjectId: number): Promise<TopicItem[]> => {
  return fetchAllPaginated<TopicItem>('/topics', 200, {
    class_subject_id: String(classSubjectId),
  });
};

export const getTeacherQuestionBank = async (
  filters: QuestionBankFilters,
): Promise<{ items: TeacherQuestionBankItem[]; meta: Record<string, unknown> | null }> => {
  const params: Record<string, string> = {
    page: String(filters.page ?? 1),
    limit: String(filters.limit ?? 50),
  };
  if (filters.class_subject_id) params.class_subject_id = String(filters.class_subject_id);
  if (filters.subject_id) params.subject_id = String(filters.subject_id);
  if (filters.topic_id) params.topic_id = String(filters.topic_id);
  if (filters.difficulty) params.difficulty = filters.difficulty;
  if (filters.status) params.status = filters.status;
  if (filters.source) params.source = filters.source;
  if (filters.keyword) params.keyword = filters.keyword;

  const res = await api.get<ApiEnvelope<TeacherQuestionBankItem[]>>('/teacher/question-bank', { params });
  return { items: res.data || [], meta: res.meta || null };
};

export const createTeacherManualQuestion = async (
  payload: ManualQuestionPayloadV2,
): Promise<TeacherQuestionBankItem> => {
  const res = await api.post<ApiEnvelope<TeacherQuestionBankItem>>(
    '/teacher/question-bank/manual',
    payload,
  );
  return res.data;
};

export const updateTeacherQuestion = async (
  questionId: number,
  payload: ManualQuestionPayloadV2,
): Promise<TeacherQuestionBankItem> => {
  const res = await api.put<ApiEnvelope<TeacherQuestionBankItem>>(
    `/teacher/question-bank/${questionId}`,
    payload,
  );
  return res.data;
};

export const updateTeacherQuestionStatus = async (
  questionId: number,
  status: 'draft' | 'approved' | 'inactive' | 'rejected',
): Promise<void> => {
  await api.patch<ApiEnvelope<{ question_id: number; status: string }>>(
    `/teacher/question-bank/${questionId}/status`,
    { status },
  );
};

export const softDeleteTeacherQuestion = async (questionId: number): Promise<void> => {
  await api.delete<ApiEnvelope<{ question_id: number; deleted: boolean }>>(
    `/teacher/question-bank/${questionId}`,
  );
};
