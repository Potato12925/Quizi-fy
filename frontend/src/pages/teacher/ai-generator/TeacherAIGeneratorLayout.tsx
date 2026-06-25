import { Link, Outlet, useLocation, useOutletContext } from 'react-router-dom';
import { type TeacherAiRequestItem } from '@/api/teacherAIGeneratorApi';
import { useTeacherAiGeneratorRequests } from '@/hooks/useTeacherAiGeneratorRequests';
import {
  badgeClass,
  formatDateTime,
  formatDifficultyDistribution,
  formatDocumentTopicContext,
  getRequestProgressDetail,
  getRequestStatusBadge,
  pageCardClass,
} from './utils';

export type TeacherAIGeneratorOutletContext = ReturnType<typeof useTeacherAiGeneratorRequests>;

export const useTeacherAIGeneratorContext = () => useOutletContext<TeacherAIGeneratorOutletContext>();

export default function TeacherAIGeneratorLayout() {
  const location = useLocation();
  const context = useTeacherAiGeneratorRequests();
  const currentRequestId = location.pathname.match(/\/teacher\/ai-generator\/requests\/(\d+)/)?.[1];

  const renderRequestActions = (item: TeacherAiRequestItem) => {
    if (item.status === 'failed') {
      return (
        <div className="flex flex-wrap gap-2 mt-4">
          <Link
            to={`/teacher/ai-generator/requests/${item.request_id}`}
            className="rounded-xl bg-slate-900 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-black"
          >
            Xem chi tiết
          </Link>
          <button
            type="button"
            disabled={context.retryingRequestId === item.request_id}
            onClick={() => context.retryRequest(item.request_id).catch(() => undefined)}
            className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-[var(--color-primary-dark)] disabled:opacity-50"
          >
            {context.retryingRequestId === item.request_id ? 'Đang gửi retry...' : 'Retry job'}
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap gap-2 mt-4">
        <Link
          to={`/teacher/ai-generator/requests/${item.request_id}`}
          className="rounded-xl bg-slate-900 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-black"
        >
          {item.status === 'completed'
            ? item.is_reviewed ? 'Xem câu hỏi' : 'Rà soát câu hỏi'
            : 'Theo dõi'}
        </Link>
      </div>
    );
  };

  return (
    <div className="pb-20 space-y-10 duration-700 animate-in fade-in slide-in-from-bottom-8">
      <section className="flex flex-col items-start justify-between gap-6 pt-2 xl:flex-row xl:items-end">
        <div>
          <p className="mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Tạo câu hỏi bằng AI</p>
          <h1 className="text-5xl italic font-black leading-none tracking-tighter uppercase text-slate-900 lg:text-6xl">
            Tạo bộ <br />
            <span className="text-[var(--color-primary)]">câu hỏi bằng AI</span>
          </h1>
        </div>
      </section>

      {context.error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-[var(--color-primary)]">
          {context.error}
        </div>
      )}
      {context.success && (
        <div className="px-5 py-4 text-sm font-bold border rounded-2xl border-emerald-100 bg-emerald-50 text-emerald-700">
          {context.success}
        </div>
      )}

      <section className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <Outlet context={context} />
        </div>

        <aside className="space-y-6 xl:col-span-5">
          <section className={`${pageCardClass} p-8`}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-xl font-black tracking-tight uppercase text-slate-900">Danh sách tạo câu hỏi bằng AI</h2>
                <p className="mt-2 text-sm font-bold text-slate-500">Theo dõi tiến trình và mở trang rà soát khi tiến trình hoàn tất.</p>
              </div>
              <button
                type="button"
                onClick={() => context.loadRequests(false).catch(() => undefined)}
                disabled={context.refreshingRequests}
                className="rounded-xl border border-slate-200 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all hover:border-slate-300 hover:text-slate-800 disabled:opacity-50"
              >
                {context.refreshingRequests ? 'Đang làm mới...' : 'Làm mới'}
              </button>
            </div>

            {context.loadingRequests ? (
              <div className="border-4 border-dashed border-slate-100 rounded-[2rem] p-10 text-center">
                <p className="text-sm font-black tracking-widest uppercase text-slate-400">Đang tải danh sách job...</p>
              </div>
            ) : !context.requests.length ? (
              <div className="border-4 border-dashed border-slate-100 rounded-[2rem] p-10 text-center">
                <p className="text-sm font-black tracking-widest uppercase text-slate-400">Chưa có việc tạo câu hỏi AI nào</p>
                <p className="mt-2 text-xs font-bold text-slate-400">Tạo yêu cầu ở trang bên trái để bắt đầu.</p>
              </div>
            ) : (
              <div className="max-h-[860px] space-y-3 overflow-auto pr-1">
                {context.requests.map((item) => {
                  const badge = getRequestStatusBadge(item.status);
                  const progress = getRequestProgressDetail(item);
                  const isSelected = currentRequestId === String(item.request_id);

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
                        <p className="text-sm font-black text-slate-900">Tiến trình #{item.request_id}</p>
                        <span className={`${badgeClass} ${badge.cls}`}>{badge.label}</span>
                      </div>

                      <p className="text-xs font-black text-slate-700">{formatDocumentTopicContext(item.document_topic)}</p>
                      <p className="mt-1 text-xs font-bold text-slate-600">{item.document_topic.document_title}</p>
                      <p className="mt-2 text-[11px] font-bold text-slate-500">
                        {item.num_questions} câu | Sinh được: {item.generated_question_count}
                      </p>
                      <p className="mt-1 text-[11px] font-bold text-slate-500">
                        {formatDifficultyDistribution(item.difficulty_distribution)}
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

                      <p className="mt-2 text-[11px] font-bold text-slate-400">Tạo lúc: {formatDateTime(item.created_at)}</p>
                      {item.is_reviewed && <p className="mt-1 text-[11px] font-bold text-emerald-600">Đã rà soát</p>}
                      {item.error_message && <p className="mt-2 text-xs font-black text-[var(--color-primary)]">Lỗi: {item.error_message}</p>}

                      {renderRequestActions(item)}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </aside>
      </section>
    </div>
  );
}
