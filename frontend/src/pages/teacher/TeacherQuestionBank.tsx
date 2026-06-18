import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingState from '@/components/common/LoadingState';
import {
  deleteTeacherQuestionImage,
  uploadTeacherQuestionImage,
} from '@/api/teacherQuestionImageApi';
import {
  createTeacherManualQuestion,
  getAssignedSubjects,
  getDocumentTopicOptions,
  getTeacherQuestionBank,
  getTeacherQuestionImageErrorMessage,
  getTopicsBySubjectId,
  softDeleteTeacherQuestion,
  type AssignedSubject,
  type DocumentTopicOption,
  type ManualQuestionPayloadV2,
  type QuestionDifficulty,
  type TeacherQuestionBankItem,
  type TopicItem,
  updateTeacherQuestion,
  updateTeacherQuestionStatus,
} from '@/api/teacherQuestionBankApi';

type ModalMode = 'create' | 'edit' | 'view';

type FormState = {
  subjectId: string;
  topicId: string;
  documentTopicId: string;
  imageId: string;
  imageUrl: string;
  content: string;
  difficulty: QuestionDifficulty;
  status: 'draft' | 'approved' | 'inactive' | 'rejected';
  options: string[];
  correctOptionIndex: number;
  explanation: string;
};

const DIFFICULTY_OPTIONS: { value: QuestionDifficulty; label: string }[] = [
  { value: 'recognition', label: 'Nhận biết' },
  { value: 'comprehension', label: 'Thông hiểu' },
  { value: 'application', label: 'Vận dụng' },
  { value: 'advanced', label: 'Vận dụng cao' },
];

const DIFFICULTY_LABELS: Record<QuestionDifficulty, string> = {
  recognition: 'Nhận biết',
  comprehension: 'Thông hiểu',
  application: 'Vận dụng',
  advanced: 'Vận dụng cao',
};

const buildInitialFormState = (overrides: Partial<FormState> = {}): FormState => ({
  subjectId: '',
  topicId: '',
  documentTopicId: '',
  imageId: '',
  imageUrl: '',
  content: '',
  difficulty: 'comprehension',
  status: 'draft',
  options: ['', '', '', ''],
  correctOptionIndex: 0,
  explanation: '',
  ...overrides,
});

const getQuestionImageUrl = (question: TeacherQuestionBankItem) => question.image?.file_url || '';

const getDifficultyLabel = (difficulty: QuestionDifficulty) => DIFFICULTY_LABELS[difficulty] || difficulty;

