import type {
  DifficultyLevel,
  QuestionStatus,
  TeacherDocumentTopicOption,
  TeacherAiRequestDifficultyDistribution,
  TeacherAiRequestItem,
} from '@/api/teacherAIGeneratorApi';
import type { DifficultyDistributionDraftItem } from './types';

export const pageCardClass = 'rounded-[2.5rem] border border-slate-100 bg-white shadow-sm';
export const inputClass = 'mt-2 w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition-all focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400';
export const badgeClass = 'inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest';

export const DIFFICULTY_ORDER: DifficultyLevel[] = ['recognition', 'comprehension', 'application', 'advanced'];
export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  recognition: 'Nhận biết',
  comprehension: 'Thông hiểu',
  application: 'Vận dụng',
  advanced: 'Vận dụng cao',
};

export const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN');
};

export const formatFileSize = (bytes?: number | null) => {
  if (!bytes || bytes <= 0) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const clampNonNegativeInteger = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
};

const allocateByLargestRemainder = (
  values: Record<DifficultyLevel, number>,
  target: number,
) => {
  const normalizedTarget = clampNonNegativeInteger(target);
  const rows = DIFFICULTY_ORDER.map((difficulty) => {
    const raw = Math.max(0, Number(values[difficulty] || 0));
    const floorValue = Math.floor(raw);
    return {
      difficulty,
      raw,
      floorValue,
      remainder: raw - floorValue,
    };
  });

  let allocated = rows.reduce((sum, item) => sum + item.floorValue, 0);
  const result = Object.fromEntries(
    rows.map((item) => [item.difficulty, item.floorValue]),
  ) as Record<DifficultyLevel, number>;

  const ranked = [...rows].sort((left, right) => {
    if (right.remainder !== left.remainder) return right.remainder - left.remainder;
    return DIFFICULTY_ORDER.indexOf(left.difficulty) - DIFFICULTY_ORDER.indexOf(right.difficulty);
  });

  let cursor = 0;
  while (allocated < normalizedTarget && ranked.length > 0) {
    const current = ranked[cursor % ranked.length];
    result[current.difficulty] += 1;
    allocated += 1;
    cursor += 1;
  }

  return result;
};

const getPercentagesFromCounts = (
  items: DifficultyDistributionDraftItem[],
  totalQuestions: number,
) => {
  const normalizedTotal = clampNonNegativeInteger(totalQuestions);
  if (normalizedTotal <= 0) {
    return Object.fromEntries(
      DIFFICULTY_ORDER.map((difficulty) => [difficulty, 0]),
    ) as Record<DifficultyLevel, number>;
  }

  const totalCount = items.reduce((sum, item) => sum + clampNonNegativeInteger(item.question_count), 0);
  const rawPercentages = Object.fromEntries(
    items.map((item) => [
      item.difficulty,
      (clampNonNegativeInteger(item.question_count) / normalizedTotal) * 100,
    ]),
  ) as Record<DifficultyLevel, number>;

  if (totalCount === normalizedTotal) {
    return allocateByLargestRemainder(rawPercentages, 100);
  }

  return Object.fromEntries(
    DIFFICULTY_ORDER.map((difficulty) => [difficulty, Math.round(rawPercentages[difficulty] || 0)]),
  ) as Record<DifficultyLevel, number>;
};

const getCountsFromPercentages = (
  items: DifficultyDistributionDraftItem[],
  totalQuestions: number,
) => {
  const normalizedTotal = clampNonNegativeInteger(totalQuestions);
  if (normalizedTotal <= 0) {
    return Object.fromEntries(
      DIFFICULTY_ORDER.map((difficulty) => [difficulty, 0]),
    ) as Record<DifficultyLevel, number>;
  }

  const totalPercentage = items.reduce((sum, item) => sum + clampNonNegativeInteger(item.percentage), 0);
  const rawCounts = Object.fromEntries(
    items.map((item) => [
      item.difficulty,
      (clampNonNegativeInteger(item.percentage) / 100) * normalizedTotal,
    ]),
  ) as Record<DifficultyLevel, number>;

  if (totalPercentage === 100) {
    return allocateByLargestRemainder(rawCounts, normalizedTotal);
  }

  return Object.fromEntries(
    DIFFICULTY_ORDER.map((difficulty) => [difficulty, Math.round(rawCounts[difficulty] || 0)]),
  ) as Record<DifficultyLevel, number>;
};

