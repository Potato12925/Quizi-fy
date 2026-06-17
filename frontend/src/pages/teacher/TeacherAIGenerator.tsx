import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  confirmTeacherAiRequestReview,
  createTeacherAiRequest,
  getTeacherAiRequestQuestions,
  getTeacherAiRequests,
  getTeacherAssignedSubjects,
  getTeacherDocumentsBySubjectTopic,
  getTeacherTopicsBySubjectId,
  retryTeacherAiRequest,
  type Difficulty,
  type QuestionStatus,
  type TeacherAiQuestionItem,
  type TeacherAiRequestItem,
  type TeacherAssignedSubject,
  type TeacherDocumentTopicOption,
  type TeacherTopicItem,
} from '@/api/teacherAIGeneratorApi';

type ReviewableStatus = Extract<QuestionStatus, 'draft' | 'approved' | 'rejected'>;

interface EditableOption {
  option_id: number;
  option_text: string;
  is_correct: boolean;
  order_num: number;
  option_label: string;
}

interface EditableQuestion {
  question_id: number;
  content: string;
  explanation: string;
  difficulty: Difficulty;
  status: QuestionStatus;
  options: EditableOption[];
}

const pageCardClass = 'rounded-[2.5rem] border border-slate-100 bg-white shadow-sm';
const inputClass = 'mt-2 w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition-all focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400';
const badgeClass = 'inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest';

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN');
};

