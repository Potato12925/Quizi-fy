import type {
  DifficultyLevel,
  QuestionStatus,
  TeacherAiQuestionItem,
} from '@/api/teacherAIGeneratorApi';

export type ReviewableStatus = Extract<QuestionStatus, 'draft' | 'approved' | 'rejected'>;
export type DistributionInputMode = 'question_count' | 'percentage';

export interface EditableOption {
  option_id: number;
  option_text: string;
  is_correct: boolean;
  order_num: number;
  option_label: string;
}

export interface EditableQuestion {
  question_id: number;
  content: string;
  explanation: string;
  difficulty: DifficultyLevel;
  status: QuestionStatus;
  options: EditableOption[];
}

export interface DifficultyDistributionDraftItem {
  difficulty: DifficultyLevel;
  question_count: number;
  percentage: number;
}

export const mapQuestionToEditable = (
  question: TeacherAiQuestionItem,
  readOnly: boolean,
): EditableQuestion => {
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
