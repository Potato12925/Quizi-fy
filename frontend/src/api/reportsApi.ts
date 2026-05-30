import { api } from './client';

interface BackendSuccessEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  } | null;
}

export interface ReportListMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface DashboardSummary {
  total_teachers: number;
  total_subjects: number;
  total_topics: number;
  total_documents: number;
  total_questions: number;
  total_ai_requests: number;
  pending_approvals: number;
}

export interface GroupCountItem {
  key: string;
  label: string;
  count: number;
}

export interface FilterOptionItem {
  id: number;
  name: string;
}

export interface ReportFilterOptions {
  teachers: FilterOptionItem[];
  subjects: FilterOptionItem[];
  topics: FilterOptionItem[];
}

export interface DashboardReportData {
  summary: DashboardSummary;
  questions: {
    by_status: GroupCountItem[];
    by_difficulty: GroupCountItem[];
    by_source: GroupCountItem[];
    recent: any[];
  };
  ai_requests: {
    by_status: GroupCountItem[];
    recent: any[];
  };
  documents: {
    recent: any[];
  };
  recent_activity: any[];
  recent_users: Array<{
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
  }>;
  classes_overview: Array<{
    id: number;
    code: string;
    name: string;
    owner_id: number;
    owner_name: string;
    students: number;
    status: string;
  }>;
  filter_options: ReportFilterOptions;
}

export interface ReportTableResult<T = any> {
  summary: Record<string, any>;
  table: T[];
  filter_options: ReportFilterOptions;
  meta: ReportListMeta | null;
  details?: Record<string, any>;
  missing_topic_mapping?: any[];
  topics_without_documents?: any[];
  recent_activity?: any[];
}

export interface ReportQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  teacher_id?: number;
  subject_id?: number;
  topic_id?: number;
  status?: string;
  difficulty?: string;
  source?: string;
  date_from?: string;
  date_to?: string;
  min_questions?: number;
  class_id?: number;
}

export type ReportKey =
  | 'question-summary'
  | 'ai-summary'
  | 'document-summary'
  | 'teacher-activity'
  | 'topic-coverage'
  | 'data-quality';

export type ExportFormat = 'csv' | 'xlsx' | 'pdf';
export type ClassReportExportFormat = 'docx' | 'pdf';

export interface ClassSummaryInfo {
  class_id: number;
  class_code: string;
  class_name: string;
  status: string;
  teacher_name: string;
  student_count: number;
  teacher_count: number;
  subject_count: number;
}

export interface ClassSummaryStudent {
  student_id: number;
  full_name: string;
  username: string;
  joined_at: string | null;
}

export interface ClassSummaryTeacher {
  teacher_id: number;
  teacher_name: string;
  username: string;
  role: string;
}

export interface ClassSummarySubject {
  subject_id: number;
  subject_code: string;
  subject_name: string;
  assigned_teacher_name: string;
}

export interface ClassSummaryLearningResult {
  student_id: number;
  student_name: string;
  username: string;
  attempt_count: number;
  average_score: number | null;
  total_correct: number;
  total_wrong: number;
  latest_submitted_at: string | null;
}

export interface ClassSummaryReportData {
  class_info: ClassSummaryInfo;
  students: ClassSummaryStudent[];
  teachers: ClassSummaryTeacher[];
  subjects: ClassSummarySubject[];
  learning_results: ClassSummaryLearningResult[];
  summary: {
    total_attempts: number;
    students_with_attempts: number;
  };
}

const toParamRecord = (params: ReportQueryParams = {}): Record<string, string> => {
  const entries: Array<[string, string]> = [];
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    entries.push([key, String(value)]);
  });
  return Object.fromEntries(entries);
};

export const getDashboardReport = async (params: ReportQueryParams = {}): Promise<DashboardReportData> => {
  const response = await api.get<BackendSuccessEnvelope<DashboardReportData>>('/reports/dashboard', {
    params: toParamRecord(params),
  });
  return response.data;
};

const fetchTableReport = async <T = any>(
  endpoint: string,
  params: ReportQueryParams = {},
): Promise<ReportTableResult<T>> => {
  const response = await api.get<BackendSuccessEnvelope<any>>(endpoint, {
    params: toParamRecord(params),
  });
  return {
    summary: response.data.summary ?? {},
    table: response.data.table ?? [],
    filter_options: response.data.filter_options ?? { teachers: [], subjects: [], topics: [] },
    details: response.data.details,
    missing_topic_mapping: response.data.missing_topic_mapping,
    topics_without_documents: response.data.topics_without_documents,
    recent_activity: response.data.recent_activity,
    meta: response.meta ?? null,
  };
};

export const getQuestionSummaryReport = (params: ReportQueryParams = {}) =>
  fetchTableReport('/reports/question-summary', params);

export const getAiSummaryReport = (params: ReportQueryParams = {}) =>
  fetchTableReport('/reports/ai-summary', params);

export const getDocumentSummaryReport = (params: ReportQueryParams = {}) =>
  fetchTableReport('/reports/document-summary', params);

export const getTeacherActivityReport = (params: ReportQueryParams = {}) =>
  fetchTableReport('/reports/teacher-activity', params);

export const getTopicCoverageReport = (params: ReportQueryParams = {}) =>
  fetchTableReport('/reports/topic-coverage', params);

export const getDataQualityReport = (params: ReportQueryParams = {}) =>
  fetchTableReport('/reports/data-quality', params);

export const downloadReportExport = async (
  reportKey: ReportKey,
  format: ExportFormat,
  params: ReportQueryParams = {},
): Promise<void> => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
  const token = localStorage.getItem('accessToken');
  const query = new URLSearchParams({
    ...toParamRecord(params),
    format,
  });

  const response = await fetch(`${API_BASE_URL}/reports/${reportKey}/export?${query.toString()}`, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error('Unable to export report');
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get('content-disposition') || '';
  const matched = contentDisposition.match(/filename=\"?([^\";]+)\"?/i);
  const defaultFileName = `${reportKey}.${format}`;
  const fileName = matched?.[1] || defaultFileName;

  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};

export const getClassSummaryReport = async (params: {
  class_id: number;
  date_from?: string;
  date_to?: string;
}): Promise<ClassSummaryReportData> => {
  const response = await api.get<BackendSuccessEnvelope<ClassSummaryReportData>>('/reports/class-summary', {
    params: toParamRecord(params as any),
  });
  return response.data;
};

export const downloadClassSummaryExport = async (
  classId: number,
  format: ClassReportExportFormat,
  params: { date_from?: string; date_to?: string } = {},
): Promise<void> => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
  const token = localStorage.getItem('accessToken');
  const query = new URLSearchParams({
    class_id: String(classId),
    format,
    ...toParamRecord(params),
  });

  const response = await fetch(`${API_BASE_URL}/reports/class-summary/export?${query.toString()}`, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error('Không thể xuất báo cáo lớp');
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get('content-disposition') || '';
  const matched = contentDisposition.match(/filename=\"?([^\";]+)\"?/i);
  const defaultFileName = `bao-cao-lop-${classId}.${format}`;
  const fileName = matched?.[1] || defaultFileName;

  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};
