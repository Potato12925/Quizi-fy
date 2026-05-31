import { api } from './client';

export interface TeacherSubjectItem {
  subject_id: number;
  subject_name: string;
  subject_code?: string;
}

export interface TeacherTopicItem {
  topic_id: number;
  class_subject_id: number;
  subject_id: number;
  topic_name: string;
  description?: string | null;
}

export interface SubjectWithTopicsViewModel {
  subject_id: number;
  subject_name: string;
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

const fetchTopicsBySubject = async (classSubjectId: number): Promise<TeacherTopicItem[]> => {
  const response = await api.get<ApiEnvelope<TeacherTopicItem[]>>('/topics', {
    params: {
      page: '1',
      limit: '200',
      class_subject_id: String(classSubjectId),
    },
  });
  return response.data || [];
};

export const getTeacherSubjectsWithTopics = async (): Promise<SubjectWithTopicsViewModel[]> => {
  const subjects = await fetchTeacherSubjects();
  const topicsBySubject = await Promise.all(
    subjects.map(async (subject) => {
      const topics = await fetchTopicsBySubject(subject.subject_id);
      return {
        subject_id: subject.subject_id,
        subject_name: subject.subject_name,
        topics,
      } satisfies SubjectWithTopicsViewModel;
    }),
  );

  return topicsBySubject;
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
