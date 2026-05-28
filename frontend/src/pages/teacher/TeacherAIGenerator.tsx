import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

import {
  bulkApproveTeacherQuestions,
  bulkRejectTeacherQuestions,
  createTeacherAiRequest,
  createTeacherManualQuestionFromAiGenerator,
  getTeacherAiGeneratorOptions,
  getTeacherAiRequestQuestions,
  getTeacherAiRequests,
  patchTeacherQuestion,
  retryTeacherAiRequest,
  type AiGeneratorOptionDocumentTopic,
  type AiGeneratorOptionsResponse,
  type Difficulty,
  type TeacherAiQuestionItem,
  type TeacherAiRequestItem,
} from '@/api/teacherAIGeneratorApi';

type EditableQuestion = {
  content: string;
  difficulty: Difficulty;
  explanation: string;
  options: string[];
  correct_option_index: number;
};

type ManualDraftForm = {
  content: string;
  difficulty: Difficulty;
  explanation: string;
  options: string[];
  correct_option_index: number;
};

const DEFAULT_MANUAL_FORM: ManualDraftForm = {
  content: '',
  difficulty: 'medium',
  explanation: '',
  options: ['', '', '', ''],
  correct_option_index: 0,
};

export default function TeacherAIGeneratorPage() {
  const location = useLocation();
  const preselectedDocumentId = Number(location.state?.documentId || 0) || null;

  const [options, setOptions] = useState<AiGeneratorOptionsResponse>({
    subjects: [],
    topics: [],
    documents: [],
    document_topics: [],
  });
  const [requests, setRequests] = useState<TeacherAiRequestItem[]>([]);
  const [activeRequestId, setActiveRequestId] = useState<number | null>(null);
  const [requestQuestions, setRequestQuestions] = useState<TeacherAiQuestionItem[]>([]);
  const [questionEdits, setQuestionEdits] = useState<Record<number, EditableQuestion>>({});
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);

  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [topicId, setTopicId] = useState<number | null>(null);
  const [documentId, setDocumentId] = useState<number | null>(null);

  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [contentScope, setContentScope] = useState('');

  const [manualForm, setManualForm] = useState<ManualDraftForm>(DEFAULT_MANUAL_FORM);
  const [manualSubmitting, setManualSubmitting] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshingRequests, setRefreshingRequests] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const currentDocumentTopic = useMemo(() => {
    if (!subjectId || !topicId || !documentId) return null;
    return (
      options.document_topics.find(
        (item) =>
          item.subject_id === subjectId &&
          item.topic_id === topicId &&
          item.document_id === documentId,
      ) || null
    );
  }, [subjectId, topicId, documentId, options.document_topics]);

  const activeRequest = useMemo(
    () => requests.find((item) => item.request_id === activeRequestId) || null,
    [requests, activeRequestId],
  );

  const hasUnsavedChanges = useMemo(() => Object.keys(questionEdits).length > 0, [questionEdits]);

  const filteredTopics = useMemo(
    () => options.topics.filter((item) => item.subject_id === subjectId),
    [options.topics, subjectId],
  );

  const filteredDocuments = useMemo(() => {
    if (!subjectId || !topicId) return [];
    const documentIds = new Set(
      options.document_topics
        .filter((item) => item.subject_id === subjectId && item.topic_id === topicId)
        .map((item) => item.document_id),
    );
    return options.documents.filter((item) => documentIds.has(item.document_id));
  }, [options.document_topics, options.documents, subjectId, topicId]);

  const contextHasActiveRequest = useMemo(() => {
    if (!currentDocumentTopic) return false;
    return requests.some(
      (item) =>
        item.document_topic_id === currentDocumentTopic.document_topic_id &&
        (item.status === 'pending' || item.status === 'processing'),
    );
  }, [currentDocumentTopic, requests]);

  const normalizeQuestionForEdit = (question: TeacherAiQuestionItem): EditableQuestion => {
    const sortedOptions = [...question.options].sort((a, b) => a.order_num - b.order_num);
    const correctOptionIndex = sortedOptions.findIndex((opt) => opt.is_correct);
    return {
      content: question.content,
      difficulty: question.difficulty,
      explanation: question.explanation || '',
      options: sortedOptions.map((opt) => opt.option_text).slice(0, 4),
      correct_option_index: correctOptionIndex >= 0 ? correctOptionIndex : 0,
    };
  };

  const loadRequestQuestions = async (requestId: number) => {
    const items = await getTeacherAiRequestQuestions(requestId);
    setRequestQuestions(items);
    setQuestionEdits({});
    setSelectedQuestionIds([]);
  };

  const applyInitialSelections = (nextOptions: AiGeneratorOptionsResponse) => {
    if (nextOptions.subjects.length === 0) {
      setSubjectId(null);
      setTopicId(null);
      setDocumentId(null);
      return;
    }

    let selectedSubject = nextOptions.subjects[0].subject_id;
    let selectedTopic: number | null = null;
    let selectedDocument: number | null = null;

    if (preselectedDocumentId) {
      const preselectedDocumentTopic = nextOptions.document_topics.find(
        (item) => item.document_id === preselectedDocumentId,
      );
      if (preselectedDocumentTopic) {
        selectedSubject = preselectedDocumentTopic.subject_id;
        selectedTopic = preselectedDocumentTopic.topic_id;
        selectedDocument = preselectedDocumentTopic.document_id;
      }
    }

    if (!selectedTopic) {
      const firstTopic = nextOptions.topics.find((item) => item.subject_id === selectedSubject);
      selectedTopic = firstTopic?.topic_id || null;
    }

    if (!selectedDocument && selectedTopic) {
      const firstDocTopic = nextOptions.document_topics.find(
        (item) => item.subject_id === selectedSubject && item.topic_id === selectedTopic,
      );
      selectedDocument = firstDocTopic?.document_id || null;
    }

    setSubjectId(selectedSubject);
    setTopicId(selectedTopic);
    setDocumentId(selectedDocument);
  };

  const refreshRequests = async (preserveSelection = true) => {
    setRefreshingRequests(true);
    try {
      const response = await getTeacherAiRequests(1, 100);
      setRequests(response.items);
      if (response.items.length === 0) {
        setActiveRequestId(null);
        setRequestQuestions([]);
        return;
      }

      const currentId = preserveSelection ? activeRequestId : null;
      const exists = currentId ? response.items.some((item) => item.request_id === currentId) : false;
      const nextActiveId = exists ? currentId : response.items[0].request_id;
      setActiveRequestId(nextActiveId);
      if (nextActiveId) {
        await loadRequestQuestions(nextActiveId);
      }
    } finally {
      setRefreshingRequests(false);
    }
  };

  useEffect(() => {
    const loadPageData = async () => {
      setLoading(true);
      setError('');
      try {
        const [loadedOptions, loadedRequests] = await Promise.all([
          getTeacherAiGeneratorOptions(),
          getTeacherAiRequests(1, 100),
        ]);
        setOptions(loadedOptions);
        applyInitialSelections(loadedOptions);
        setRequests(loadedRequests.items);
        if (loadedRequests.items.length > 0) {
          const latestRequestId = loadedRequests.items[0].request_id;
          setActiveRequestId(latestRequestId);
          await loadRequestQuestions(latestRequestId);
        }
      } catch {
        setError('Unable to load AI generator data');
      } finally {
        setLoading(false);
      }
    };
    loadPageData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const hasInProgress = requests.some((item) => item.status === 'pending' || item.status === 'processing');
    if (!hasInProgress) return;
    const interval = window.setInterval(() => {
      refreshRequests(true).catch(() => undefined);
    }, 8000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requests, activeRequestId]);

  const onSubjectChange = (nextSubjectId: number) => {
    setSubjectId(nextSubjectId);
    const nextTopic = options.topics.find((item) => item.subject_id === nextSubjectId);
    if (!nextTopic) {
      setTopicId(null);
      setDocumentId(null);
      return;
    }

    setTopicId(nextTopic.topic_id);
    const nextDocTopic = options.document_topics.find(
      (item) => item.subject_id === nextSubjectId && item.topic_id === nextTopic.topic_id,
    );
    setDocumentId(nextDocTopic?.document_id || null);
  };

  const onTopicChange = (nextTopicId: number) => {
    setTopicId(nextTopicId);
    if (!subjectId) {
      setDocumentId(null);
      return;
    }
    const nextDocTopic = options.document_topics.find(
      (item) => item.subject_id === subjectId && item.topic_id === nextTopicId,
    );
    setDocumentId(nextDocTopic?.document_id || null);
  };

  const onGenerate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setInfo('');

    if (!currentDocumentTopic) {
      setError('Please select a valid subject-topic-document combination.');
      return;
    }
    if (contextHasActiveRequest) {
      setError('There is already a pending/processing request for this document-topic.');
      return;
    }

    setGenerating(true);
    try {
      const created = await createTeacherAiRequest({
        document_topic_id: currentDocumentTopic.document_topic_id,
        num_questions: numQuestions,
        difficulty,
        content_scope: contentScope.trim() || undefined,
      });
      setRequests((prev) => [created, ...prev]);
      setActiveRequestId(created.request_id);
      setRequestQuestions([]);
      setInfo('AI request queued. Questions will appear after processing.');
    } catch (caught: unknown) {
      const message = caught instanceof Error ? caught.message : 'Unable to create AI request.';
      setError(message);
    } finally {
      setGenerating(false);
    }
  };

  const onRetryFailedRequest = async (requestId: number) => {
    setActionLoading(true);
    setError('');
    setInfo('');
    try {
      await retryTeacherAiRequest(requestId);
      await refreshRequests(true);
      setInfo('Retry request has been queued.');
    } catch (caught: unknown) {
      const message = caught instanceof Error ? caught.message : 'Unable to retry AI request.';
      setError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const onChangeQuestionEdit = (questionId: number, next: EditableQuestion) => {
    setQuestionEdits((prev) => ({ ...prev, [questionId]: next }));
  };

  const onSaveQuestion = async (questionId: number) => {
    const payload = questionEdits[questionId];
    if (!payload) return;
    setActionLoading(true);
    setError('');
    try {
      const updated = await patchTeacherQuestion(questionId, payload);
      setRequestQuestions((prev) => prev.map((item) => (item.question_id === questionId ? updated : item)));
      setQuestionEdits((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    } catch (caught: unknown) {
      const message = caught instanceof Error ? caught.message : 'Unable to save question.';
      setError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const onToggleQuestionSelect = (questionId: number, checked: boolean) => {
    setSelectedQuestionIds((prev) => {
      if (checked) {
        if (prev.includes(questionId)) return prev;
        return [...prev, questionId];
      }
      return prev.filter((item) => item !== questionId);
    });
  };

  const onBulkStatus = async (mode: 'approve' | 'reject') => {
    if (selectedQuestionIds.length === 0) {
      setError('Please select at least one draft question.');
      return;
    }
    setActionLoading(true);
    setError('');
    setInfo('');
    try {
      if (mode === 'approve') {
        await bulkApproveTeacherQuestions({ question_ids: selectedQuestionIds });
      } else {
        await bulkRejectTeacherQuestions({ question_ids: selectedQuestionIds });
      }
      if (activeRequestId) {
        await loadRequestQuestions(activeRequestId);
      }
      setSelectedQuestionIds([]);
      setInfo(mode === 'approve' ? 'Selected questions approved.' : 'Selected questions rejected.');
    } catch (caught: unknown) {
      const message = caught instanceof Error ? caught.message : 'Unable to update question statuses.';
      setError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const onCreateManualDraft = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setInfo('');
    if (!currentDocumentTopic) {
      setError('Please select a valid document-topic before creating a manual draft.');
      return;
    }
    if (!manualForm.content.trim()) {
      setError('Manual question content is required.');
      return;
    }
    if (manualForm.options.some((item) => !item.trim())) {
      setError('All manual options must be filled.');
      return;
    }

    setManualSubmitting(true);
    try {
      await createTeacherManualQuestionFromAiGenerator({
        document_topic_id: currentDocumentTopic.document_topic_id,
        content: manualForm.content.trim(),
        difficulty: manualForm.difficulty,
        explanation: manualForm.explanation.trim() || undefined,
        options: manualForm.options.map((item) => item.trim()),
        correct_option_index: manualForm.correct_option_index,
      });
      setManualForm(DEFAULT_MANUAL_FORM);
      setInfo('Manual draft question created.');
    } catch (caught: unknown) {
      const message = caught instanceof Error ? caught.message : 'Unable to create manual draft question.';
      setError(message);
    } finally {
      setManualSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-sm font-bold text-slate-500">Loading AI generator...</div>;
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Teacher AI Question Generator</h1>
        <p className="text-sm text-slate-500">
          Generation requests and draft questions are persisted in database and can be reviewed anytime.
        </p>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</div>}
      {info && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{info}</div>}

      <form onSubmit={onGenerate} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black text-slate-900">Generate AI Questions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <select
            value={subjectId ?? ''}
            onChange={(e) => onSubjectChange(Number(e.target.value))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            {options.subjects.map((item) => (
              <option key={item.subject_id} value={item.subject_id}>
                {item.subject_name}
              </option>
            ))}
          </select>

          <select
            value={topicId ?? ''}
            onChange={(e) => onTopicChange(Number(e.target.value))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            {filteredTopics.map((item) => (
              <option key={item.topic_id} value={item.topic_id}>
                {item.topic_name}
              </option>
            ))}
          </select>

          <select
            value={documentId ?? ''}
            onChange={(e) => setDocumentId(Number(e.target.value))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            {filteredDocuments.length === 0 && <option value="">No document available</option>}
            {filteredDocuments.map((item) => (
              <option key={item.document_id} value={item.document_id}>
                {item.document_title}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <input
            type="number"
            min={1}
            max={100}
            value={numQuestions}
            onChange={(e) => setNumQuestions(Number(e.target.value))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Number of questions"
          />

          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <button
            type="submit"
            disabled={generating || contextHasActiveRequest || !currentDocumentTopic}
            className="rounded-xl bg-[#9B0F06] px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate'}
          </button>
        </div>

        <textarea
          value={contentScope}
          onChange={(e) => setContentScope(e.target.value)}
          placeholder="Optional content scope"
          rows={3}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        {currentDocumentTopic && (
          <p className="text-xs text-slate-500">
            Using `document_topic_id`: <strong>{currentDocumentTopic.document_topic_id}</strong>
          </p>
        )}
      </form>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">AI Requests</h2>
            <button
              type="button"
              onClick={() => refreshRequests(true)}
              className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-bold text-slate-700"
              disabled={refreshingRequests}
            >
              {refreshingRequests ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          <div className="max-h-[420px] space-y-2 overflow-auto">
            {requests.length === 0 && <p className="text-sm text-slate-500">No AI request yet.</p>}
            {requests.map((item) => (
              <div
                key={item.request_id}
                className={`rounded-xl border p-3 ${activeRequestId === item.request_id ? 'border-[#9B0F06] bg-red-50/40' : 'border-slate-200'}`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveRequestId(item.request_id);
                    loadRequestQuestions(item.request_id).catch(() => undefined);
                  }}
                  className="w-full text-left"
                >
                  <p className="text-sm font-bold text-slate-800">
                    Request #{item.request_id} - {item.status}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.document_topic.document_title} / {item.document_topic.topic_name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.num_questions} question(s), {item.difficulty}
                  </p>
                  {item.error_message && <p className="mt-1 text-xs font-bold text-red-600">{item.error_message}</p>}
                </button>
                {item.status === 'failed' && (
                  <button
                    type="button"
                    onClick={() => onRetryFailedRequest(item.request_id)}
                    disabled={actionLoading}
                    className="mt-2 rounded-lg bg-slate-900 px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
                  >
                    Retry
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={onCreateManualDraft} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-900">Create Manual Draft Question</h2>
          <textarea
            value={manualForm.content}
            onChange={(e) => setManualForm((prev) => ({ ...prev, content: e.target.value }))}
            rows={3}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Question content"
          />
          <select
            value={manualForm.difficulty}
            onChange={(e) => setManualForm((prev) => ({ ...prev, difficulty: e.target.value as Difficulty }))}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          {manualForm.options.map((opt, idx) => (
            <input
              key={idx}
              value={opt}
              onChange={(e) =>
                setManualForm((prev) => {
                  const nextOptions = [...prev.options];
                  nextOptions[idx] = e.target.value;
                  return { ...prev, options: nextOptions };
                })
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder={`Option ${String.fromCharCode(65 + idx)}`}
            />
          ))}
          <div className="grid grid-cols-2 gap-3">
            <select
              value={manualForm.correct_option_index}
              onChange={(e) =>
                setManualForm((prev) => ({ ...prev, correct_option_index: Number(e.target.value) }))
              }
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value={0}>Correct: A</option>
              <option value={1}>Correct: B</option>
              <option value={2}>Correct: C</option>
              <option value={3}>Correct: D</option>
            </select>
            <button
              type="submit"
              disabled={manualSubmitting || !currentDocumentTopic}
              className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {manualSubmitting ? 'Saving...' : 'Create Draft'}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-black text-slate-900">Draft Questions Review</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onBulkStatus('approve')}
              disabled={actionLoading || selectedQuestionIds.length === 0}
              className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
            >
              Approve Selected
            </button>
            <button
              type="button"
              onClick={() => onBulkStatus('reject')}
              disabled={actionLoading || selectedQuestionIds.length === 0}
              className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
            >
              Reject Selected
            </button>
          </div>
        </div>

        {activeRequest && (
          <p className="text-xs text-slate-500">
            Active request: #{activeRequest.request_id} ({activeRequest.status})
          </p>
        )}

        {requestQuestions.length === 0 && <p className="text-sm text-slate-500">No generated question yet.</p>}

        <div className="space-y-4">
          {requestQuestions.map((question) => {
            const editState = questionEdits[question.question_id] || normalizeQuestionForEdit(question);
            const isChecked = selectedQuestionIds.includes(question.question_id);
            return (
              <div key={question.question_id} className="space-y-2 rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => onToggleQuestionSelect(question.question_id, e.target.checked)}
                  />
                  <span className="text-xs font-bold text-slate-500">#{question.question_id}</span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                    {question.status}
                  </span>
                </div>

                <textarea
                  value={editState.content}
                  onChange={(e) =>
                    onChangeQuestionEdit(question.question_id, {
                      ...editState,
                      content: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />

                <div className="grid gap-2 md:grid-cols-2">
                  {editState.options.map((opt, idx) => (
                    <input
                      key={idx}
                      value={opt}
                      onChange={(e) => {
                        const nextOptions = [...editState.options];
                        nextOptions[idx] = e.target.value;
                        onChangeQuestionEdit(question.question_id, {
                          ...editState,
                          options: nextOptions,
                        });
                      }}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                    />
                  ))}
                </div>

                <div className="grid gap-2 md:grid-cols-3">
                  <select
                    value={editState.difficulty}
                    onChange={(e) =>
                      onChangeQuestionEdit(question.question_id, {
                        ...editState,
                        difficulty: e.target.value as Difficulty,
                      })
                    }
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                  <select
                    value={editState.correct_option_index}
                    onChange={(e) =>
                      onChangeQuestionEdit(question.question_id, {
                        ...editState,
                        correct_option_index: Number(e.target.value),
                      })
                    }
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value={0}>Correct: A</option>
                    <option value={1}>Correct: B</option>
                    <option value={2}>Correct: C</option>
                    <option value={3}>Correct: D</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => onSaveQuestion(question.question_id)}
                    disabled={actionLoading}
                    className="rounded-lg bg-[#9B0F06] px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
                  >
                    Save Draft Edit
                  </button>
                </div>

                <input
                  value={editState.explanation}
                  onChange={(e) =>
                    onChangeQuestionEdit(question.question_id, {
                      ...editState,
                      explanation: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Explanation"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
