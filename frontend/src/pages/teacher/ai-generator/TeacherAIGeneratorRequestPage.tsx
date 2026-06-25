import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  confirmTeacherAiRequestReview,
  getTeacherAiRequestQuestions,
  type DifficultyLevel,
  type QuestionStatus,
} from '@/api/teacherAIGeneratorApi';
import { useTeacherAIGeneratorContext } from './TeacherAIGeneratorLayout';
import type { EditableQuestion, ReviewableStatus } from './types';
import { mapQuestionToEditable } from './types';
import {
  badgeClass,
  DIFFICULTY_LABELS,
  DIFFICULTY_ORDER,
  formatDateTime,
  formatDifficultyDistribution,
  formatDocumentTopicContext,
  getQuestionStatusBadge,
  getRequestProgressDetail,
  getRequestStatusBadge,
  inputClass,
  pageCardClass,
} from './utils';

export default function TeacherAIGeneratorRequestPage() {
  const navigate = useNavigate();
  const params = useParams();
  const requestId = Number(params.requestId || 0);
  const {
    clearMessages,
    loadRequests,
    requests,
    setError,
    setRequests,
    setSuccess,
  } = useTeacherAIGeneratorContext();

  const request = useMemo(
    () => requests.find((item) => item.request_id === requestId) || null,
    [requestId, requests],
  );

  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewQuestions, setReviewQuestions] = useState<EditableQuestion[]>([]);

  const reviewReadOnly = Boolean(request?.is_reviewed);

  useEffect(() => {
    if (!requestId) {
      setError('Tiến trình AI không hợp lệ.');
      navigate('/teacher/ai-generator');
      return;
    }

    if (!request) {
      loadRequests(true).catch(() => undefined);
    }
  }, [loadRequests, navigate, request, requestId, setError]);

  useEffect(() => {
    if (!request || request.status !== 'completed') return;

    const loadQuestions = async () => {
      setLoadingQuestions(true);
      setReviewError('');
      try {
        const rows = await getTeacherAiRequestQuestions(request.request_id);
        setReviewQuestions(rows.map((item) => mapQuestionToEditable(item, Boolean(request.is_reviewed))));
      } catch (caught: unknown) {
        setReviewError(caught instanceof Error ? caught.message : 'Không thể tải danh sách câu hỏi của tiến trình này.');
      } finally {
        setLoadingQuestions(false);
      }
    };

    loadQuestions().catch(() => undefined);
  }, [request]);

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
    if (!request || reviewReadOnly || submittingReview) return;
    clearMessages();
    setReviewError('');

    for (const question of reviewQuestions) {
      if (!question.content.trim()) {
        setReviewError(`Nội dung câu hỏi #${question.question_id} không được để trống.`);
        return;
      }
      if (question.status === 'inactive') {
        setReviewError(`Câu hỏi #${question.question_id} đang ở trạng thái không hợp lệ.`);
        return;
      }
      if (question.options.length !== 4) {
        setReviewError(`Câu hỏi #${question.question_id} phải có đúng 4 đáp án.`);
        return;
      }
      if (question.options.some((option) => !option.option_text.trim())) {
        setReviewError(`Câu hỏi #${question.question_id} có đáp án trống.`);
        return;
      }
      if (question.options.filter((option) => option.is_correct).length !== 1) {
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

      const result = await confirmTeacherAiRequestReview(request.request_id, payload);
      setRequests((prev) =>
        prev.map((item) => (
          item.request_id === request.request_id
            ? { ...item, ...result.request }
            : item
        )),
      );
      setSuccess('Đã xác nhận rà soát câu hỏi AI thành công.');
    } catch (caught: unknown) {
      const message = caught instanceof Error ? caught.message : 'Không thể xác nhận rà soát câu hỏi.';
      setReviewError(message);
      if (message.toLowerCase().includes('already reviewed')) {
        await loadRequests(true);
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!request) {
    return (
      <div className={`${pageCardClass} p-10 text-center`}>
        <p className="text-sm font-black uppercase tracking-widest text-slate-400">Đang tải thông tin tiến trình...</p>
      </div>
    );
  }

  const badge = getRequestStatusBadge(request.status);
  const progress = getRequestProgressDetail(request);

  return (
    <div className="space-y-6">
      <section className={`${pageCardClass} p-8`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Chi tiết tiến trình AI</p>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-slate-900 italic">
              Tiến trình #{request.request_id}
            </h2>
            <p className="mt-3 text-sm font-bold text-slate-500">
              {formatDocumentTopicContext(request.document_topic)}
            </p>
            <p className="mt-1 text-sm font-bold text-slate-500">{request.document_topic.document_title}</p>
          </div>

          <div className="text-right">
            <span className={`${badgeClass} ${badge.cls}`}>{badge.label}</span>
            <p className="mt-3 text-xs font-bold text-slate-500">Tạo lúc: {formatDateTime(request.created_at)}</p>
            <p className="mt-1 text-xs font-bold text-slate-500">Cập nhật: {formatDateTime(request.updated_at)}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Số lượng</p>
            <p className="mt-2 text-lg font-black text-slate-900">{request.generated_question_count}/{request.num_questions} câu</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Phân phối độ khó</p>
            <p className="mt-2 text-sm font-bold text-slate-700">{formatDifficultyDistribution(request.difficulty_distribution)}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Phạm vi nội dung</p>
            <p className="mt-2 text-sm font-bold text-slate-700">{request.content_scope || 'Toàn bộ tài liệu đã chọn'}</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{progress.stepLabel}</p>
          <p className="mt-2 text-sm font-bold text-slate-600">{progress.detail}</p>
          <div className="mt-4 h-3 w-full rounded-full bg-white">
            <div
              className="h-full rounded-full bg-[var(--color-primary)] transition-all"
              style={{ width: `${progress.progressPercent}%` }}
            />
          </div>
          <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            Tiến độ: {progress.progressPercent}%
          </p>
        </div>

        {request.error_message && (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-[var(--color-primary)]">
            {request.error_message}
          </div>
        )}
      </section>

      {request.status !== 'completed' ? (
        <section className={`${pageCardClass} p-8 text-center`}>
          <p className="text-sm font-black uppercase tracking-widest text-slate-400">Tiến trình chưa sẵn sàng để rà soát</p>
          <p className="mt-3 text-sm font-bold text-slate-500">Trang này sẽ tự cập nhật khi tiến trình chuyển trạng thái hoàn tất.</p>
          <Link
            to="/teacher/ai-generator"
            className="mt-6 inline-flex rounded-2xl border border-slate-200 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all hover:border-slate-300 hover:text-slate-800"
          >
            Quay lại tạo tiến trình
          </Link>
        </section>
      ) : (
        <section className={`${pageCardClass} p-8`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Rà soát câu hỏi</p>
              <h3 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-900">
                {reviewReadOnly ? 'Chế độ chỉ xem' : 'Chế độ chỉnh sửa'}
              </h3>
            </div>
            {!reviewReadOnly && (
              <button
                type="button"
                onClick={handleConfirmReview}
                disabled={submittingReview || loadingQuestions || reviewQuestions.length === 0}
                className="rounded-xl bg-[var(--color-primary)] px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-[var(--color-primary-dark)] disabled:opacity-50"
              >
                {submittingReview ? 'Đang xác nhận...' : 'Xác nhận rà soát'}
              </button>
            )}
          </div>

          {reviewError && (
            <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-[var(--color-primary)]">
              {reviewError}
            </div>
          )}

          <div className="mt-6 space-y-4">
            {loadingQuestions ? (
              <div className="rounded-[2rem] border-4 border-dashed border-slate-100 p-12 text-center">
                <p className="text-sm font-black uppercase tracking-widest text-slate-400">Đang tải câu hỏi...</p>
              </div>
            ) : reviewQuestions.length === 0 ? (
              <div className="rounded-[2rem] border-4 border-dashed border-slate-100 p-12 text-center">
                <p className="text-sm font-black uppercase tracking-widest text-slate-400">Tiến trình này chưa có câu hỏi khả dụng.</p>
              </div>
            ) : (
              reviewQuestions.map((question, questionIndex) => {
                const statusBadge = getQuestionStatusBadge(question.status);
                return (
                  <article key={question.question_id} className="space-y-4 rounded-[1.75rem] border border-slate-100 bg-slate-50/60 p-5">
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
                              difficulty: event.target.value as DifficultyLevel,
                            })
                          }
                          className={inputClass}
                        >
                          {DIFFICULTY_ORDER.map((difficulty) => (
                            <option key={difficulty} value={difficulty}>
                              {DIFFICULTY_LABELS[difficulty]}
                            </option>
                          ))}
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
                          <option value="draft">Nháp</option>
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
                        <div key={`${question.question_id}-${option.order_num}`} className="rounded-xl border border-slate-200 bg-white p-3">
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
                                className="h-8 w-8 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40"
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                disabled={reviewReadOnly || optionIndex === question.options.length - 1}
                                onClick={() => moveOption(question.question_id, optionIndex, 1)}
                                className="h-8 w-8 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40"
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
        </section>
      )}
    </div>
  );
}