const formatFileSize = (bytes?: number | null) => {
  if (!bytes || bytes <= 0) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const getDifficultyLabel = (difficulty: Difficulty) => {
  if (difficulty === 'easy') return 'Dễ';
  if (difficulty === 'hard') return 'Khó';
  return 'Trung bình';
};

const getRequestStatusBadge = (status: TeacherAiRequestItem['status']) => {
  if (status === 'completed') return { label: 'Hoàn tất', cls: 'bg-emerald-50 text-emerald-600' };
  if (status === 'failed') return { label: 'Thất bại', cls: 'bg-red-50 text-[var(--color-primary)]' };
  if (status === 'processing') return { label: 'Đang xử lý', cls: 'bg-amber-50 text-amber-600' };
  if (status === 'pending') return { label: 'Đang chờ', cls: 'bg-slate-100 text-slate-600' };
  return { label: 'Đã hủy', cls: 'bg-slate-200 text-slate-600' };
};

const getQuestionStatusBadge = (status: QuestionStatus) => {
  if (status === 'approved') return { label: 'Đã duyệt', cls: 'bg-emerald-50 text-emerald-600' };
  if (status === 'rejected') return { label: 'Từ chối', cls: 'bg-red-50 text-[var(--color-primary)]' };
  if (status === 'inactive') return { label: 'Ẩn', cls: 'bg-slate-200 text-slate-600' };
  return { label: 'Bản nháp', cls: 'bg-amber-50 text-amber-600' };
};

const getProgressPercent = (generated: number, total: number) => {
  if (total <= 0) return 0;
  const raw = Math.round((generated / total) * 100);
  return Math.max(0, Math.min(raw, 100));
};

const getRequestProgressDetail = (request: TeacherAiRequestItem) => {
  const generated = Math.max(0, request.generated_question_count || 0);
  const target = Math.max(0, request.num_questions || 0);
  const progressPercent =
    request.status === 'completed'
      ? 100
      : getProgressPercent(generated, target);

  if (request.status === 'pending') {
    return {
      stepLabel: 'Bước 1/3: Đang xếp hàng xử lý',
      detail: 'Yêu cầu đã được ghi nhận và đang chờ hệ thống AI tiếp nhận.',
      progressPercent: Math.min(progressPercent, 10),
    };
  }

  if (request.status === 'processing') {
    return {
      stepLabel: 'Bước 2/3: AI đang tạo câu hỏi',
      detail: `Đã tạo ${generated}/${target} câu hỏi.`,
      progressPercent: Math.max(progressPercent, 10),
    };
  }

  if (request.status === 'completed') {
    return {
      stepLabel: 'Bước 3/3: Hoàn tất tạo câu hỏi',
      detail: `Đã tạo thành công ${generated}/${target} câu hỏi.`,
      progressPercent: 100,
    };
  }

  return {
    stepLabel: 'Quy trình kết thúc',
    detail: request.error_message || 'Yêu cầu đã dừng xử lý.',
    progressPercent,
  };
};

const mapQuestionToEditable = (question: TeacherAiQuestionItem, readOnly: boolean): EditableQuestion => {
  const normalizedStatus = !readOnly && question.status === 'inactive' ? 'draft' : question.status;
  const sortedOptions = [...question.options]
    .sort((a, b) => (a.order_num ?? 0) - (b.order_num ?? 0))
    .map((option, index) => ({
      option_id: option.option_id,
      option_text: option.option_text || '',
      is_correct: !!option.is_correct,
      order_num: index + 1,
      option_label: String.fromCharCode(65 + index),
    }));

  return {
    question_id: question.question_id,
    content: question.content || '',
    explanation: question.explanation || '',
    difficulty: question.difficulty,
    status: normalizedStatus,
    options: sortedOptions,
  };
};

export default function TeacherAIGeneratorPage() {
  const location = useLocation();
  const preselectedDocumentId = Number(location.state?.documentId || 0) || null;

  const [subjects, setSubjects] = useState<TeacherAssignedSubject[]>([]);
  const [topics, setTopics] = useState<TeacherTopicItem[]>([]);
  const [documents, setDocuments] = useState<TeacherDocumentTopicOption[]>([]);
  const [requests, setRequests] = useState<TeacherAiRequestItem[]>([]);

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [refreshingRequests, setRefreshingRequests] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [retryingRequestId, setRetryingRequestId] = useState<number | null>(null);

  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [topicId, setTopicId] = useState<number | null>(null);
  const [documentId, setDocumentId] = useState<number | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [contentScope, setContentScope] = useState('');
  const [pendingAutoOpenRequestId, setPendingAutoOpenRequestId] = useState<number | null>(null);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRequest, setReviewRequest] = useState<TeacherAiRequestItem | null>(null);
  const [reviewReadOnly, setReviewReadOnly] = useState(false);
  const [reviewQuestions, setReviewQuestions] = useState<EditableQuestion[]>([]);
  const [loadingReviewQuestions, setLoadingReviewQuestions] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const selectedDocumentTopic = useMemo(
    () => documents.find((item) => item.document_id === documentId) || null,
    [documentId, documents],
  );

  const activeRequests = useMemo(
    () => requests.filter((item) => item.status === 'pending' || item.status === 'processing'),
    [requests],
  );
  const hasGeneratingRequest = activeRequests.length > 0;

  const contextHasActiveRequest = useMemo(() => {
    if (!selectedDocumentTopic) return false;
    return requests.some(
      (item) =>
        item.document_topic_id === selectedDocumentTopic.document_topic_id
        && (item.status === 'pending' || item.status === 'processing'),
    );
  }, [requests, selectedDocumentTopic]);

  const hasInvalidQuestionCount = !Number.isInteger(numQuestions) || numQuestions < 1 || numQuestions > 100;
  const isCreateRequestDisabled = !selectedDocumentTopic
    || !subjectId
    || !topicId
    || hasInvalidQuestionCount
    || submittingRequest
    || contextHasActiveRequest
    || hasGeneratingRequest;

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const closeReviewModal = () => {
    setReviewModalOpen(false);
    setReviewRequest(null);
    setReviewQuestions([]);
    setReviewError('');
    setLoadingReviewQuestions(false);
    setSubmittingReview(false);
  };

  const loadRequests = async (silent = false): Promise<TeacherAiRequestItem[]> => {
    if (!silent) setRefreshingRequests(true);
    try {
      const response = await getTeacherAiRequests(1, 100);
      const items = response.items || [];
      setRequests(items);
      setSelectedRequestId((prev) => {
        if (prev && items.some((item) => item.request_id === prev)) return prev;
        return items[0]?.request_id ?? null;
      });
      return items;
    } finally {
      if (!silent) setRefreshingRequests(false);
    }
  };

  const loadTopicsBySubject = async (nextSubjectId: number): Promise<TeacherTopicItem[]> => {
    setLoadingTopics(true);
    try {
      const rows = await getTeacherTopicsBySubjectId(nextSubjectId);
      setTopics(rows);
      return rows;
    } finally {
      setLoadingTopics(false);
    }
  };

  const loadDocumentsByTopic = async (
    nextSubjectId: number,
    nextTopicId: number,
  ): Promise<TeacherDocumentTopicOption[]> => {
    setLoadingDocuments(true);
    try {
      const rows = await getTeacherDocumentsBySubjectTopic(nextSubjectId, nextTopicId);
      setDocuments(rows);
      return rows;
    } finally {
      setLoadingDocuments(false);
    }
  };

  const openReviewModal = async (request: TeacherAiRequestItem) => {
    clearMessages();
    setReviewError('');
    setReviewRequest(request);
    setReviewReadOnly(Boolean(request.is_reviewed));
    setReviewModalOpen(true);
    setLoadingReviewQuestions(true);
    try {
      const rows = await getTeacherAiRequestQuestions(request.request_id);
      setReviewQuestions(rows.map((item) => mapQuestionToEditable(item, Boolean(request.is_reviewed))));
      setSelectedRequestId(request.request_id);
    } catch (caught: unknown) {
      setReviewError(caught instanceof Error ? caught.message : 'Không thể tải danh sách câu hỏi của job này.');
    } finally {
      setLoadingReviewQuestions(false);
    }
  };

  const bootstrapPage = async () => {
    setLoadingInitial(true);
    clearMessages();
    try {
      const assignedSubjects = await getTeacherAssignedSubjects();
      setSubjects(assignedSubjects);

      await loadRequests(true);

      if (!assignedSubjects.length) {
        setSubjectId(null);
        setTopicId(null);
        setDocumentId(null);
        return;
      }

      const initialSubjectId = assignedSubjects[0].subject_id;
      setSubjectId(initialSubjectId);

      const subjectTopics = await getTeacherTopicsBySubjectId(initialSubjectId);
      setTopics(subjectTopics);

      if (!subjectTopics.length) {
        setTopicId(null);
        setDocumentId(null);
        return;
      }

      let resolvedTopicId: number | null = subjectTopics[0].topic_id;
      let resolvedDocuments = await getTeacherDocumentsBySubjectTopic(initialSubjectId, resolvedTopicId);

      if (preselectedDocumentId) {
        const matchedRows = await Promise.all(
          subjectTopics.map(async (topic) => ({
            topic_id: topic.topic_id,
            rows: await getTeacherDocumentsBySubjectTopic(initialSubjectId, topic.topic_id),
          })),
        );
        const hit = matchedRows.find((item) => item.rows.some((row) => row.document_id === preselectedDocumentId));
        if (hit) {
          resolvedTopicId = hit.topic_id;
          resolvedDocuments = hit.rows;
        }
      }

      setTopicId(resolvedTopicId);
      setDocuments(resolvedDocuments);
      if (!resolvedDocuments.length) {
        setDocumentId(null);
        return;
      }

      const preferredDocument = resolvedDocuments.find((item) => item.document_id === preselectedDocumentId);
      setDocumentId(preferredDocument?.document_id ?? resolvedDocuments[0].document_id);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Không thể tải dữ liệu AI Generator.');
    } finally {
      setLoadingInitial(false);
      setRefreshingRequests(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    bootstrapPage().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeRequests.length && !pendingAutoOpenRequestId) return;
    const timer = window.setInterval(() => {
      loadRequests(true)
        .then((items) => {
          if (!pendingAutoOpenRequestId) return;
          const target = items.find((item) => item.request_id === pendingAutoOpenRequestId);
          if (!target) return;
          if (target.status === 'completed') {
            setPendingAutoOpenRequestId(null);
            if (!target.is_reviewed) {
              openReviewModal(target).catch(() => undefined);
            }
          }
          if (target.status === 'failed' || target.status === 'cancelled') {
            setPendingAutoOpenRequestId(null);
          }
        })
        .catch(() => undefined);
    }, 7000);

    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRequests.length, pendingAutoOpenRequestId]);

  const handleSubjectChange = async (nextSubjectId: number) => {
    clearMessages();
    setSubjectId(nextSubjectId);
    setTopicId(null);
    setDocumentId(null);
    setTopics([]);
    setDocuments([]);
    const nextTopics = await loadTopicsBySubject(nextSubjectId);
    const defaultTopicId = nextTopics[0]?.topic_id ?? null;
    setTopicId(defaultTopicId);
    if (!defaultTopicId) return;

    const nextDocuments = await loadDocumentsByTopic(nextSubjectId, defaultTopicId);
    setDocumentId(nextDocuments[0]?.document_id ?? null);
  };

  const handleTopicChange = async (nextTopicId: number) => {
    clearMessages();
    setTopicId(nextTopicId);
    setDocumentId(null);
    setDocuments([]);
    if (!subjectId) return;
    const nextDocuments = await loadDocumentsByTopic(subjectId, nextTopicId);
    setDocumentId(nextDocuments[0]?.document_id ?? null);
  };

  const handleCreateRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    clearMessages();

    if (!selectedDocumentTopic || !subjectId || !topicId) {
      setError('Vui lòng chọn đủ môn học, chủ đề và tài liệu trước khi tạo yêu cầu.');
      return;
    }

    if (hasGeneratingRequest) {
      setError('Đang có job AI pending/processing. Vui lòng chờ hoàn tất trước khi tạo job mới.');
      return;
    }

    setSubmittingRequest(true);
    try {
      const created = await createTeacherAiRequest({
        document_topic_id: selectedDocumentTopic.document_topic_id,
        num_questions: numQuestions,
        difficulty,
        content_scope: contentScope.trim() || undefined,
      });
      await loadRequests(true);
      setSelectedRequestId(created.request_id);
      setPendingAutoOpenRequestId(created.request_id);
      setSuccess('Đã tạo job AI thành công. Khi hoàn tất hệ thống sẽ mở popup rà soát câu hỏi.');
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Không thể tạo yêu cầu AI.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleRetryRequest = async (requestId: number) => {
    clearMessages();
    setRetryingRequestId(requestId);
    try {
      await retryTeacherAiRequest(requestId);
      await loadRequests(true);
      setSelectedRequestId(requestId);
      setPendingAutoOpenRequestId(requestId);
      setSuccess(`Đã gửi retry cho job #${requestId}.`);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Không thể retry job AI.');
    } finally {
      setRetryingRequestId(null);
    }
  };

  const updateQuestionField = (questionId: number, patch: Partial<EditableQuestion>) => {
    setReviewQuestions((prev) =>
      prev.map((item) => (item.question_id === questionId ? { ...item, ...patch } : item)),
    );
  };

  const updateOptionText = (questionId: number, optionIndex: number, nextText: string) => {
    setReviewQuestions((prev) =>
      prev.map((question) => {
        if (question.question_id !== questionId) return question;
        const nextOptions = question.options.map((option, index) =>
          index === optionIndex ? { ...option, option_text: nextText } : option,
        );
        return { ...question, options: nextOptions };
      }),
    );
  };

  const setCorrectOption = (questionId: number, optionIndex: number) => {
    setReviewQuestions((prev) =>
      prev.map((question) => {
        if (question.question_id !== questionId) return question;
        const nextOptions = question.options.map((option, index) => ({ ...option, is_correct: index === optionIndex }));
        return { ...question, options: nextOptions };
      }),
    );
  };

  const moveOption = (questionId: number, optionIndex: number, direction: -1 | 1) => {
    setReviewQuestions((prev) =>
      prev.map((question) => {
        if (question.question_id !== questionId) return question;
        const nextIndex = optionIndex + direction;
        if (nextIndex < 0 || nextIndex >= question.options.length) return question;

        const nextOptions = [...question.options];
        const temp = nextOptions[optionIndex];
        nextOptions[optionIndex] = nextOptions[nextIndex];
        nextOptions[nextIndex] = temp;

        const normalized = nextOptions.map((item, index) => ({
          ...item,
          order_num: index + 1,
          option_label: String.fromCharCode(65 + index),
        }));
        return { ...question, options: normalized };
      }),
    );
  };

  const handleConfirmReview = async () => {
    if (!reviewRequest || reviewReadOnly || submittingReview) return;
    setReviewError('');

    for (const question of reviewQuestions) {
      if (!question.content.trim()) {
        setReviewError(`Nội dung câu hỏi #${question.question_id} không được để trống.`);
        return;
      }
      if (question.status === 'inactive') {
        setReviewError(`Câu hỏi #${question.question_id} đang ở trạng thái không hợp lệ. Hãy chuyển sang nháp/duyệt/từ chối.`);
        return;
      }
      if (question.options.length !== 4) {
        setReviewError(`Câu hỏi #${question.question_id} phải có đúng 4 đáp án.`);
        return;
      }
      const hasEmptyOption = question.options.some((option) => !option.option_text.trim());
      if (hasEmptyOption) {
        setReviewError(`Câu hỏi #${question.question_id} có đáp án trống.`);
        return;
      }
      const correctCount = question.options.filter((option) => option.is_correct).length;
      if (correctCount !== 1) {
        setReviewError(`Câu hỏi #${question.question_id} phải có đúng 1 đáp án đúng.`);
        return;
      }
    }

    setSubmittingReview(true);
    try {
      const payload = {
        questions: reviewQuestions.map((question) => ({
          question_id: question.question_id,
          content: question.content.trim(),
          difficulty: question.difficulty,
          status: question.status as ReviewableStatus,
          explanation: question.explanation.trim() || null,
          options: question.options.map((option, index) => ({
            option_text: option.option_text.trim(),
            order_num: index + 1,
            is_correct: option.is_correct,
          })),
        })),
      };

      const result = await confirmTeacherAiRequestReview(reviewRequest.request_id, payload);
      setSuccess('Đã xác nhận rà soát câu hỏi AI thành công.');
      setRequests((prev) =>
        prev.map((item) =>
          item.request_id === reviewRequest.request_id
            ? {
              ...item,
              ...result.request,
            }
            : item,
        ),
      );
      closeReviewModal();
    } catch (caught: unknown) {
      const message = caught instanceof Error ? caught.message : 'Không thể xác nhận rà soát câu hỏi.';
      setReviewError(message);
      if (message.toLowerCase().includes('already reviewed')) {
        setReviewReadOnly(true);
        await loadRequests(true);
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="min-h-[55vh] flex items-center justify-center">
        <div className="w-full max-w-2xl p-12 text-center bg-white border border-slate-100 shadow-sm rounded-[2.5rem]">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-5 rounded-2xl bg-slate-100 text-slate-500">
            <span className="material-symbols-outlined animate-spin">sync</span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Tạo câu hỏi bằng AI</p>
          <p className="mt-3 text-sm font-bold text-slate-600">Đang tải dữ liệu, vui lòng chờ trong giây lát...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 space-y-10 duration-700 animate-in fade-in slide-in-from-bottom-8">
      <section className="flex flex-col items-start justify-between gap-6 pt-2 xl:flex-row xl:items-end">
        <div>
          <p className="mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Tạo câu hỏi bằng AI</p>
          <h1 className="text-5xl italic font-black leading-none tracking-tighter uppercase text-slate-900 lg:text-6xl">
            Tạo bộ <br />
            <span className="text-[var(--color-primary)]">câu hỏi bằng AI</span>
          </h1>
          <p className="mt-4 font-medium text-slate-500">Quản lý quá trình và rà soát câu hỏi sinh tự động.</p>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-[var(--color-primary)]">
          {error}
        </div>
      )}
      {success && (
        <div className="px-5 py-4 text-sm font-bold border rounded-2xl border-emerald-100 bg-emerald-50 text-emerald-700">
          {success}
        </div>
      )}

      <section className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-7">
          <div className={`${pageCardClass} p-8`}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h3 className="text-xl font-black tracking-tight uppercase text-slate-900">Danh sách việc tạo câu hỏi AI</h3>
              <button
                type="button"
                onClick={() => loadRequests(false).catch(() => undefined)}
                disabled={refreshingRequests}
                className="rounded-xl border border-slate-200 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all hover:border-slate-300 hover:text-slate-800 disabled:opacity-50"
              >
                {refreshingRequests ? 'Đang làm mới...' : 'Làm mới'}
              </button>
            </div>

            {!requests.length ? (
              <div className="border-4 border-dashed border-slate-100 rounded-[2rem] p-10 text-center">
                <p className="text-sm font-black tracking-widest uppercase text-slate-400">Chưa có việc tạo câu hỏi AI nào</p>
                <p className="mt-2 text-xs font-bold text-slate-400">Tạo yêu cầu để bắt đầu.</p>
              </div>
            ) : (
              <div className="max-h-[820px] space-y-3 overflow-auto pr-1">
                {requests.map((item) => {
                  const badge = getRequestStatusBadge(item.status);
                  const progress = getRequestProgressDetail(item);
                  const isSelected = selectedRequestId === item.request_id;
                  return (
                    <article
                      key={item.request_id}
                      className={`rounded-[1.75rem] border p-5 transition-all ${
                        isSelected
                          ? 'border-[var(--color-primary)] bg-red-50/20 shadow-md shadow-red-900/5'
                          : 'border-slate-100 bg-slate-50/60 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <p className="text-sm font-black text-slate-900">Job #{item.request_id}</p>
                        <span className={`${badgeClass} ${badge.cls}`}>{badge.label}</span>
                      </div>

                      <p className="text-xs font-black text-slate-700">
                        {item.document_topic.subject_name} → {item.document_topic.topic_name}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-600">{item.document_topic.document_title}</p>
                      <p className="mt-2 text-[11px] font-bold text-slate-500">
                        {item.num_questions} câu | {getDifficultyLabel(item.difficulty)} | Sinh được: {item.generated_question_count}
                      </p>
                      {(item.status === 'pending' || item.status === 'processing' || item.status === 'completed') && (
                        <div className="px-3 py-2 mt-2 bg-white border rounded-xl border-slate-200">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{progress.stepLabel}</p>
                          <p className="mt-1 text-xs font-bold text-slate-500">{progress.detail}</p>
                          <div className="w-full h-2 mt-2 rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-[var(--color-primary)] transition-all"
                              style={{ width: `${progress.progressPercent}%` }}
                            />
                          </div>
                          <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Tiến độ: {progress.progressPercent}%
                          </p>
                        </div>
                      )}
                      <p className="mt-1 text-[11px] font-bold text-slate-400">Tạo lúc: {formatDateTime(item.created_at)}</p>
                      {item.is_reviewed && <p className="mt-1 text-[11px] font-bold text-emerald-600">Đã rà soát</p>}
                      {item.error_message && <p className="mt-2 text-xs font-black text-[var(--color-primary)]">Lỗi: {item.error_message}</p>}

                      <div className="flex flex-wrap gap-2 mt-4">
                        {item.status === 'completed' ? (
                          <button
                            type="button"
                            onClick={() => openReviewModal(item).catch(() => undefined)}
                            className="rounded-xl bg-slate-900 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-black"
                          >
                            {item.is_reviewed ? 'Xem câu hỏi' : 'Rà soát câu hỏi'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedRequestId(item.request_id)}
                            className="rounded-xl bg-slate-900 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-black"
                          >
                            Theo dõi
                          </button>
                        )}
                        {item.status === 'failed' && (
                          <button
                            type="button"
                            disabled={retryingRequestId === item.request_id}
                            onClick={() => handleRetryRequest(item.request_id)}
                            className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-[var(--color-primary-dark)] disabled:opacity-50"
                          >
                            {retryingRequestId === item.request_id ? 'Đang gửi retry...' : 'Retry job'}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6 xl:col-span-5">
          <section className={`${pageCardClass} p-8 lg:p-10`}>
            <h2 className="text-3xl italic font-black tracking-tight uppercase text-slate-900">Tạo yêu cầu AI</h2>

            <form className="mt-8 space-y-6" onSubmit={handleCreateRequest}>
              <div className="grid gap-5">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Môn học</label>
                  <select
                    className={inputClass}
                    value={subjectId ?? ''}
                    onChange={(event) => handleSubjectChange(Number(event.target.value))}
                    disabled={!subjects.length || hasGeneratingRequest}
                  >
                    {!subjects.length && <option value="">Không có môn học được phân công</option>}
                    {subjects.map((item) => (
                      <option key={item.subject_id} value={item.subject_id}>
                        {item.subject_name} ({item.subject_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Chủ đề</label>
                  <select
                    className={inputClass}
                    value={topicId ?? ''}
                    onChange={(event) => handleTopicChange(Number(event.target.value))}
                    disabled={!subjectId || loadingTopics || !topics.length || hasGeneratingRequest}
                  >
                    {!subjectId && <option value="">Vui lòng chọn môn học trước</option>}
                    {subjectId && !topics.length && <option value="">Không có chủ đề cho môn học này</option>}
                    {topics.map((item) => (
                      <option key={item.topic_id} value={item.topic_id}>
                        {item.topic_name}
                      </option>
                    ))}
                  </select>
                  {loadingTopics && <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Đang tải chủ đề...</p>}
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tài liệu</label>
                  <select
                    className={inputClass}
                    value={documentId ?? ''}
                    onChange={(event) => setDocumentId(Number(event.target.value))}
                    disabled={!topicId || loadingDocuments || !documents.length || hasGeneratingRequest}
                  >
                    {!topicId && <option value="">Vui lòng chọn chủ đề trước</option>}
                    {topicId && !documents.length && <option value="">Không có tài liệu phù hợp</option>}
                    {documents.map((item) => (
                      <option key={item.document_topic_id} value={item.document_id}>
                        {item.document_title}
                      </option>
                    ))}
                  </select>
                  {loadingDocuments && <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Đang tải tài liệu...</p>}
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Số lượng câu hỏi</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={numQuestions}
                    onChange={(event) => setNumQuestions(Number(event.target.value))}
                    className={inputClass}
                    disabled={hasGeneratingRequest}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Độ khó</label>
                  <select
                    className={inputClass}
                    value={difficulty}
                    onChange={(event) => setDifficulty(event.target.value as Difficulty)}
                    disabled={hasGeneratingRequest}
                  >
                    <option value="easy">Dễ</option>
                    <option value="medium">Trung bình</option>
                    <option value="hard">Khó</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Phạm vi nội dung (tùy chọn)</label>
                <textarea
                  rows={3}
                  className={inputClass}
                  value={contentScope}
                  onChange={(event) => setContentScope(event.target.value)}
                  disabled={hasGeneratingRequest}
                  placeholder="Ví dụ: Chỉ chương 2 và chương 3, tập trung phần định nghĩa và công thức quan trọng"
                />
              </div>

              {selectedDocumentTopic && (
                <div className="px-5 py-4 text-xs font-bold border rounded-2xl border-slate-100 bg-slate-50 text-slate-600">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tài liệu đã chọn</p>
                  <p className="mt-3 text-sm font-black text-slate-800">{selectedDocumentTopic.document_title}</p>
                  <p className="mt-2">{selectedDocumentTopic.topic_name} | {selectedDocumentTopic.subject_name}</p>
                  <p className="mt-1">
                    Định dạng: {selectedDocumentTopic.file_type || '-'} | Dung lượng: {formatFileSize(selectedDocumentTopic.file_size)} | Trạng thái: {selectedDocumentTopic.status || '-'}
                  </p>
                  <p className="mt-1">Tạo lúc: {formatDateTime(selectedDocumentTopic.created_at)}</p>
                </div>
              )}

              {hasGeneratingRequest && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">
                  Đang có job AI pending/processing. Tạm khóa tạo mới cho tới khi job hiện tại hoàn tất.
                </div>
              )}

              <div className="pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isCreateRequestDisabled}
                  className="bg-[var(--color-primary)] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-900/20 hover:bg-[var(--color-primary-dark)] transition-all disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submittingRequest ? 'Đang gửi yêu cầu...' : 'Tạo job AI'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </section>

      {reviewModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !submittingReview && closeReviewModal()} />
          <div className="relative z-10 w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-2xl">
            <div className="flex flex-wrap items-start justify-between gap-4 px-8 py-6 border-b border-slate-100 bg-slate-50/70">
              <div>
                <h3 className="text-2xl font-black tracking-tight uppercase text-slate-900">Rà soát câu hỏi AI đã sinh</h3>
                {reviewRequest && (
                  <p className="mt-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
                    Job #{reviewRequest.request_id} {reviewReadOnly ? '| Chế độ chỉ xem' : '| Chế độ chỉnh sửa'}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={closeReviewModal}
                disabled={submittingReview}
                className="transition-all h-11 w-11 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[calc(92vh-150px)] overflow-auto px-8 py-6 space-y-4">
              {reviewError && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-[var(--color-primary)]">
                  {reviewError}
                </div>
              )}

              {loadingReviewQuestions ? (
                <div className="border-4 border-dashed border-slate-100 rounded-[2rem] p-12 text-center">
                  <p className="text-sm font-black tracking-widest uppercase text-slate-400">Đang tải câu hỏi...</p>
                </div>
              ) : reviewQuestions.length === 0 ? (
                <div className="border-4 border-dashed border-slate-100 rounded-[2rem] p-12 text-center">
                  <p className="text-sm font-black tracking-widest uppercase text-slate-400">Job này chưa có câu hỏi khả dụng.</p>
                </div>
              ) : (
                reviewQuestions.map((question, questionIndex) => {
                  const statusBadge = getQuestionStatusBadge(question.status);
                  return (
                    <article key={question.question_id} className="rounded-[1.75rem] border border-slate-100 bg-slate-50/60 p-5 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-black text-slate-700">#{question.question_id}</span>
                          <span className={`${badgeClass} ${statusBadge.cls}`}>{statusBadge.label}</span>
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                          Câu {questionIndex + 1}
                        </span>
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Nội dung câu hỏi</label>
                        <textarea
                          rows={3}
                          disabled={reviewReadOnly}
                          value={question.content}
                          onChange={(event) => updateQuestionField(question.question_id, { content: event.target.value })}
                          className={inputClass}
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Độ khó</label>
                          <select
                            disabled={reviewReadOnly}
                            value={question.difficulty}
                            onChange={(event) =>
                              updateQuestionField(question.question_id, {
                                difficulty: event.target.value as Difficulty,
                              })
                            }
                            className={inputClass}
                          >
                            <option value="easy">Dễ</option>
                            <option value="medium">Trung bình</option>
                            <option value="hard">Khó</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Trạng thái</label>
                          <select
                            disabled={reviewReadOnly}
                            value={question.status === 'inactive' ? 'draft' : question.status}
                            onChange={(event) =>
                              updateQuestionField(question.question_id, {
                                status: event.target.value as QuestionStatus,
                              })
                            }
                            className={inputClass}
                          >
                            <option value="draft">Nháp (ẩn khỏi ngân hàng)</option>
                            <option value="approved">Duyệt</option>
                            <option value="rejected">Từ chối</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Đáp án đúng</label>
                          <p className="mt-4 text-sm font-black text-slate-700">
                            {question.options.find((option) => option.is_correct)?.option_label || '-'}
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Giải thích (tùy chọn)</label>
                        <textarea
                          rows={2}
                          disabled={reviewReadOnly}
                          value={question.explanation}
                          onChange={(event) => updateQuestionField(question.question_id, { explanation: event.target.value })}
                          className={inputClass}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Đáp án</label>
                        {question.options.map((option, optionIndex) => (
                          <div key={`${question.question_id}-${option.order_num}`} className="p-3 bg-white border rounded-xl border-slate-200">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                disabled={reviewReadOnly}
                                onClick={() => setCorrectOption(question.question_id, optionIndex)}
                                className={`h-7 w-7 rounded-full border text-[11px] font-black ${
                                  option.is_correct
                                    ? 'border-emerald-500 bg-emerald-500 text-white'
                                    : 'border-slate-300 bg-white text-slate-400'
                                } disabled:opacity-50`}
                              >
                                {option.option_label}
                              </button>
                              <input
                                disabled={reviewReadOnly}
                                value={option.option_text}
                                onChange={(event) => updateOptionText(question.question_id, optionIndex, event.target.value)}
                                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-[var(--color-primary)]"
                              />
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={reviewReadOnly || optionIndex === 0}
                                  onClick={() => moveOption(question.question_id, optionIndex, -1)}
                                  className="w-8 h-8 border rounded-lg border-slate-200 text-slate-600 disabled:opacity-40"
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  disabled={reviewReadOnly || optionIndex === question.options.length - 1}
                                  onClick={() => moveOption(question.question_id, optionIndex, 1)}
                                  className="w-8 h-8 border rounded-lg border-slate-200 text-slate-600 disabled:opacity-40"
                                >
                                  ↓
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </article>
                  );
                })
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 px-8 py-5 bg-white border-t border-slate-100">
              <button
                type="button"
                onClick={closeReviewModal}
                disabled={submittingReview}
                className="rounded-xl border border-slate-200 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600"
              >
                Đóng
              </button>
              {!reviewReadOnly && (
                <button
                  type="button"
                  onClick={handleConfirmReview}
                  disabled={submittingReview || loadingReviewQuestions || reviewQuestions.length === 0}
                  className="rounded-xl bg-[var(--color-primary)] px-5 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-[var(--color-primary-dark)] disabled:opacity-50"
                >
                  {submittingReview ? 'Đang xác nhận...' : 'Xác nhận'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
