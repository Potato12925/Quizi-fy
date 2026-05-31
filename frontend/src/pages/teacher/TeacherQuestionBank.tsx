import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import EmptyState from '@/components/common/EmptyState';
import {
  createTeacherManualQuestion,
  getAssignedSubjects,
  getDocumentTopicOptions,
  getTeacherQuestionBank,
  getTopicsBySubjectId,
  softDeleteTeacherQuestion,
  type AssignedSubject,
  type DocumentTopicOption,
  type ManualQuestionPayloadV2,
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
  content: string;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'draft' | 'approved' | 'inactive' | 'rejected';
  options: string[];
  correctOptionIndex: number;
  explanation: string;
};

export default function QuestionBankPage() {
  const [subjects, setSubjects] = useState<AssignedSubject[]>([]);
  const [activeSubject, setActiveSubject] = useState<string>('');
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [activeTopic, setActiveTopic] = useState<string>('all');

  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'approved' | 'inactive' | 'rejected'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'manual' | 'ai'>('all');

  const [questions, setQuestions] = useState<TeacherQuestionBankItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalTopics, setModalTopics] = useState<TopicItem[]>([]);
  const [documentTopicOptions, setDocumentTopicOptions] = useState<DocumentTopicOption[]>([]);
  const [processingQuestionId, setProcessingQuestionId] = useState<number | null>(null);

  const [formData, setFormData] = useState<FormState>({
    subjectId: '',
    topicId: '',
    documentTopicId: '',
    content: '',
    difficulty: 'medium',
    status: 'draft',
    options: ['', '', '', ''],
    correctOptionIndex: 0,
    explanation: '',
  });

  const subjectCountMap = useMemo(() => {
    const map = new Map<number, number>();
    questions.forEach((q) => {
      map.set(q.subject_id, (map.get(q.subject_id) || 0) + 1);
    });
    return map;
  }, [questions]);

  const loadQuestions = async (subjectIdArg?: string, topicArg?: string) => {
    const subjectId = subjectIdArg || activeSubject;
    const topicId = topicArg || activeTopic;
    if (!subjectId) return;

    setIsLoading(true);
    setError('');
    try {
      const res = await getTeacherQuestionBank({
        page: 1,
        limit: 100,
        subject_id: Number(subjectId),
        topic_id: topicId !== 'all' ? Number(topicId) : undefined,
        difficulty: difficultyFilter !== 'all' ? difficultyFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        source: sourceFilter !== 'all' ? sourceFilter : undefined,
        keyword: searchQuery.trim() || undefined,
      });
      setQuestions(res.items || []);
    } catch {
      setError('Không thể tải dữ liệu ngân hàng câu hỏi');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      setError('');
      try {
        const subjectList = await getAssignedSubjects();
        setSubjects(subjectList);
        if (subjectList.length === 0) {
          setIsLoading(false);
          return;
        }

        const firstSubjectId = String(subjectList[0].subject_id);
        setActiveSubject(firstSubjectId);
        const topicList = await getTopicsBySubjectId(Number(firstSubjectId));
        setTopics(topicList);
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
    if (!activeSubject) return;
    const loadTopics = async () => {
      try {
        const data = await getTopicsBySubjectId(Number(activeSubject));
        setTopics(data);
        setActiveTopic('all');
      } catch {
        setTopics([]);
      }
    };
    loadTopics();
  }, [activeSubject]);

  useEffect(() => {
    if (!activeSubject) return;
    const t = setTimeout(() => {
      loadQuestions();
    }, 250);
    return () => clearTimeout(t);
  }, [activeSubject, activeTopic, difficultyFilter, statusFilter, sourceFilter, searchQuery]);

  const loadModalDocumentTopics = async (subjectId: string, topicId: string) => {
    if (!subjectId) return;
    const options = await getDocumentTopicOptions(Number(subjectId), topicId ? Number(topicId) : undefined);
    setDocumentTopicOptions(options);
    if (options.length > 0 && !options.find((opt) => String(opt.document_topic_id) === formData.documentTopicId)) {
      setFormData((prev) => ({ ...prev, documentTopicId: String(options[0].document_topic_id) }));
    }
  };

  const handleOpenCreateModal = async () => {
    const topicId = topics.length > 0 ? String(topics[0].topic_id) : '';
    setModalMode('create');
    setSelectedQuestionId(null);
    setFormError('');
    setModalTopics(topics);
    setFormData({
      subjectId: activeSubject,
      topicId,
      documentTopicId: '',
      content: '',
      difficulty: 'medium',
      status: 'draft',
      options: ['', '', '', ''],
      correctOptionIndex: 0,
      explanation: '',
    });
    if (activeSubject) {
      await loadModalDocumentTopics(activeSubject, topicId);
    }
    setIsModalOpen(true);
  };

  const openModalWithQuestion = async (q: TeacherQuestionBankItem, mode: ModalMode) => {
    const subjectId = String(q.subject_id);
    const loadedTopics = await getTopicsBySubjectId(Number(subjectId));
    setModalTopics(loadedTopics);

    setModalMode(mode);
    setSelectedQuestionId(q.question_id);
    setFormError('');

    const optionsSorted = [...q.options].sort((a, b) => a.order_num - b.order_num);
    const correctIdx = optionsSorted.findIndex((opt) => opt.is_correct);

    setFormData({
      subjectId,
      topicId: String(q.topic_id),
      documentTopicId: String(q.document_topic_id),
      content: q.content,
      difficulty: q.difficulty,
      status: q.status,
      options: optionsSorted.map((opt) => opt.option_text).concat(['', '', '', '']).slice(0, 4),
      correctOptionIndex: correctIdx >= 0 ? correctIdx : 0,
      explanation: q.explanation || '',
    });

    const docTopicOptions = await getDocumentTopicOptions(Number(subjectId), q.topic_id);
    setDocumentTopicOptions(docTopicOptions);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn ẩn câu hỏi này khỏi ngân hàng không?')) return;
    setProcessingQuestionId(id);
    try {
      await softDeleteTeacherQuestion(id);
      await loadQuestions();
    } catch {
      alert('Không thể xóa câu hỏi lúc này');
    } finally {
      setProcessingQuestionId(null);
    }
  };

  const handleToggleVisibility = async (q: TeacherQuestionBankItem) => {
    const nextStatus = q.status === 'inactive' ? 'draft' : 'inactive';
    const confirmMessage = nextStatus === 'inactive'
      ? 'Bạn có chắc chắn muốn ẩn câu hỏi này không?'
      : 'Bạn có muốn hiện lại câu hỏi này không?';
    if (!window.confirm(confirmMessage)) return;

    setProcessingQuestionId(q.question_id);
    try {
      await updateTeacherQuestionStatus(q.question_id, nextStatus);
      await loadQuestions();
    } catch {
      alert('Không thể cập nhật trạng thái hiển thị của câu hỏi lúc này');
    } finally {
      setProcessingQuestionId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'view') return;

    setFormError('');

    if (!formData.documentTopicId) {
      setFormError('Vui lòng chọn tài liệu nguồn');
      return;
    }

    if (!formData.content.trim()) {
      setFormError('Nội dung câu hỏi không được để trống');
      return;
    }

    const trimmedOptions = formData.options.map((opt) => opt.trim()).filter(Boolean);
    if (trimmedOptions.length < 2) {
      setFormError('Cần tối thiểu 2 đáp án hợp lệ');
      return;
    }

    if (formData.correctOptionIndex >= trimmedOptions.length) {
      setFormError('Đáp án đúng không hợp lệ');
      return;
    }

    const payload: ManualQuestionPayloadV2 = {
      document_topic_id: Number(formData.documentTopicId),
      content: formData.content.trim(),
      difficulty: formData.difficulty,
      status: formData.status,
      explanation: formData.explanation?.trim() || undefined,
      options: trimmedOptions,
      correct_option_index: formData.correctOptionIndex,
    };

    setIsSubmitting(true);
    try {
      if (modalMode === 'create') {
        await createTeacherManualQuestion(payload);
      } else if (selectedQuestionId) {
        await updateTeacherQuestion(selectedQuestionId, payload);
      }
      setIsModalOpen(false);
      await loadQuestions();
    } catch {
      setFormError('Có lỗi xảy ra khi lưu dữ liệu');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && subjects.length === 0) return <LoadingState />;
  if (error && subjects.length === 0) return <ErrorState message={error} />;
  if (!isLoading && subjects.length === 0) return <EmptyState />;

  return (
    <div className="pb-20 space-y-12 duration-700 animate-in fade-in slide-in-from-bottom-8">
      <div className="flex flex-col items-start justify-between gap-6 pt-2 md:flex-row md:items-end">
        <div>
          <h1 className="text-5xl italic font-black leading-none tracking-tighter uppercase text-slate-900">Ngân hàng <br/><span className="text-[#b20112]">Câu hỏi</span></h1>
          <p className="mt-4 font-medium text-slate-500">Quản lý và tinh chỉnh hệ thống câu hỏi của bạn.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={handleOpenCreateModal} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-black hover:-translate-y-1 transition-all flex items-center gap-3">
            <span className="text-xl material-symbols-outlined">add_circle</span> Tạo thủ công
          </button>
          <Link to="/teacher/ai-generator" className="bg-[#b20112] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-900/20 hover:bg-[#d62828] hover:-translate-y-1 transition-all flex items-center gap-3">
            <span className="text-xl material-symbols-outlined">auto_awesome</span> Tạo thêm bằng AI
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-3">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Danh sách môn học</h3>
          <div className="space-y-2">
            {subjects.map((s) => (
              <button key={s.subject_id} onClick={() => setActiveSubject(String(s.subject_id))} className={`w-full p-6 rounded-3xl border-2 transition-all text-left flex justify-between items-center group ${activeSubject === String(s.subject_id) ? 'border-[#b20112] bg-red-50/20 shadow-lg shadow-red-900/5' : 'border-slate-50 bg-white hover:border-slate-200'}`}>
                <div>
                  <p className={`text-sm font-black transition-colors ${activeSubject === String(s.subject_id) ? 'text-[#b20112]' : 'text-slate-600'}`}>{s.subject_name}</p>
                </div>
                <span className={`material-symbols-outlined text-xl transition-all ${activeSubject === String(s.subject_id) ? 'text-[#b20112] translate-x-1' : 'text-slate-200 opacity-0 group-hover:opacity-100'}`}>chevron_right</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-8 lg:col-span-9">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4">
              <div className="relative">
                <span className="absolute -translate-y-1/2 material-symbols-outlined left-4 top-1/2 text-slate-400">search</span>
                <input type="text" placeholder="Tìm kiếm nội dung..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-64 py-3 pl-12 pr-6 text-xs font-bold transition-all border-none rounded-xl bg-slate-50 focus:ring-2 focus:ring-red-500/20" />
              </div>
              <select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value as typeof difficultyFilter)} className="px-4 py-3 rounded-xl bg-slate-50 border-none text-[10px] font-black uppercase tracking-widest text-slate-500">
                <option value="all">Mức độ: tất cả</option>
                <option value="easy">Dễ</option>
                <option value="medium">Trung bình</option>
                <option value="hard">Khó</option>
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="px-4 py-3 rounded-xl bg-slate-50 border-none text-[10px] font-black uppercase tracking-widest text-slate-500">
                <option value="all">Trạng thái: tất cả</option>
                <option value="draft">Nháp</option>
                <option value="approved">Đã duyệt</option>
                <option value="inactive">Ẩn</option>
                <option value="rejected">Từ chối</option>
              </select>
              <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value as typeof sourceFilter)} className="px-4 py-3 rounded-xl bg-slate-50 border-none text-[10px] font-black uppercase tracking-widest text-slate-500">
                <option value="all">Nguồn: tất cả</option>
                <option value="manual">Thủ công</option>
                <option value="ai">AI</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 pb-2 overflow-x-auto scrollbar-none">
            <button type="button" onClick={() => setActiveTopic('all')} className={`px-5 py-3 rounded-2xl font-black text-[9px] uppercase tracking-wider whitespace-nowrap transition-all border cursor-pointer ${activeTopic === 'all' ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/10' : 'bg-white border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-200'}`}>
              Tất cả chương
            </button>
            {topics.map((t) => (
              <button key={t.topic_id} type="button" onClick={() => setActiveTopic(String(t.topic_id))} className={`px-5 py-3 rounded-2xl font-black text-[9px] uppercase tracking-wider whitespace-nowrap transition-all border cursor-pointer ${activeTopic === String(t.topic_id) ? 'bg-[#b20112] border-[#b20112] text-white shadow-lg shadow-red-900/10' : 'bg-white border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-200'}`}>
                {t.topic_name}
              </button>
            ))}
          </div>

          {error && <ErrorState message={error} />}
          {isLoading ? <LoadingState /> : (
            <div className="space-y-4">
              {questions.length === 0 ? (
                <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 text-center text-slate-400 text-xs font-black uppercase tracking-widest">
                  Không tìm thấy câu hỏi nào
                </div>
              ) : questions.map((q) => {
                const optionsSorted = [...q.options].sort((a, b) => a.order_num - b.order_num);
                const correct = optionsSorted.find((opt) => opt.is_correct);
                return (
                  <div
                    key={q.question_id}
                    className={`p-8 rounded-[2.5rem] border shadow-sm transition-all group ${
                      q.status === 'inactive'
                        ? 'bg-slate-50 border-slate-200 opacity-40'
                        : 'bg-white border-slate-100 hover:shadow-xl hover:shadow-red-900/5'
                    }`}
                  >
                    <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-wrap gap-2">
                          <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">Trắc nghiệm</span>
                          <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-600">{q.difficulty}</span>
                          <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">{q.topic_name}</span>
                          <span className="bg-slate-50 text-slate-400 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest italic">{q.source}</span>
                          <button type="button" onClick={() => updateTeacherQuestionStatus(q.question_id, q.status === 'approved' ? 'draft' : 'approved').then(() => loadQuestions())} className="bg-slate-50 text-slate-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">{q.status}</button>
                        </div>
                        <h4 className="text-lg font-black leading-snug tracking-tight text-slate-800">{q.content}</h4>
                        {correct && (
                          <div className="mt-4">
                            <div className="inline-flex items-center gap-2 p-4 text-xs font-bold border shadow-sm rounded-2xl bg-emerald-50 border-emerald-200 text-emerald-700">
                              <span className="text-sm material-symbols-outlined">check_circle</span>
                              <span className="opacity-60">Đáp án đúng:</span> {correct.option_label}. {correct.option_text}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 transition-opacity opacity-0 group-hover:opacity-100">
                        <button type="button" onClick={() => openModalWithQuestion(q, 'edit')} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-[#b20112] hover:text-white transition-all flex items-center justify-center cursor-pointer"><span className="text-xl material-symbols-outlined">edit</span></button>
                        <button
                          type="button"
                          onClick={() => handleToggleVisibility(q)}
                          disabled={processingQuestionId === q.question_id}
                          title={q.status === 'inactive' ? 'Hiện câu hỏi' : 'Ẩn câu hỏi'}
                          className="flex items-center justify-center w-10 h-10 transition-all cursor-pointer rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="text-xl material-symbols-outlined">{q.status === 'inactive' ? 'visibility_off' : 'visibility'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(q.question_id)}
                          disabled={processingQuestionId === q.question_id}
                          title="Xóa câu hỏi"
                          className="flex items-center justify-center w-10 h-10 text-red-300 transition-all cursor-pointer rounded-xl bg-slate-50 hover:bg-red-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="text-xl material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button onClick={() => loadQuestions()} className="w-full py-6 rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] hover:border-[#b20112] hover:text-[#b20112] transition-all">Làm mới danh sách</button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 duration-300 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-10 md:p-14">
              <div className="flex items-start justify-between mb-10">
                <div>
                  <h2 className="text-3xl italic font-black tracking-tighter uppercase text-slate-900">{modalMode === 'create' ? 'Tạo câu hỏi ' : modalMode === 'edit' ? 'Chỉnh sửa ' : 'Chi tiết '}<span className="text-[#b20112]">Câu hỏi</span></h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="flex items-center justify-center w-12 h-12 transition-all rounded-full bg-slate-100 text-slate-400 hover:bg-slate-900 hover:text-white"><span className="material-symbols-outlined">close</span></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Môn học</label>
                    <select disabled={modalMode === 'view'} value={formData.subjectId} onChange={async (e) => {
                      const newSubId = e.target.value;
                      const subTopics = await getTopicsBySubjectId(Number(newSubId));
                      const nextTopicId = subTopics.length > 0 ? String(subTopics[0].topic_id) : '';
                      setModalTopics(subTopics);
                      setFormData((prev) => ({ ...prev, subjectId: newSubId, topicId: nextTopicId, documentTopicId: '' }));
                      await loadModalDocumentTopics(newSubId, nextTopicId);
                    }} className="w-full p-4 text-xs font-bold border-none rounded-2xl bg-slate-50">
                      {subjects.map((s) => <option key={s.subject_id} value={s.subject_id}>{s.subject_name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Chương học</label>
                    <select disabled={modalMode === 'view'} value={formData.topicId} onChange={async (e) => {
                      const nextTopicId = e.target.value;
                      setFormData((prev) => ({ ...prev, topicId: nextTopicId, documentTopicId: '' }));
                      await loadModalDocumentTopics(formData.subjectId, nextTopicId);
                    }} className="w-full p-4 text-xs font-bold border-none rounded-2xl bg-slate-50">
                      {modalTopics.map((t) => <option key={t.topic_id} value={t.topic_id}>{t.topic_name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tài liệu nguồn</label>
                    <select disabled={modalMode === 'view'} value={formData.documentTopicId} onChange={(e) => setFormData((prev) => ({ ...prev, documentTopicId: e.target.value }))} className="w-full p-4 text-xs font-bold border-none rounded-2xl bg-slate-50">
                      {documentTopicOptions.map((opt) => <option key={opt.document_topic_id} value={opt.document_topic_id}>{opt.document_title}</option>)}
                      {documentTopicOptions.length === 0 && <option value="">Không có tài liệu phù hợp</option>}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Độ khó</label>
                    <select disabled={modalMode === 'view'} value={formData.difficulty} onChange={(e) => setFormData((prev) => ({ ...prev, difficulty: e.target.value as FormState['difficulty'] }))} className="w-full p-4 text-xs font-bold border-none rounded-2xl bg-slate-50">
                      <option value="easy">Dễ</option>
                      <option value="medium">Trung bình</option>
                      <option value="hard">Khó</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Trạng thái</label>
                    <select disabled={modalMode === 'view'} value={formData.status} onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as FormState['status'] }))} className="w-full p-4 text-xs font-bold border-none rounded-2xl bg-slate-50">
                      <option value="draft">Nháp</option>
                      <option value="approved">Đã duyệt</option>
                      <option value="inactive">Ẩn</option>
                      <option value="rejected">Từ chối</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nội dung câu hỏi</label>
                  <textarea disabled={modalMode === 'view'} rows={4} value={formData.content} onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))} className="w-full p-6 rounded-[2rem] bg-slate-50 border-none text-sm font-bold resize-none" />
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {formData.options.map((opt, i) => (
                    <div key={i} className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Đáp án {['A', 'B', 'C', 'D'][i]}</label>
                      <input disabled={modalMode === 'view'} value={opt} onChange={(e) => {
                        const next = [...formData.options];
                        next[i] = e.target.value;
                        setFormData((prev) => ({ ...prev, options: next }));
                      }} className="w-full p-4 text-xs font-bold border-none rounded-2xl bg-slate-50" />
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Đáp án đúng</label>
                  <div className="flex gap-3">
                    {['A', 'B', 'C', 'D'].map((label, idx) => (
                      <button disabled={modalMode === 'view'} key={label} type="button" onClick={() => setFormData((prev) => ({ ...prev, correctOptionIndex: idx }))} className={`flex-1 py-4 rounded-xl font-black text-xs transition-all ${formData.correctOptionIndex === idx ? 'bg-[#b20112] text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Giải thích</label>
                  <input disabled={modalMode === 'view'} value={formData.explanation} onChange={(e) => setFormData((prev) => ({ ...prev, explanation: e.target.value }))} className="w-full p-4 text-xs font-bold border-none rounded-2xl bg-slate-50" />
                </div>

                {formError && <div className="p-4 text-xs font-black tracking-widest text-red-600 uppercase border border-red-100 rounded-2xl bg-red-50">{formError}</div>}

                <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400">{modalMode === 'view' ? 'Đóng lại' : 'Hủy bỏ'}</button>
                  {modalMode !== 'view' && (
                    <button type="submit" disabled={isSubmitting} className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest disabled:opacity-50">
                      {isSubmitting ? 'Đang lưu...' : modalMode === 'create' ? 'Lưu câu hỏi' : 'Cập nhật thay đổi'}
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
