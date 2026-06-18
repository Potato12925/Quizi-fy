import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  createTeacherAiRequest,
  getTeacherAssignedSubjects,
  getTeacherDocumentsBySubjectTopic,
  getTeacherTopicsBySubjectId,
  type DifficultyLevel,
  type TeacherAssignedSubject,
  type TeacherDocumentTopicOption,
  type TeacherTopicItem,
} from '@/api/teacherAIGeneratorApi';
import { useTeacherAIGeneratorContext } from './TeacherAIGeneratorLayout';
import type { DifficultyDistributionDraftItem, DistributionInputMode } from './types';
import {
  applyCountsFromPercentages,
  applyPercentagesFromCounts,
  buildInitialDifficultyDistribution,
  clampNonNegativeInteger,
  DIFFICULTY_LABELS,
  formatDateTime,
  formatFileSize,
  inputClass,
  pageCardClass,
} from './utils';

export default function TeacherAIGeneratorCreatePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    activeRequests,
    clearMessages,
    loadRequests,
    requests,
    setError,
    setSuccess,
  } = useTeacherAIGeneratorContext();
  const preselectedDocumentId = Number(location.state?.documentId || 0) || null;

  const [subjects, setSubjects] = useState<TeacherAssignedSubject[]>([]);
  const [topics, setTopics] = useState<TeacherTopicItem[]>([]);
  const [documents, setDocuments] = useState<TeacherDocumentTopicOption[]>([]);

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [topicId, setTopicId] = useState<number | null>(null);
  const [documentId, setDocumentId] = useState<number | null>(null);
  const [numQuestions, setNumQuestions] = useState(10);
  const [distributionInputMode, setDistributionInputMode] = useState<DistributionInputMode>('question_count');
  const [difficultyDistribution, setDifficultyDistribution] = useState<DifficultyDistributionDraftItem[]>(
    () => buildInitialDifficultyDistribution(10),
  );
  const [contentScope, setContentScope] = useState('');

  const selectedDocumentTopic = useMemo(
    () => documents.find((item) => item.document_id === documentId) || null,
    [documentId, documents],
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
  const totalDistributedQuestions = useMemo(
    () => difficultyDistribution.reduce((sum, item) => sum + clampNonNegativeInteger(item.question_count), 0),
    [difficultyDistribution],
  );
  const totalDistributedPercentage = useMemo(
    () => difficultyDistribution.reduce((sum, item) => sum + clampNonNegativeInteger(item.percentage), 0),
    [difficultyDistribution],
  );
  const hasPositiveDistribution = useMemo(
    () => difficultyDistribution.some((item) => clampNonNegativeInteger(item.question_count) > 0),
    [difficultyDistribution],
  );
  const distributionValidationError = useMemo(() => {
    if (difficultyDistribution.some((item) => clampNonNegativeInteger(item.question_count) !== item.question_count)) {
      return 'Số câu của từng mức phải là số nguyên không âm.';
    }
    if (!hasPositiveDistribution) {
      return 'Cần có ít nhất một mức độ có số câu lớn hơn 0.';
    }
    if (totalDistributedQuestions !== numQuestions) {
      return `Tổng số câu theo mức độ phải đúng bằng ${numQuestions}. Hiện tại là ${totalDistributedQuestions}.`;
    }
    if (distributionInputMode === 'percentage' && totalDistributedPercentage !== 100) {
      return `Tổng tỷ lệ phần trăm phải bằng 100%. Hiện tại là ${totalDistributedPercentage}%.`;
    }
    return null;
  }, [
    difficultyDistribution,
    distributionInputMode,
    hasPositiveDistribution,
    numQuestions,
    totalDistributedPercentage,
    totalDistributedQuestions,
  ]);

  const isCreateRequestDisabled = !selectedDocumentTopic
    || !subjectId
    || !topicId
    || hasInvalidQuestionCount
    || !!distributionValidationError
    || submittingRequest
    || contextHasActiveRequest
    || hasGeneratingRequest;

  useEffect(() => {
    const bootstrap = async () => {
      setLoadingInitial(true);
      clearMessages();
      try {
        const assignedSubjects = await getTeacherAssignedSubjects();
        setSubjects(assignedSubjects);

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
        setDocumentId(resolvedDocuments.find((item) => item.document_id === preselectedDocumentId)?.document_id
          ?? resolvedDocuments[0]?.document_id
          ?? null);
      } catch (caught: unknown) {
        setError(caught instanceof Error ? caught.message : 'Không thể tải dữ liệu AI Generator.');
      } finally {
        setLoadingInitial(false);
      }
    };

    bootstrap().catch(() => undefined);
  }, [clearMessages, preselectedDocumentId, setError]);

  useEffect(() => {
    setDifficultyDistribution((prev) => (
      distributionInputMode === 'percentage'
        ? applyCountsFromPercentages(prev, numQuestions)
        : applyPercentagesFromCounts(prev, numQuestions)
    ));
  }, [distributionInputMode, numQuestions]);

  const loadTopicsBySubject = async (nextSubjectId: number) => {
    setLoadingTopics(true);
    try {
      const rows = await getTeacherTopicsBySubjectId(nextSubjectId);
      setTopics(rows);
      return rows;
    } finally {
      setLoadingTopics(false);
    }
  };

  const loadDocumentsByTopic = async (nextSubjectId: number, nextTopicId: number) => {
    setLoadingDocuments(true);
    try {
      const rows = await getTeacherDocumentsBySubjectTopic(nextSubjectId, nextTopicId);
      setDocuments(rows);
      return rows;
    } finally {
      setLoadingDocuments(false);
    }
  };

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

  const handleDistributionCountChange = (difficulty: DifficultyLevel, value: number) => {
    setDifficultyDistribution((prev) => {
      const nextItems = prev.map((item) => (
        item.difficulty === difficulty
          ? { ...item, question_count: clampNonNegativeInteger(value) }
          : item
      ));
      return applyPercentagesFromCounts(nextItems, numQuestions);
    });
  };

  const handleDistributionPercentageChange = (difficulty: DifficultyLevel, value: number) => {
    setDifficultyDistribution((prev) => {
      const nextItems = prev.map((item) => (
        item.difficulty === difficulty
          ? { ...item, percentage: clampNonNegativeInteger(value) }
          : item
      ));
      return applyCountsFromPercentages(nextItems, numQuestions);
    });
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
    if (distributionValidationError) {
      setError(distributionValidationError);
      return;
    }

    setSubmittingRequest(true);
    try {
      const created = await createTeacherAiRequest({
        document_topic_id: selectedDocumentTopic.document_topic_id,
        num_questions: numQuestions,
        content_scope: contentScope.trim() || null,
        difficulty_distribution: difficultyDistribution.map((item) => ({
          difficulty: item.difficulty,
          question_count: item.question_count,
          percentage: item.percentage,
        })),
      });

      await loadRequests(true);
      setSuccess('Đã tạo job AI thành công.');
      navigate(`/teacher/ai-generator/requests/${created.request_id}`);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Không thể tạo yêu cầu AI.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className={`${pageCardClass} min-h-[55vh] p-12 text-center`}>
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-5 rounded-2xl bg-slate-100 text-slate-500">
          <span className="material-symbols-outlined animate-spin">sync</span>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Tạo yêu cầu AI</p>
        <p className="mt-3 text-sm font-bold text-slate-600">Đang tải dữ liệu, vui lòng chờ trong giây lát...</p>
      </div>
    );
  }

  return (
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
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Chế độ nhập phân phối</label>
            <div className="mt-2 grid grid-cols-2 gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-2">
              <button
                type="button"
                disabled={hasGeneratingRequest}
                onClick={() => setDistributionInputMode('question_count')}
                className={`rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                  distributionInputMode === 'question_count'
                    ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-red-900/15'
                    : 'bg-white text-slate-500 hover:text-slate-700'
                } disabled:opacity-50`}
              >
                Nhập số câu
              </button>
              <button
                type="button"
                disabled={hasGeneratingRequest}
                onClick={() => setDistributionInputMode('percentage')}
                className={`rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                  distributionInputMode === 'percentage'
                    ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-red-900/15'
                    : 'bg-white text-slate-500 hover:text-slate-700'
                } disabled:opacity-50`}
              >
                Nhập %
              </button>
            </div>
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

        <div className="space-y-4 rounded-[1.75rem] border border-slate-100 bg-slate-50/70 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Phân phối mức độ câu hỏi</p>
              <p className="mt-2 text-sm font-bold text-slate-600">
                {distributionInputMode === 'question_count'
                  ? 'Nhập số câu cho từng mức, hệ thống sẽ tự tính phần trăm tương ứng.'
                  : 'Nhập tỷ lệ phần trăm cho từng mức, hệ thống sẽ tự tính số câu tương ứng.'}
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tổng hiện tại</p>
              <p className="mt-1 text-sm font-black text-slate-800">{totalDistributedQuestions}/{numQuestions} câu</p>
              <p className="text-xs font-bold text-slate-500">{totalDistributedPercentage}%</p>
            </div>
          </div>

          <div className="grid gap-4">
            {difficultyDistribution.map((item) => (
              <div
                key={item.difficulty}
                className="grid gap-4 rounded-2xl border border-slate-100 bg-white p-4 md:grid-cols-[minmax(0,1.4fr)_minmax(150px,1fr)_minmax(150px,1fr)]"
              >
                <div>
                  <p className="text-sm font-black text-slate-800">{DIFFICULTY_LABELS[item.difficulty]}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">{item.question_count} câu | {item.percentage}%</p>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Số câu</label>
                  <input
                    type="number"
                    min={0}
                    value={item.question_count}
                    onChange={(event) => handleDistributionCountChange(item.difficulty, Number(event.target.value))}
                    className={inputClass}
                    disabled={hasGeneratingRequest || distributionInputMode !== 'question_count'}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tỷ lệ (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={item.percentage}
                    onChange={(event) => handleDistributionPercentageChange(item.difficulty, Number(event.target.value))}
                    className={inputClass}
                    disabled={hasGeneratingRequest || distributionInputMode !== 'percentage'}
                  />
                </div>
              </div>
            ))}
          </div>

          {distributionValidationError ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-[var(--color-primary)]">
              {distributionValidationError}
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
              Phân phối hợp lệ và sẵn sàng gửi yêu cầu AI.
            </div>
          )}
        </div>

        {selectedDocumentTopic && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-xs font-bold text-slate-600">
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
            className="rounded-2xl bg-[var(--color-primary)] px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-red-900/20 transition-all hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submittingRequest ? 'Đang gửi yêu cầu...' : 'Tạo job AI'}
          </button>
        </div>
      </form>
    </section>
  );
}
