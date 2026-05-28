import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  bulkApproveTeacherQuestions,
  bulkRejectTeacherQuestions,
  createTeacherAiRequest,
  getTeacherAiRequestQuestions,
  getTeacherAiRequests,
  getTeacherAssignedSubjects,
  getTeacherDocumentsBySubjectTopic,
  getTeacherTopicsBySubjectId,
  retryTeacherAiRequest,
  setTeacherGeneratedQuestionStatus,
  softDeleteTeacherGeneratedQuestion,
  type Difficulty,
  type QuestionStatus,
  type TeacherAiQuestionItem,
  type TeacherAiRequestItem,
  type TeacherAssignedSubject,
  type TeacherDocumentTopicOption,
  type TeacherTopicItem,
} from '@/api/teacherAIGeneratorApi';

const inputClass = 'mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400';
const cardClass = 'rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm';
const badgeClass = 'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wider';

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
  if (status === 'completed') return { label: 'Hoàn tất', cls: 'bg-emerald-100 text-emerald-700' };
  if (status === 'failed') return { label: 'Thất bại', cls: 'bg-rose-100 text-rose-700' };
  if (status === 'processing') return { label: 'Đang xử lý', cls: 'bg-amber-100 text-amber-700' };
  if (status === 'pending') return { label: 'Đang chờ', cls: 'bg-slate-200 text-slate-700' };
  return { label: 'Đã hủy', cls: 'bg-slate-300 text-slate-700' };
};

const getQuestionStatusBadge = (status: QuestionStatus) => {
  if (status === 'approved') return { label: 'Đã duyệt', cls: 'bg-emerald-100 text-emerald-700' };
  if (status === 'rejected') return { label: 'Từ chối', cls: 'bg-rose-100 text-rose-700' };
  if (status === 'inactive') return { label: 'Đã xóa mềm', cls: 'bg-slate-200 text-slate-700' };
  return { label: 'Bản nháp', cls: 'bg-amber-100 text-amber-700' };
};

