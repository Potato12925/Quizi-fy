import { api } from './client';

export interface TeacherSubjectItem {
  subject_id: number;
  subject_name: string;
  subject_code?: string | null;
  class_subject_id: number | null;
  class_id?: number | null;
  class_code?: string | null;
  class_name?: string | null;
  assigned_teacher_id?: number | null;
  topics?: TeacherTopicItem[];
}

export interface TeacherTopicItem {
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

export interface TeacherClassSubjectItem {
  subject_id: number;
  subject_name: string;
  subject_code?: string | null;
  class_subject_id: number | null;
  class_id?: number | null;
  class_code?: string | null;
  class_name?: string | null;
  assigned_teacher_id?: number | null;
  topics: TeacherTopicItem[];
}

export type SubjectWithTopicsViewModel = TeacherClassSubjectItem;

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown> | null;
}

interface TopicPaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

const DEFAULT_SUBJECT_PAGE_SIZE = 200;

export interface CreateTeacherSubjectTopicRequest {
  topic_name: string;
  description?: string;
}

export interface UpdateTeacherTopicRequest {
  topic_name?: string;
  description?: string;
}

const fetchAllPaginated = async <T>(
  endpoint: string,
  limit: number,
  params: Record<string, string> = {},
): Promise<T[]> => {
  let page = 1;
  let totalPages = 1;
  const items: T[] = [];

  while (page <= totalPages) {
    const response = await api.get<ApiEnvelope<T[]>>(endpoint, {
      params: {
        page: String(page),
        limit: String(limit),
        ...params,
      },
    });

    items.push(...(response.data || []));

    const meta = response.meta as TopicPaginationMeta | null | undefined;
    totalPages = Math.max(meta?.total_pages || 1, 1);
    page += 1;
  }

  return items;
};

const fetchTeacherSubjects = async (): Promise<TeacherSubjectItem[]> => {
  return fetchAllPaginated<TeacherSubjectItem>('/subjects', DEFAULT_SUBJECT_PAGE_SIZE, {
    include_topics: 'true',
  });
};

export const getTeacherSubjectsWithTopics = async (): Promise<TeacherClassSubjectItem[]> => {
  const subjects = await fetchTeacherSubjects();
  return subjects.map((subject) => ({
    subject_id: subject.subject_id,
    subject_name: subject.subject_name,
    subject_code: subject.subject_code ?? null,
    class_subject_id: subject.class_subject_id,
    class_id: subject.class_id ?? null,
    class_code: subject.class_code ?? null,
    class_name: subject.class_name ?? null,
    assigned_teacher_id: subject.assigned_teacher_id ?? null,
    topics: (subject.topics || []).map((topic) => ({
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

export const createTopicForTeacherSubject = async (
  classSubjectId: number,
  payload: CreateTeacherSubjectTopicRequest,
): Promise<TeacherTopicItem> => {
  const response = await api.post<ApiEnvelope<TeacherTopicItem>>('/topics', {
    class_subject_id: classSubjectId,
    topic_name: payload.topic_name,
    description: payload.description,
  });
  return response.data;
};

export const updateTeacherSubjectTopic = async (
  topicId: number,
  payload: UpdateTeacherTopicRequest,
): Promise<TeacherTopicItem> => {
  const response = await api.put<ApiEnvelope<TeacherTopicItem>>(`/topics/${topicId}`, payload);
  return response.data;
};

export const softDeleteTeacherSubjectTopic = async (topicId: number): Promise<void> => {
  await api.delete(`/topics/${topicId}`);
};

export const getTeacherTopicsBySubject = async (
  classSubjectId: number,
): Promise<{ items: TeacherTopicItem[]; meta: TopicPaginationMeta | null }> => {
  const items = await fetchAllPaginated<TeacherTopicItem>('/topics', 200, {
    class_subject_id: String(classSubjectId),
  });
  return {
    items,
    meta: null,
  };
};