export const applyPercentagesFromCounts = (
  items: DifficultyDistributionDraftItem[],
  totalQuestions: number,
): DifficultyDistributionDraftItem[] => {
  const percentages = getPercentagesFromCounts(items, totalQuestions);
  return DIFFICULTY_ORDER.map((difficulty) => {
    const current = items.find((item) => item.difficulty === difficulty);
    return {
      difficulty,
      question_count: clampNonNegativeInteger(current?.question_count || 0),
      percentage: percentages[difficulty],
    };
  });
};

export const applyCountsFromPercentages = (
  items: DifficultyDistributionDraftItem[],
  totalQuestions: number,
): DifficultyDistributionDraftItem[] => {
  const counts = getCountsFromPercentages(items, totalQuestions);
  return DIFFICULTY_ORDER.map((difficulty) => {
    const current = items.find((item) => item.difficulty === difficulty);
    return {
      difficulty,
      question_count: counts[difficulty],
      percentage: clampNonNegativeInteger(current?.percentage || 0),
    };
  });
};

export const buildInitialDifficultyDistribution = (totalQuestions: number): DifficultyDistributionDraftItem[] => {
  const base = DIFFICULTY_ORDER.map((difficulty) => ({
    difficulty,
    question_count: 0,
    percentage: 25,
  }));
  return applyCountsFromPercentages(base, totalQuestions);
};

const getDifficultyLabel = (difficulty: DifficultyLevel) => DIFFICULTY_LABELS[difficulty] || difficulty;

export const formatDifficultyDistribution = (
  distribution?: TeacherAiRequestDifficultyDistribution[],
) => {
  if (!distribution?.length) return 'Chưa có phân phối mức độ';

  return DIFFICULTY_ORDER
    .map((difficulty) => distribution.find((item) => item.difficulty === difficulty))
    .filter((item): item is TeacherAiRequestDifficultyDistribution => Boolean(item))
    .map((item) => {
      const label = getDifficultyLabel(item.difficulty);
      const countText = `${item.question_count ?? 0} câu`;
      const percentageText = item.percentage != null ? ` (${item.percentage}%)` : '';
      return `${label}: ${countText}${percentageText}`;
    })
    .join(' | ');
};

export const formatDocumentTopicContext = (
  item?: Pick<
    TeacherDocumentTopicOption,
    'class_code' | 'class_name' | 'subject_code' | 'subject_name' | 'topic_name'
  > | null,
) => {
  if (!item) return '-';

  const classLabel = [item.class_code, item.class_name].filter(Boolean).join(' - ');
  const subjectLabel = [item.subject_code, item.subject_name].filter(Boolean).join(' - ');
  const context = [classLabel, subjectLabel].filter(Boolean).join(' | ');

  return [context, item.topic_name].filter(Boolean).join(' -> ') || '-';
};

export const getRequestStatusBadge = (status: TeacherAiRequestItem['status']) => {
  if (status === 'completed') return { label: 'Hoàn tất', cls: 'bg-emerald-50 text-emerald-600' };
  if (status === 'failed') return { label: 'Thất bại', cls: 'bg-red-50 text-[var(--color-primary)]' };
  if (status === 'processing') return { label: 'Đang xử lý', cls: 'bg-amber-50 text-amber-600' };
  if (status === 'pending') return { label: 'Đang chờ', cls: 'bg-slate-100 text-slate-600' };
  return { label: 'Đã hủy', cls: 'bg-slate-200 text-slate-600' };
};

export const getQuestionStatusBadge = (status: QuestionStatus) => {
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

export const getRequestProgressDetail = (request: TeacherAiRequestItem) => {
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