const formatFileSize = (bytes?: number | null) => {
  if (!bytes || bytes <= 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export default function QuestionBankPage() {
  const [subjects, setSubjects] = useState<AssignedSubject[]>([]);
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [modalTopics, setModalTopics] = useState<TopicItem[]>([]);
  const [documentTopicOptions, setDocumentTopicOptions] = useState<DocumentTopicOption[]>([]);
  const [questions, setQuestions] = useState<TeacherQuestionBankItem[]>([]);

  const [activeSubject, setActiveSubject] = useState('');
  const [activeTopic, setActiveTopic] = useState<'all' | string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | QuestionDifficulty>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'approved' | 'inactive' | 'rejected'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'manual' | 'ai'>('all');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingQuestionId, setProcessingQuestionId] = useState<number | null>(null);
  const [brokenListImageIds, setBrokenListImageIds] = useState<number[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormState>(buildInitialFormState());
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalImageBroken, setIsModalImageBroken] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  const modalImagePreviewUrlRef = useRef<string | null>(null);

  const resetModalImagePreviewUrl = () => {
    if (modalImagePreviewUrlRef.current) {
      URL.revokeObjectURL(modalImagePreviewUrlRef.current);
      modalImagePreviewUrlRef.current = null;
    }
  };

  const closeModal = () => {
    resetModalImagePreviewUrl();
    setSelectedImageFile(null);
    setIsModalImageBroken(false);
    setFormError('');
    setSelectedQuestionId(null);
    setIsModalOpen(false);
  };

  const loadQuestions = async (subjectIdArg?: string, topicIdArg?: string) => {
    const subjectId = subjectIdArg || activeSubject;
    const topicId = topicIdArg || activeTopic;
    if (!subjectId) return;

    setIsLoading(true);
    setError('');
    try {
      const result = await getTeacherQuestionBank({
        page: 1,
        limit: 100,
        subject_id: Number(subjectId),
        topic_id: topicId !== 'all' ? Number(topicId) : undefined,
        difficulty: difficultyFilter !== 'all' ? difficultyFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        source: sourceFilter !== 'all' ? sourceFilter : undefined,
        keyword: searchQuery.trim() || undefined,
      });
      setQuestions(result.items || []);
      setBrokenListImageIds([]);
    } catch {
      setError('Không thể tải dữ liệu ngân hàng câu hỏi');
    } finally {
      setIsLoading(false);
    }
  };

  const loadModalDocumentTopics = async (
    subjectId: string,
    topicId: string,
    currentDocumentTopicId?: string,
  ) => {
    if (!subjectId) {
      setDocumentTopicOptions([]);
      return;
    }

    const options = await getDocumentTopicOptions(
      Number(subjectId),
      topicId ? Number(topicId) : undefined,
    );
    setDocumentTopicOptions(options);

    const hasCurrent = currentDocumentTopicId
      ? options.some((item) => String(item.document_topic_id) === currentDocumentTopicId)
      : false;

    setFormData((prev) => ({
      ...prev,
      documentTopicId: hasCurrent
        ? currentDocumentTopicId || ''
        : options[0]
          ? String(options[0].document_topic_id)
          : '',
    }));
  };

  const openCreateModal = async () => {
    resetModalImagePreviewUrl();
    setSelectedImageFile(null);
    setIsModalImageBroken(false);
    setFormError('');
    setModalMode('create');
    setSelectedQuestionId(null);
    setModalTopics(topics);

    const initialTopicId = topics[0] ? String(topics[0].topic_id) : '';
    setFormData(
      buildInitialFormState({
        subjectId: activeSubject,
        topicId: initialTopicId,
      }),
    );

    if (activeSubject) {
      await loadModalDocumentTopics(activeSubject, initialTopicId);
    } else {
      setDocumentTopicOptions([]);
    }

    setIsModalOpen(true);
  };

  const openModalWithQuestion = async (question: TeacherQuestionBankItem, mode: ModalMode) => {
    resetModalImagePreviewUrl();
    setSelectedImageFile(null);
    setIsModalImageBroken(false);
    setFormError('');
    setModalMode(mode);
    setSelectedQuestionId(question.question_id);

    const subjectId = String(question.subject_id);
    const loadedTopics = await getTopicsBySubjectId(Number(subjectId));
    setModalTopics(loadedTopics);

    const sortedOptions = [...question.options].sort((left, right) => left.order_num - right.order_num);
    const correctIndex = sortedOptions.findIndex((option) => option.is_correct);

    setFormData(
      buildInitialFormState({
        subjectId,
        topicId: String(question.topic_id),
        documentTopicId: String(question.document_topic_id),
        imageId: question.image_id != null ? String(question.image_id) : '',
        imageUrl: getQuestionImageUrl(question),
        content: question.content,
        difficulty: question.difficulty,
        status: question.status,
        options: sortedOptions.map((option) => option.option_text).concat(['', '', '', '']).slice(0, 4),
        correctOptionIndex: correctIndex >= 0 ? correctIndex : 0,
        explanation: question.explanation || '',
      }),
    );

    await loadModalDocumentTopics(
      subjectId,
      String(question.topic_id),
      String(question.document_topic_id),
    );
    setIsModalOpen(true);
  };

  const handleImageFileChange = (file: File | null) => {
    resetModalImagePreviewUrl();
    setSelectedImageFile(file);
    setIsModalImageBroken(false);

    if (!file) {
      setFormData((prev) => ({
        ...prev,
        imageId: '',
        imageUrl: '',
      }));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    modalImagePreviewUrlRef.current = objectUrl;
    setFormData((prev) => ({
      ...prev,
      imageId: '',
      imageUrl: objectUrl,
    }));
  };

  const handleRemoveImage = () => {
    resetModalImagePreviewUrl();
    setSelectedImageFile(null);
    setIsModalImageBroken(false);
    setFormData((prev) => ({
      ...prev,
      imageId: '',
      imageUrl: '',
    }));
  };

  const handleDelete = async (questionId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này khỏi ngân hàng không?')) return;

    setProcessingQuestionId(questionId);
    try {
      await softDeleteTeacherQuestion(questionId);
      await loadQuestions();
    } catch {
      alert('Không thể xóa câu hỏi lúc này');
    } finally {
      setProcessingQuestionId(null);
    }
  };

  const handleToggleVisibility = async (question: TeacherQuestionBankItem) => {
    const nextStatus = question.status === 'inactive' ? 'draft' : 'inactive';
    const confirmMessage =
      nextStatus === 'inactive'
        ? 'Bạn có chắc chắn muốn ẩn câu hỏi này không?'
        : 'Bạn có muốn hiện lại câu hỏi này không?';
    if (!window.confirm(confirmMessage)) return;

    setProcessingQuestionId(question.question_id);
    try {
      await updateTeacherQuestionStatus(question.question_id, nextStatus);
      await loadQuestions();
    } catch {
      alert('Không thể cập nhật trạng thái hiển thị của câu hỏi lúc này');
    } finally {
      setProcessingQuestionId(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (modalMode === 'view') return;

    setFormError('');

    if (!formData.subjectId) {
      setFormError('Vui lòng chọn môn học');
      return;
    }
    if (!formData.topicId) {
      setFormError('Vui lòng chọn chương học');
      return;
    }
    if (!formData.documentTopicId) {
      setFormError('Vui lòng chọn tài liệu nguồn');
      return;
    }
    if (!formData.content.trim()) {
      setFormError('Nội dung câu hỏi không được để trống');
      return;
    }

    const trimmedOptions = formData.options.map((option) => option.trim());
    if (trimmedOptions.some((option) => !option)) {
      setFormError('Vui lòng nhập đầy đủ 4 đáp án');
      return;
    }

    if (formData.correctOptionIndex < 0 || formData.correctOptionIndex >= trimmedOptions.length) {
      setFormError('Đáp án đúng không hợp lệ');
      return;
    }

    if (!['draft', 'approved'].includes(formData.status)) {
      setFormError('Trạng thái chỉ được chọn Nháp hoặc Đã duyệt');
      return;
    }

    const payload: ManualQuestionPayloadV2 = {
      document_topic_id: Number(formData.documentTopicId),
      image_id: formData.imageId.trim() ? Number(formData.imageId.trim()) : null,
      content: formData.content.trim(),
      difficulty: formData.difficulty,
      status: formData.status,
      explanation: formData.explanation.trim() || undefined,
      options: trimmedOptions,
      correct_option_index: formData.correctOptionIndex,
    };

    setIsSubmitting(true);
    let uploadedImageId: number | null = null;
    try {
      if (selectedImageFile) {
        const uploadedImage = await uploadTeacherQuestionImage(selectedImageFile);
        uploadedImageId = uploadedImage.image_id;
        payload.image_id = uploadedImage.image_id;
      }

      if (modalMode === 'create') {
        await createTeacherManualQuestion(payload);
      } else if (selectedQuestionId) {
        await updateTeacherQuestion(selectedQuestionId, payload);
      }
      closeModal();
      await loadQuestions();
    } catch (submitError) {
      if (uploadedImageId != null) {
        try {
          await deleteTeacherQuestionImage(uploadedImageId);
        } catch {
          // Ignore rollback failure and preserve the original submit error for the user.
        }
      }
      setFormError(getTeacherQuestionImageErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      setError('');
      try {
        const subjectList = await getAssignedSubjects();
        setSubjects(subjectList);
        if (subjectList.length === 0) return;

        const firstSubjectId = String(subjectList[0].subject_id);
        setActiveSubject(firstSubjectId);
        const initialTopics = await getTopicsBySubjectId(Number(firstSubjectId));
        setTopics(initialTopics);
        await loadQuestions(firstSubjectId, 'all');
      } catch {
        setError('Không thể tải dữ liệu ban đầu');
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    return () => {
      resetModalImagePreviewUrl();
    };
  }, []);

  useEffect(() => {
    if (!activeSubject) return;
    const loadSubjectTopics = async () => {
      try {
        const nextTopics = await getTopicsBySubjectId(Number(activeSubject));
        setTopics(nextTopics);
        setActiveTopic('all');
      } catch {
        setTopics([]);
      }
    };
    loadSubjectTopics();
  }, [activeSubject]);

  useEffect(() => {
    if (!activeSubject) return;
    const timer = setTimeout(() => {
      loadQuestions();
    }, 250);
    return () => clearTimeout(timer);
  }, [activeSubject, activeTopic, difficultyFilter, statusFilter, sourceFilter, searchQuery]);

  if (isLoading && subjects.length === 0) return <LoadingState />;
  if (error && subjects.length === 0) return <ErrorState message={error} />;
  if (!isLoading && subjects.length === 0) return <EmptyState />;

  return (
    <div className="pb-20 space-y-12 duration-700 animate-in fade-in slide-in-from-bottom-8">
      <div className="flex flex-col items-start justify-between gap-6 pt-2 md:flex-row md:items-end">
        <div>
          <h1 className="text-5xl italic font-black leading-none tracking-tighter uppercase text-slate-900">
            Ngân hàng <br />
            <span className="text-[#b20112]">Câu hỏi</span>
          </h1>
          <p className="mt-4 font-medium text-slate-500">
            Quản lý và tinh chỉnh hệ thống câu hỏi của bạn.
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={openCreateModal}
            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-black hover:-translate-y-1 transition-all flex items-center gap-3"
          >
            <span className="text-xl material-symbols-outlined">add_circle</span>
            Tạo thủ công
          </button>
          <Link
            to="/teacher/ai-generator"
            className="bg-[#b20112] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-900/20 hover:bg-[#d62828] hover:-translate-y-1 transition-all flex items-center gap-3"
          >
            <span className="text-xl material-symbols-outlined">auto_awesome</span>
            Tạo thêm bằng AI
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-3">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Danh sách môn học
          </h3>
          <div className="space-y-2">
            {subjects.map((subject) => (
              <button
                key={subject.subject_id}
                onClick={() => setActiveSubject(String(subject.subject_id))}
                className={`w-full p-6 rounded-3xl border-2 transition-all text-left flex justify-between items-center group ${
                  activeSubject === String(subject.subject_id)
                    ? 'border-[#b20112] bg-red-50/20 shadow-lg shadow-red-900/5'
                    : 'border-slate-50 bg-white hover:border-slate-200'
                }`}
              >
                <div>
                  <p
                    className={`text-sm font-black transition-colors ${
                      activeSubject === String(subject.subject_id)
                        ? 'text-[#b20112]'
                        : 'text-slate-600'
                    }`}
                  >
                    {subject.subject_name}
                  </p>
                </div>
                <span
                  className={`material-symbols-outlined text-xl transition-all ${
                    activeSubject === String(subject.subject_id)
                      ? 'text-[#b20112] translate-x-1'
                      : 'text-slate-200 opacity-0 group-hover:opacity-100'
                  }`}
                >
                  chevron_right
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-8 lg:col-span-9">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4">
              <div className="relative">
                <span className="absolute -translate-y-1/2 material-symbols-outlined left-4 top-1/2 text-slate-400">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Tìm kiếm nội dung..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-64 py-3 pl-12 pr-6 text-xs font-bold transition-all border-none rounded-xl bg-slate-50 focus:ring-2 focus:ring-red-500/20"
                />
              </div>
              <select
                value={difficultyFilter}
                onChange={(event) => setDifficultyFilter(event.target.value as typeof difficultyFilter)}
                className="px-4 py-3 rounded-xl bg-slate-50 border-none text-[10px] font-black uppercase tracking-widest text-slate-500"
              >
                <option value="all">Mức độ: tất cả</option>
                {DIFFICULTY_OPTIONS.map((difficulty) => (
                  <option key={difficulty.value} value={difficulty.value}>
                    {difficulty.label}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
                className="px-4 py-3 rounded-xl bg-slate-50 border-none text-[10px] font-black uppercase tracking-widest text-slate-500"
              >
                <option value="all">Trạng thái: tất cả</option>
                <option value="draft">Nháp</option>
                <option value="approved">Đã duyệt</option>
                <option value="inactive">Ẩn</option>
                <option value="rejected">Từ chối</option>
              </select>
              <select
                value={sourceFilter}
                onChange={(event) => setSourceFilter(event.target.value as typeof sourceFilter)}
                className="px-4 py-3 rounded-xl bg-slate-50 border-none text-[10px] font-black uppercase tracking-widest text-slate-500"
              >
                <option value="all">Nguồn: tất cả</option>
                <option value="manual">Thủ công</option>
                <option value="ai">AI</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 pb-2 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTopic('all')}
              className={`px-5 py-3 rounded-2xl font-black text-[9px] uppercase tracking-wider whitespace-nowrap transition-all border cursor-pointer ${
                activeTopic === 'all'
                  ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/10'
                  : 'bg-white border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-200'
              }`}
            >
              Tất cả chương
            </button>
            {topics.map((topic) => (
              <button
                key={topic.topic_id}
                type="button"
                onClick={() => setActiveTopic(String(topic.topic_id))}
                className={`px-5 py-3 rounded-2xl font-black text-[9px] uppercase tracking-wider whitespace-nowrap transition-all border cursor-pointer ${
                  activeTopic === String(topic.topic_id)
                    ? 'bg-[#b20112] border-[#b20112] text-white shadow-lg shadow-red-900/10'
                    : 'bg-white border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-200'
                }`}
              >
                {topic.topic_name}
              </button>
            ))}
          </div>

          {error && <ErrorState message={error} />}
          {isLoading ? (
            <LoadingState />
          ) : (
            <div className="space-y-4">
              {questions.length === 0 ? (
                <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 text-center text-slate-400 text-xs font-black uppercase tracking-widest">
                  Không tìm thấy câu hỏi nào
                </div>
              ) : (
                questions.map((question) => {
                  const optionsSorted = [...question.options].sort((left, right) => left.order_num - right.order_num);
                  const correctOption = optionsSorted.find((option) => option.is_correct);
                  const imageUrl = getQuestionImageUrl(question);
                  const showImage = Boolean(imageUrl) && !brokenListImageIds.includes(question.question_id);

                  return (
                    <div
                      key={question.question_id}
                      className={`p-8 rounded-[2.5rem] border shadow-sm transition-all group ${
                        question.status === 'inactive'
                          ? 'bg-slate-50 border-slate-200 opacity-40'
                          : 'bg-white border-slate-100 hover:shadow-xl hover:shadow-red-900/5'
                      }`}
                    >
                      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                        <div className="flex-1 space-y-4">
                          <div className="flex flex-wrap gap-2">
                            <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                              Trắc nghiệm
                            </span>
                            <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-600">
                              {getDifficultyLabel(question.difficulty)}
                            </span>
                            <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                              {question.topic_name}
                            </span>
                            <span className="bg-slate-50 text-slate-400 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest italic">
                              {question.source}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateTeacherQuestionStatus(
                                  question.question_id,
                                  question.status === 'approved' ? 'draft' : 'approved',
                                ).then(() => loadQuestions())
                              }
                              className="bg-slate-50 text-slate-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest"
                            >
                              {question.status}
                            </button>
                          </div>
                          <h4 className="text-lg font-black leading-snug tracking-tight text-slate-800">
                            {question.content}
                          </h4>
                          {showImage && (
                            <img
                              src={imageUrl}
                              alt={question.image?.file_name || `Ảnh minh họa câu hỏi ${question.question_id}`}
                              className="object-cover w-full border max-h-48 rounded-2xl border-slate-100"
                              onError={() =>
                                setBrokenListImageIds((prev) =>
                                  prev.includes(question.question_id) ? prev : [...prev, question.question_id],
                                )
                              }
                            />
                          )}
                          {correctOption && (
                            <div className="mt-4">
                              <div className="inline-flex items-center gap-2 p-4 text-xs font-bold border shadow-sm rounded-2xl bg-emerald-50 border-emerald-200 text-emerald-700">
                                <span className="text-sm material-symbols-outlined">check_circle</span>
                                <span className="opacity-60">Đáp án đúng:</span>{' '}
                                {correctOption.option_label}. {correctOption.option_text}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 transition-opacity opacity-0 group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => openModalWithQuestion(question, 'edit')}
                            className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-[#b20112] hover:text-white transition-all flex items-center justify-center cursor-pointer"
                          >
                            <span className="text-xl material-symbols-outlined">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleVisibility(question)}
                            disabled={processingQuestionId === question.question_id}
                            title={question.status === 'inactive' ? 'Hiện câu hỏi' : 'Ẩn câu hỏi'}
                            className="flex items-center justify-center w-10 h-10 transition-all cursor-pointer rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="text-xl material-symbols-outlined">
                              {question.status === 'inactive' ? 'visibility_off' : 'visibility'}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(question.question_id)}
                            disabled={processingQuestionId === question.question_id}
                            title="Xóa câu hỏi"
                            className="flex items-center justify-center w-10 h-10 text-red-300 transition-all cursor-pointer rounded-xl bg-slate-50 hover:bg-red-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="text-xl material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          <button
            onClick={() => loadQuestions()}
            className="w-full py-6 rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] hover:border-[#b20112] hover:text-[#b20112] transition-all"
          >
            Làm mới danh sách
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 duration-300 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-10 md:p-14">
              <div className="flex items-start justify-between mb-10">
                <div>
                  <h2 className="text-3xl italic font-black tracking-tighter uppercase text-slate-900">
                    {modalMode === 'create' ? 'Tạo ' : modalMode === 'edit' ? 'Chỉnh sửa ' : 'Chi tiết '}
                    <span className="text-[#b20112]">Câu hỏi</span>
                  </h2>
                </div>
                <button
                  onClick={closeModal}
                  className="flex items-center justify-center w-12 h-12 transition-all rounded-full bg-slate-100 text-slate-400 hover:bg-slate-900 hover:text-white"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      Môn học
                    </label>
                    <select
                      disabled={modalMode === 'view'}
                      value={formData.subjectId}
                      onChange={async (event) => {
                        const nextSubjectId = event.target.value;
                        const nextTopics = await getTopicsBySubjectId(Number(nextSubjectId));
                        const nextTopicId = nextTopics[0] ? String(nextTopics[0].topic_id) : '';
                        setModalTopics(nextTopics);
                        setFormData((prev) => ({
                          ...prev,
                          subjectId: nextSubjectId,
                          topicId: nextTopicId,
                          documentTopicId: '',
                        }));
                        await loadModalDocumentTopics(nextSubjectId, nextTopicId);
                      }}
                      className="w-full p-4 text-xs font-bold border-none rounded-2xl bg-slate-50"
                    >
                      {subjects.map((subject) => (
                        <option key={subject.subject_id} value={subject.subject_id}>
                          {subject.subject_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      Chương học
                    </label>
                    <select
                      disabled={modalMode === 'view'}
                      value={formData.topicId}
                      onChange={async (event) => {
                        const nextTopicId = event.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          topicId: nextTopicId,
                          documentTopicId: '',
                        }));
                        await loadModalDocumentTopics(formData.subjectId, nextTopicId);
                      }}
                      className="w-full p-4 text-xs font-bold border-none rounded-2xl bg-slate-50"
                    >
                      {modalTopics.map((topic) => (
                        <option key={topic.topic_id} value={topic.topic_id}>
                          {topic.topic_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      Tài liệu nguồn
                    </label>
                    <select
                      disabled={modalMode === 'view'}
                      value={formData.documentTopicId}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          documentTopicId: event.target.value,
                        }))
                      }
                      className="w-full p-4 text-xs font-bold border-none rounded-2xl bg-slate-50"
                    >
                      {documentTopicOptions.map((option) => (
                        <option key={option.document_topic_id} value={option.document_topic_id}>
                          {option.document_title}
                        </option>
                      ))}
                      {documentTopicOptions.length === 0 && <option value="">Không có tài liệu phù hợp</option>}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      Độ khó
                    </label>
                    <select
                      disabled={modalMode === 'view'}
                      value={formData.difficulty}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          difficulty: event.target.value as QuestionDifficulty,
                        }))
                      }
                      className="w-full p-4 text-xs font-bold border-none rounded-2xl bg-slate-50"
                    >
                      {DIFFICULTY_OPTIONS.map((difficulty) => (
                        <option key={difficulty.value} value={difficulty.value}>
                          {difficulty.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      Trạng thái
                    </label>
                    <select
                      disabled={modalMode === 'view'}
                      value={formData.status}
                      onChange={(event) =>
                        setFormData((prev) => ({
                          ...prev,
                          status: event.target.value as FormState['status'],
                        }))
                      }
                      className="w-full p-4 text-xs font-bold border-none rounded-2xl bg-slate-50"
                    >
                      <option value="draft">Nháp</option>
                      <option value="approved">Đã duyệt</option>
                      {modalMode === 'view' && <option value="inactive">Ẩn</option>}
                      {modalMode === 'view' && <option value="rejected">Từ chối</option>}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Nội dung câu hỏi
                  </label>
                  <textarea
                    disabled={modalMode === 'view'}
                    rows={4}
                    value={formData.content}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        content: event.target.value,
                      }))
                    }
                    className="w-full p-6 rounded-[2rem] bg-slate-50 border-none text-sm font-bold resize-none"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                      Ảnh minh họa
                    </label>
                    {modalMode !== 'view' && (formData.imageId || formData.imageUrl || selectedImageFile) && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="px-4 py-2 rounded-xl bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-[#b20112] transition-all"
                      >
                        Gỡ ảnh
                      </button>
                    )}
                  </div>
                    <label className="block w-full p-4 text-xs font-black cursor-pointer rounded-2xl bg-slate-50 text-slate-500 hover:bg-slate-100">
                      {selectedImageFile ? selectedImageFile.name : 'Chọn ảnh'}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        disabled={modalMode === 'view'}
                        onChange={(event) => handleImageFileChange(event.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                  {selectedImageFile && (
                    <div className="flex flex-wrap gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span>Tệp mới: {selectedImageFile.name}</span>
                      {formatFileSize(selectedImageFile.size) && (
                        <span>Dung lượng: {formatFileSize(selectedImageFile.size)}</span>
                      )}
                    </div>
                  )}
                  {formData.imageUrl && !isModalImageBroken && (
                    <div className="flex items-center justify-center p-4 overflow-hidden border rounded-2xl border-slate-100 bg-slate-50">
                      <img
                        src={formData.imageUrl}
                        alt="Ảnh minh họa hiện tại"
                        className="object-contain max-w-full max-h-64"
                        onError={() => setIsModalImageBroken(true)}
                      />
                    </div>
                  )}
                  {formData.imageUrl && !isModalImageBroken && (
                    <div className="flex flex-wrap gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {formData.imageId && !selectedImageFile && <span>ID ảnh: {formData.imageId}</span>}
                      {selectedQuestionId != null &&
                        !selectedImageFile &&
                        formatFileSize(
                          questions.find((item) => item.question_id === selectedQuestionId)?.image?.file_size,
                        ) && (
                          <span>
                            Dung lượng:{' '}
                            {formatFileSize(
                              questions.find((item) => item.question_id === selectedQuestionId)?.image?.file_size,
                            )}
                          </span>
                        )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {formData.options.map((option, index) => (
                    <div key={index} className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                        Đáp án {['A', 'B', 'C', 'D'][index]}
                      </label>
                      <input
                        disabled={modalMode === 'view'}
                        value={option}
                        onChange={(event) => {
                          const nextOptions = [...formData.options];
                          nextOptions[index] = event.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            options: nextOptions,
                          }));
                        }}
                        className="w-full p-4 text-xs font-bold border-none rounded-2xl bg-slate-50"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Đáp án đúng
                  </label>
                  <div className="flex gap-3">
                    {['A', 'B', 'C', 'D'].map((label, index) => (
                      <button
                        key={label}
                        type="button"
                        disabled={modalMode === 'view'}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            correctOptionIndex: index,
                          }))
                        }
                        className={`flex-1 py-4 rounded-xl font-black text-xs transition-all ${
                          formData.correctOptionIndex === index
                            ? 'bg-[#b20112] text-white'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Giải thích
                  </label>
                  <input
                    disabled={modalMode === 'view'}
                    value={formData.explanation}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        explanation: event.target.value,
                      }))
                    }
                    className="w-full p-4 text-xs font-bold border-none rounded-2xl bg-slate-50"
                  />
                </div>

                {formError && (
                  <div className="p-4 text-xs font-black tracking-widest text-red-600 uppercase border border-red-100 rounded-2xl bg-red-50">
                    {formError}
                  </div>
                )}

                <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400"
                  >
                    {modalMode === 'view' ? 'Đóng lại' : 'Hủy bỏ'}
                  </button>
                  {modalMode !== 'view' && (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest disabled:opacity-50"
                    >
                      {isSubmitting
                        ? 'Đang lưu...'
                        : modalMode === 'create'
                          ? 'Lưu câu hỏi'
                          : 'Cập nhật thay đổi'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