export default function TeacherAIGeneratorPage() {
  const location = useLocation();
  const preselectedDocumentId = Number(location.state?.documentId || 0) || null;

  const [subjects, setSubjects] = useState<TeacherAssignedSubject[]>([]);
  const [topics, setTopics] = useState<TeacherTopicItem[]>([]);
  const [documents, setDocuments] = useState<TeacherDocumentTopicOption[]>([]);
  const [requests, setRequests] = useState<TeacherAiRequestItem[]>([]);
  const [generatedQuestions, setGeneratedQuestions] = useState<TeacherAiQuestionItem[]>([]);

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [refreshingRequests, setRefreshingRequests] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [retryingRequestId, setRetryingRequestId] = useState<number | null>(null);
  const [processingQuestionId, setProcessingQuestionId] = useState<number | null>(null);
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | null>(null);

  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [topicId, setTopicId] = useState<number | null>(null);
  const [documentId, setDocumentId] = useState<number | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [contentScope, setContentScope] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const selectedDocumentTopic = useMemo(
    () => documents.find((item) => item.document_id === documentId) || null,
    [documentId, documents],
  );

  const selectedRequest = useMemo(
    () => requests.find((item) => item.request_id === selectedRequestId) || null,
    [requests, selectedRequestId],
  );

  const activeRequests = useMemo(
    () => requests.filter((item) => item.status === 'pending' || item.status === 'processing'),
    [requests],
  );

  const contextHasActiveRequest = useMemo(() => {
    if (!selectedDocumentTopic) return false;
    return requests.some(
      (item) =>
        item.document_topic_id === selectedDocumentTopic.document_topic_id
        && (item.status === 'pending' || item.status === 'processing'),
    );
  }, [requests, selectedDocumentTopic]);

  const draftQuestionIds = useMemo(
    () => generatedQuestions.filter((item) => item.status === 'draft').map((item) => item.question_id),
    [generatedQuestions],
  );

  const hasInvalidQuestionCount = !Number.isInteger(numQuestions) || numQuestions < 1 || numQuestions > 100;
  const isCreateRequestDisabled = !selectedDocumentTopic
    || !subjectId
    || !topicId
    || hasInvalidQuestionCount
    || submittingRequest
    || contextHasActiveRequest;

  const clearMessages = () => {
    setError('');
    setSuccess('');
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

  const loadTopicsBySubject = async (nextSubjectId: number) => {
    setLoadingTopics(true);
    try {
      const rows = await getTeacherTopicsBySubjectId(nextSubjectId);
      setTopics(rows);
    } finally {
      setLoadingTopics(false);
    }
  };

  const loadDocumentsByTopic = async (nextSubjectId: number, nextTopicId: number) => {
    setLoadingDocuments(true);
    try {
      const rows = await getTeacherDocumentsBySubjectTopic(nextSubjectId, nextTopicId);
      setDocuments(rows);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const loadGeneratedQuestionsByRequest = async (requestId: number, silent = false) => {
    if (!silent) setLoadingQuestions(true);
    try {
      const rows = await getTeacherAiRequestQuestions(requestId);
      setGeneratedQuestions(rows);
    } finally {
      if (!silent) setLoadingQuestions(false);
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
    bootstrapPage().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedRequestId) {
      setGeneratedQuestions([]);
      return;
    }
    loadGeneratedQuestionsByRequest(selectedRequestId).catch(() => undefined);
  }, [selectedRequestId]);

  useEffect(() => {
    if (!activeRequests.length) return;
    const timer = window.setInterval(() => {
      loadRequests(true)
        .then((items) => {
          if (!selectedRequestId) return;
          const current = items.find((item) => item.request_id === selectedRequestId);
          if (!current) return;
          if (current.status === 'pending' || current.status === 'processing' || current.status === 'completed') {
            loadGeneratedQuestionsByRequest(selectedRequestId, true).catch(() => undefined);
          }
        })
        .catch(() => undefined);
    }, 7000);

    return () => window.clearInterval(timer);
  }, [activeRequests.length, selectedRequestId]);

  const handleSubjectChange = async (nextSubjectId: number) => {
    clearMessages();
    setSubjectId(nextSubjectId);
    setTopicId(null);
    setDocumentId(null);
    setTopics([]);
    setDocuments([]);
    await loadTopicsBySubject(nextSubjectId);
  };

  const handleTopicChange = async (nextTopicId: number) => {
    clearMessages();
    setTopicId(nextTopicId);
    setDocumentId(null);
    setDocuments([]);
    if (!subjectId) return;
    await loadDocumentsByTopic(subjectId, nextTopicId);
  };

  const applyRequestCriteria = async (request: TeacherAiRequestItem) => {
    const docTopic = request.document_topic;
    if (!docTopic?.subject_id || !docTopic?.topic_id || !docTopic?.document_id) {
      setError('Không thể nạp lại tiêu chí từ job này.');
      return;
    }

    clearMessages();
    setSubjectId(docTopic.subject_id);
    setTopicId(null);
    setDocumentId(null);
    setTopics([]);
    setDocuments([]);

    await loadTopicsBySubject(docTopic.subject_id);
    setTopicId(docTopic.topic_id);

    await loadDocumentsByTopic(docTopic.subject_id, docTopic.topic_id);
    setDocumentId(docTopic.document_id);
    setNumQuestions(request.num_questions);
    setDifficulty(request.difficulty);
    setContentScope(request.content_scope || '');
    setSuccess(`Đã nạp lại tiêu chí từ job #${request.request_id}.`);
  };

  const handleCreateRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    clearMessages();

    if (!selectedDocumentTopic || !subjectId || !topicId) {
      setError('Vui lòng chọn đủ môn học, chủ đề và tài liệu trước khi tạo yêu cầu.');
      return;
    }

    if (contextHasActiveRequest) {
      setError('Ngữ cảnh này đang có job pending/processing. Vui lòng đợi xử lý xong.');
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
      setSuccess('Đã tạo job AI thành công. Hệ thống đang xử lý.');
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
      setSuccess(`Đã gửi retry cho job #${requestId}.`);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Không thể retry job AI.');
    } finally {
      setRetryingRequestId(null);
    }
  };

  const handleUpdateQuestionStatus = async (questionId: number, status: QuestionStatus) => {
    clearMessages();
    setProcessingQuestionId(questionId);
    try {
      await setTeacherGeneratedQuestionStatus(questionId, status);
      setGeneratedQuestions((prev) => prev.map((item) => (item.question_id === questionId ? { ...item, status } : item)));
      setSuccess(`Đã cập nhật trạng thái câu hỏi #${questionId}.`);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Không thể cập nhật trạng thái câu hỏi.');
    } finally {
      setProcessingQuestionId(null);
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    clearMessages();
    setProcessingQuestionId(questionId);
    try {
      await softDeleteTeacherGeneratedQuestion(questionId);
      setGeneratedQuestions((prev) => prev.filter((item) => item.question_id !== questionId));
      setSuccess(`Đã xóa mềm câu hỏi #${questionId}.`);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Không thể xóa câu hỏi.');
    } finally {
      setProcessingQuestionId(null);
    }
  };

  const handleBulkApprove = async () => {
    if (!draftQuestionIds.length) return;
    clearMessages();
    setBulkAction('approve');
    try {
      const result = await bulkApproveTeacherQuestions({ question_ids: draftQuestionIds });
      const updatedIds = new Set(result.updated_question_ids || []);
      setGeneratedQuestions((prev) => prev.map((item) => (updatedIds.has(item.question_id) ? { ...item, status: 'approved' } : item)));
      setSuccess(`Đã duyệt ${updatedIds.size} câu hỏi.`);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Không thể duyệt hàng loạt.');
    } finally {
      setBulkAction(null);
    }
  };

  const handleBulkReject = async () => {
    if (!draftQuestionIds.length) return;
    clearMessages();
    setBulkAction('reject');
    try {
      const result = await bulkRejectTeacherQuestions({ question_ids: draftQuestionIds });
      const updatedIds = new Set(result.updated_question_ids || []);
      setGeneratedQuestions((prev) => prev.map((item) => (updatedIds.has(item.question_id) ? { ...item, status: 'rejected' } : item)));
      setSuccess(`Đã từ chối ${updatedIds.size} câu hỏi.`);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Không thể từ chối hàng loạt.');
    } finally {
      setBulkAction(null);
    }
  };

  if (loadingInitial) {
    return (
      <div className="rounded-[2rem] border border-slate-100 bg-white p-10 text-center">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Đang tải AI Generator</p>
        <p className="mt-3 text-sm font-semibold text-slate-500">Vui lòng chờ trong giây lát...</p>
      </div>
    );
  }

  return (
    <div className="pb-20 space-y-8">
      <section className="rounded-[2.5rem] border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-8 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Teacher AI Generator</p>
        <h1 className="mt-3 text-4xl font-black uppercase italic leading-[0.95] tracking-tight text-slate-900 lg:text-5xl">
          Tạo câu hỏi trắc nghiệm
          <br />
          <span className="text-[var(--color-primary)]">Trắc nghiệm</span>
        </h1>

      </section>

      {error && <div className="px-5 py-4 text-sm font-bold border rounded-2xl border-rose-200 bg-rose-50 text-rose-700">{error}</div>}
      {success && <div className="px-5 py-4 text-sm font-bold border rounded-2xl border-emerald-200 bg-emerald-50 text-emerald-700">{success}</div>}

      <section className={cardClass}>
        <h2 className="text-2xl italic font-black tracking-tight uppercase text-slate-900">Tạo yêu cầu AI</h2>

        <form className="mt-6 space-y-5" onSubmit={handleCreateRequest}>
          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Môn học</label>
              <select
                className={inputClass}
                value={subjectId ?? ''}
                onChange={(event) => handleSubjectChange(Number(event.target.value))}
                disabled={!subjects.length}
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
              <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Chủ đề</label>
              <select
                className={inputClass}
                value={topicId ?? ''}
                onChange={(event) => handleTopicChange(Number(event.target.value))}
                disabled={!subjectId || loadingTopics || !topics.length}
              >
                {!subjectId && <option value="">Vui lòng chọn môn học trước</option>}
                {subjectId && !topics.length && <option value="">Không có chủ đề cho môn học này</option>}
                {topics.map((item) => (
                  <option key={item.topic_id} value={item.topic_id}>
                    {item.topic_name}
                  </option>
                ))}
              </select>
              {loadingTopics && <p className="mt-2 text-xs font-semibold text-slate-400">Đang tải chủ đề...</p>}
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Tài liệu</label>
              <select
                className={inputClass}
                value={documentId ?? ''}
                onChange={(event) => setDocumentId(Number(event.target.value))}
                disabled={!topicId || loadingDocuments || !documents.length}
              >
                {!topicId && <option value="">Vui lòng chọn chủ đề trước</option>}
                {topicId && !documents.length && <option value="">Không có tài liệu phù hợp</option>}
                {documents.map((item) => (
                  <option key={item.document_topic_id} value={item.document_id}>
                    {item.document_title}
                  </option>
                ))}
              </select>
              {loadingDocuments && <p className="mt-2 text-xs font-semibold text-slate-400">Đang tải tài liệu...</p>}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Số lượng câu hỏi</label>
              <input
                type="number"
                min={1}
                max={100}
                value={numQuestions}
                onChange={(event) => setNumQuestions(Number(event.target.value))}
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Độ khó</label>
              <select
                className={inputClass}
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value as Difficulty)}
              >
                <option value="easy">Dễ</option>
                <option value="medium">Trung bình</option>
                <option value="hard">Khó</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Phạm vi nội dung (tùy chọn)</label>
            <textarea
              rows={3}
              className={inputClass}
              value={contentScope}
              onChange={(event) => setContentScope(event.target.value)}
              placeholder="Ví dụ: Chỉ chương 2 và chương 3, tập trung phần định nghĩa và công thức quan trọng"
            />
          </div>

          {selectedDocumentTopic && (
            <div className="p-4 text-xs font-semibold border rounded-2xl border-slate-200 bg-slate-50 text-slate-600">
              <p className="font-black uppercase tracking-[0.18em] text-slate-500">Tài liệu đã chọn</p>
              <p className="mt-2">{selectedDocumentTopic.document_title}</p>
              <p className="mt-1">
                {selectedDocumentTopic.topic_name} | {selectedDocumentTopic.subject_name}
              </p>
              <p className="mt-1">
                Định dạng: {selectedDocumentTopic.file_type || '-'} | Dung lượng: {formatFileSize(selectedDocumentTopic.file_size)} | Trạng thái: {selectedDocumentTopic.status || '-'}
              </p>
              <p className="mt-1">Tạo lúc: {formatDateTime(selectedDocumentTopic.created_at)}</p>
            </div>
          )}

          {contextHasActiveRequest && (
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">
              Ngữ cảnh này đang có job pending/processing. Vui lòng đợi xử lý xong.
            </p>
          )}

          <div className="pt-4 border-t border-slate-200">
            <button
              type="submit"
              disabled={isCreateRequestDisabled}
              className="rounded-2xl bg-[var(--color-primary)] px-6 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submittingRequest ? 'Đang gửi yêu cầu...' : 'Tạo job AI'}
            </button>
          </div>
        </form>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-5">
          <div className={cardClass}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black tracking-tight uppercase text-slate-900">Job tạo câu hỏi AI</h3>
              <button
                type="button"
                onClick={() => loadRequests(false).catch(() => undefined)}
                disabled={refreshingRequests}
                className="rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-slate-600 disabled:opacity-60"
              >
                {refreshingRequests ? 'Đang làm mới...' : 'Làm mới'}
              </button>
            </div>

            {!requests.length ? (
              <div className="p-6 text-sm font-semibold text-center border border-dashed rounded-2xl border-slate-200 bg-slate-50 text-slate-500">
                Chưa có job AI nào.
              </div>
            ) : (
              <div className="max-h-[720px] space-y-3 overflow-auto pr-1">
                {requests.map((item) => {
                  const badge = getRequestStatusBadge(item.status);
                  const isSelected = selectedRequestId === item.request_id;
                  return (
                    <article
                      key={item.request_id}
                      className={`rounded-2xl border p-4 transition ${
                        isSelected ? 'border-[var(--color-primary)] bg-red-50/30' : 'border-slate-100 bg-slate-50/70'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="text-sm font-black text-slate-900">Job #{item.request_id}</p>
                        <span className={`${badgeClass} ${badge.cls}`}>{badge.label}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-700">
                        {item.document_topic.subject_name} → {item.document_topic.topic_name}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-600">{item.document_topic.document_title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.num_questions} câu | {getDifficultyLabel(item.difficulty)} | Sinh được: {item.generated_question_count}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">Tạo lúc: {formatDateTime(item.created_at)}</p>
                      {item.error_message && <p className="mt-2 text-xs font-bold text-rose-600">Lỗi: {item.error_message}</p>}

                      <div className="flex flex-wrap gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => setSelectedRequestId(item.request_id)}
                          className="rounded-lg bg-slate-900 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white"
                        >
                          {item.status === 'completed' ? 'Xem câu hỏi' : 'Theo dõi'}
                        </button>
                        {item.status === 'failed' && (
                          <button
                            type="button"
                            disabled={retryingRequestId === item.request_id}
                            onClick={() => handleRetryRequest(item.request_id)}
                            className="rounded-lg bg-[var(--color-primary)] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50"
                          >
                            {retryingRequestId === item.request_id ? 'Đang gửi retry...' : 'Retry job'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => applyRequestCriteria(item).catch(() => undefined)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600"
                        >
                          Dùng lại tiêu chí
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6 xl:col-span-7">
          <div className={cardClass}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="text-lg font-black tracking-tight uppercase text-slate-900">Duyệt câu hỏi sinh từ AI</h3>
              {selectedRequest && (
                <span className="text-xs font-bold text-slate-400">
                  Job #{selectedRequest.request_id} | {generatedQuestions.length} câu hỏi
                </span>
              )}
            </div>

            {!selectedRequest ? (
              <div className="p-8 text-center border border-dashed rounded-2xl border-slate-200 bg-slate-50">
                <p className="text-sm font-black text-slate-500">Chọn một job AI ở cột bên trái để xem chi tiết.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 text-sm font-semibold border rounded-2xl border-slate-100 bg-slate-50 text-slate-600">
                  <p className="font-black text-slate-900">
                    {selectedRequest.document_topic.subject_name} → {selectedRequest.document_topic.topic_name}
                  </p>
                  <p className="mt-1">{selectedRequest.document_topic.document_title}</p>
                  <p className="mt-1">
                    {selectedRequest.num_questions} câu | {getDifficultyLabel(selectedRequest.difficulty)} | Tạo lúc {formatDateTime(selectedRequest.created_at)}
                  </p>
                </div>

                {(selectedRequest.status === 'pending' || selectedRequest.status === 'processing') && (
                  <div className="p-4 border rounded-2xl border-amber-200 bg-amber-50">
                    <p className="text-sm font-black text-amber-700">Job đang chạy. Hệ thống sẽ tự động làm mới trạng thái.</p>
                  </div>
                )}

                {selectedRequest.status === 'failed' && (
                  <div className="p-4 border rounded-2xl border-rose-200 bg-rose-50">
                    <p className="text-sm font-black text-rose-700">Job thất bại: {selectedRequest.error_message || 'Không có chi tiết lỗi.'}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button
                        type="button"
                        disabled={retryingRequestId === selectedRequest.request_id}
                        onClick={() => handleRetryRequest(selectedRequest.request_id)}
                        className="rounded-lg bg-[var(--color-primary)] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50"
                      >
                        {retryingRequestId === selectedRequest.request_id ? 'Đang gửi retry...' : 'Retry job'}
                      </button>
                      <button
                        type="button"
                        onClick={() => applyRequestCriteria(selectedRequest).catch(() => undefined)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600"
                      >
                        Tạo mới theo tiêu chí cũ
                      </button>
                    </div>
                  </div>
                )}

                {selectedRequest.status === 'completed' && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={!draftQuestionIds.length || bulkAction !== null}
                      onClick={handleBulkApprove}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white disabled:opacity-50"
                    >
                      {bulkAction === 'approve' ? 'Đang duyệt...' : `Duyệt tất cả bản nháp (${draftQuestionIds.length})`}
                    </button>
                    <button
                      type="button"
                      disabled={!draftQuestionIds.length || bulkAction !== null}
                      onClick={handleBulkReject}
                      className="rounded-xl bg-rose-600 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white disabled:opacity-50"
                    >
                      {bulkAction === 'reject' ? 'Đang từ chối...' : `Từ chối tất cả bản nháp (${draftQuestionIds.length})`}
                    </button>
                  </div>
                )}

                {loadingQuestions ? (
                  <div className="p-8 text-sm font-semibold text-center border border-dashed rounded-2xl border-slate-200 bg-slate-50 text-slate-500">
                    Đang tải danh sách câu hỏi...
                  </div>
                ) : generatedQuestions.length === 0 ? (
                  <div className="p-8 text-sm font-semibold text-center border border-dashed rounded-2xl border-slate-200 bg-slate-50 text-slate-500">
                    {selectedRequest.status === 'completed'
                      ? 'Job đã hoàn tất nhưng chưa có câu hỏi khả dụng.'
                      : 'Câu hỏi sẽ hiển thị khi job hoàn tất.'}
                  </div>
                ) : (
                  <div className="max-h-[760px] space-y-3 overflow-auto pr-1">
                    {generatedQuestions.map((question) => {
                      const statusBadge = getQuestionStatusBadge(question.status);
                      return (
                        <article key={question.question_id} className="p-4 border rounded-2xl border-slate-100 bg-slate-50/70">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-xs font-black text-slate-700">#{question.question_id}</span>
                            <span className={`${badgeClass} ${statusBadge.cls}`}>{statusBadge.label}</span>
                            <span className={`${badgeClass} bg-slate-200 text-slate-700`}>{getDifficultyLabel(question.difficulty)}</span>
                          </div>

                          <p className="text-sm font-bold text-slate-900">{question.content}</p>
                          {question.explanation && <p className="mt-2 text-xs font-semibold text-slate-500">Giải thích: {question.explanation}</p>}

                          <div className="grid gap-2 mt-3">
                            {question.options.map((option) => (
                              <div
                                key={option.option_id}
                                className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                                  option.is_correct ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600'
                                }`}
                              >
                                <span className="mr-2 font-black">{option.option_label}.</span>
                                {option.option_text}
                                {option.is_correct && <span className="ml-2 font-black tracking-wider uppercase">(Đáp án đúng)</span>}
                              </div>
                            ))}
                          </div>

                          <div className="flex flex-wrap gap-2 mt-3">
                            <button
                              type="button"
                              disabled={processingQuestionId === question.question_id || question.status === 'approved'}
                              onClick={() => handleUpdateQuestionStatus(question.question_id, 'approved')}
                              className="rounded-lg bg-emerald-600 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50"
                            >
                              Duyệt
                            </button>
                            <button
                              type="button"
                              disabled={processingQuestionId === question.question_id || question.status === 'rejected'}
                              onClick={() => handleUpdateQuestionStatus(question.question_id, 'rejected')}
                              className="rounded-lg bg-rose-600 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50"
                            >
                              Từ chối
                            </button>
                            <button
                              type="button"
                              disabled={processingQuestionId === question.question_id}
                              onClick={() => handleDeleteQuestion(question.question_id)}
                              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 disabled:opacity-50"
                            >
                              Xóa mềm
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
