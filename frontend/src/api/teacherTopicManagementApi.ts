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

export interface SubjectWithTopicsViewModel {
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

export interface CreateTeacherSubjectTopicRequest {
  topic_name: string;
  description?: string;
}

export interface UpdateTeacherTopicRequest {
  topic_name?: string;
  description?: string;
}

const fetchTeacherSubjects = async (): Promise<TeacherSubjectItem[]> => {
  const response = await api.get<ApiEnvelope<TeacherSubjectItem[]>>('/subjects', {
    params: {
      page: '1',
      limit: '100',
    },
  });
  return response.data || [];
};

const fetchAllTeacherTopics = async (): Promise<TeacherTopicItem[]> => {
  const response = await api.get<ApiEnvelope<TeacherTopicItem[]>>('/topics', {
    params: {
      page: '1',
      limit: '200',
    },
  });
  return response.data || [];
};

export const getTeacherSubjectsWithTopics = async (): Promise<SubjectWithTopicsViewModel[]> => {
  const [subjects, topics] = await Promise.all([fetchTeacherSubjects(), fetchAllTeacherTopics()]);
  const topicsByClassSubjectId = new Map<number, TeacherTopicItem[]>();

  for (const topic of topics) {
    const existing = topicsByClassSubjectId.get(topic.class_subject_id) || [];
    existing.push(topic);
    topicsByClassSubjectId.set(topic.class_subject_id, existing);
  }

  return subjects.map((subject) => ({
    subject_id: subject.subject_id,
    subject_name: subject.subject_name,
    subject_code: subject.subject_code ?? null,
    class_subject_id: subject.class_subject_id,
    class_id: subject.class_id ?? null,
    class_code: subject.class_code ?? null,
    class_name: subject.class_name ?? null,
    assigned_teacher_id: subject.assigned_teacher_id ?? null,
    topics: subject.class_subject_id ? (topicsByClassSubjectId.get(subject.class_subject_id) || []) : [],
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
  const response = await api.get<ApiEnvelope<TeacherTopicItem[]>>('/topics', {
    params: {
      page: '1',
      limit: '200',
      class_subject_id: String(classSubjectId),
    },
  });
  return {
    items: response.data || [],
    meta: (response.meta as TopicPaginationMeta | null) || null,
  };
};
