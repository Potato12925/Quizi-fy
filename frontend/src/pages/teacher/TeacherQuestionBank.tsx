import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getQuestionBank, createManualQuestion, updateQuestion, deleteQuestion, getTopicsBySubject, type DbTopic, type QuestionBankData, type ManualQuestionPayload, type GeneratedQuestion } from '@/api/teacherApi';

import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import EmptyState from '@/components/common/EmptyState';

export default function QuestionBankPage() {
  const [activeSubject, setActiveSubject] = useState('1');
  const [data, setData] = useState<QuestionBankData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  // Topics and filtering states
  const [topics, setTopics] = useState<DbTopic[]>([]);
  const [activeTopic, setActiveTopic] = useState<string>('all');
  
  // Modal specific topics list
  const [modalTopics, setModalTopics] = useState<DbTopic[]>([]);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState<ManualQuestionPayload>({
    subjectId: '',
    topicId: '',
    content: '',
    difficulty: 'medium',
    options: ['', '', '', ''],
    correctOptionLabel: 'A',
    explanation: ''
  });

  // Load topics dynamically based on activeSubject
  useEffect(() => {
    const loadTopics = async () => {
      if (!activeSubject) return;
      try {
        const data = await getTopicsBySubject(activeSubject);
        setTopics(data);
        setActiveTopic('all');
      } catch (err) {
        console.error('Lỗi tải chương học', err);
      }
    };
    loadTopics();
  }, [activeSubject]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const bankData = await getQuestionBank();
      setData(bankData);
      if (bankData.subjects.length > 0) {
        if (!activeSubject || activeSubject === '1') {
          setActiveSubject(bankData.subjects[0].id);
        }
      }
    } catch {
      setError('Không thể tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedQuestionId(null);
    setModalTopics(topics);
    setFormData({
      subjectId: activeSubject || (data?.subjects[0]?.id || ''),
      topicId: topics.length > 0 ? String(topics[0].topic_id) : '1',
      content: '',
      difficulty: 'medium',
      options: ['', '', '', ''],
      correctOptionLabel: 'A',
      explanation: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenViewModal = async (q: GeneratedQuestion) => {
    setModalMode('view');
    setSelectedQuestionId(q.id);
    // Ensure always 4 options for the UI grid
    const fullOptions = [...q.options];
    while (fullOptions.length < 4) fullOptions.push('');
    
    const qSubId = String(q.subjectId || activeSubject);
    let subTopics = topics;
    if (qSubId !== activeSubject) {
      try {
        subTopics = await getTopicsBySubject(qSubId);
      } catch (err) {
        console.error(err);
      }
    }
    setModalTopics(subTopics);
    
    setFormData({
      subjectId: qSubId,
      topicId: q.topicId ? String(q.topicId) : (subTopics.length > 0 ? String(subTopics[0].topic_id) : '1'),
      content: q.text,
      difficulty: q.level || 'medium',
      options: fullOptions,
      correctOptionLabel: ['A', 'B', 'C', 'D'][q.correctAnswer] || 'A',
      explanation: q.explanation || ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (q: GeneratedQuestion) => {
    setModalMode('edit');
    setSelectedQuestionId(q.id);
    // Ensure always 4 options for the UI grid
    const fullOptions = [...q.options];
    while (fullOptions.length < 4) fullOptions.push('');

    const qSubId = String(q.subjectId || activeSubject);
    let subTopics = topics;
    if (qSubId !== activeSubject) {
      try {
        subTopics = await getTopicsBySubject(qSubId);
      } catch (err) {
        console.error(err);
      }
    }
    setModalTopics(subTopics);

    setFormData({
      subjectId: qSubId,
      topicId: q.topicId ? String(q.topicId) : (subTopics.length > 0 ? String(subTopics[0].topic_id) : '1'),
      content: q.text,
      difficulty: q.level || 'medium',
      options: fullOptions,
      correctOptionLabel: ['A', 'B', 'C', 'D'][q.correctAnswer] || 'A',
      explanation: q.explanation || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn ẩn câu hỏi này khỏi ngân hàng không?')) return;
    
    try {
      const res = await deleteQuestion(id);
      if (res.success) {
        fetchData();
      } else {
        alert('Không thể xóa câu hỏi lúc này');
      }
    } catch {
      alert('Lỗi kết nối server');
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    if (modalMode === 'view') return;
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'view') return;
    
    setFormError('');
    if (!formData.content.trim()) return setFormError('Nội dung câu hỏi không được để trống');
    if (formData.options.some(opt => !opt.trim())) return setFormError('Vui lòng điền đầy đủ 4 đáp án');

    setIsSubmitting(true);
    try {
      let res;
      if (modalMode === 'create') {
        res = await createManualQuestion(formData);
      } else {
        res = await updateQuestion(selectedQuestionId!, formData);
      }

      if (res.success) {
        setIsModalOpen(false);
        fetchData();
      } else {
        setFormError('Có lỗi xảy ra khi lưu dữ liệu');
      }
    } catch (err) {
      setFormError('Lỗi kết nối server');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !data) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <EmptyState />;

  const { subjects, questions } = data;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-2">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Ngân hàng <br/><span className="text-[#b20112]">Câu hỏi</span></h1>
          <p className="text-slate-500 mt-4 font-medium">Quản lý và tinh chỉnh hệ thống câu hỏi đã được phê duyệt.</p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={handleOpenCreateModal}
             className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-black hover:-translate-y-1 transition-all flex items-center gap-3"
           >
              <span className="material-symbols-outlined text-xl">add_circle</span> Tạo thủ công
           </button>
           <Link to="/teacher/ai-generator" className="bg-[#b20112] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-900/20 hover:bg-[#d62828] hover:-translate-y-1 transition-all flex items-center gap-3">
              <span className="material-symbols-outlined text-xl">auto_awesome</span> Tạo thêm bằng AI
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Sidebar: Subject List */}
        <div className="lg:col-span-3 space-y-6">
           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Danh sách môn học</h3>
           <div className="space-y-2">
              {subjects.map(s => (
                <button 
                  key={s.id}
                  onClick={() => setActiveSubject(s.id)}
                  className={`w-full p-6 rounded-3xl border-2 transition-all text-left flex justify-between items-center group ${activeSubject === s.id ? 'border-[#b20112] bg-red-50/20 shadow-lg shadow-red-900/5' : 'border-slate-50 bg-white hover:border-slate-200'}`}
                >
                   <div>
                      <p className={`text-sm font-black transition-colors ${activeSubject === s.id ? 'text-[#b20112]' : 'text-slate-600'}`}>{s.name}</p>
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">{s.count} câu hỏi</p>
                   </div>
                   <span className={`material-symbols-outlined text-xl transition-all ${activeSubject === s.id ? 'text-[#b20112] translate-x-1' : 'text-slate-200 opacity-0 group-hover:opacity-100'}`}>chevron_right</span>
                </button>
              ))}
           </div>
        </div>

        {/* Main Content: Question List */}
        <div className="lg:col-span-9 space-y-8">
           {/* Filters & Actions */}
           <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-4">
                 <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input 
                      type="text" 
                      placeholder="Tìm kiếm nội dung..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-12 pr-6 py-3 rounded-xl bg-slate-50 border-none text-xs font-bold focus:ring-2 focus:ring-red-500/20 transition-all w-64" 
                    />
                 </div>
                 <select 
                   value={difficultyFilter}
                   onChange={e => setDifficultyFilter(e.target.value)}
                   className="px-6 py-3 rounded-xl bg-slate-50 border-none text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer focus:ring-2 focus:ring-red-500/20"
                 >
                    <option value="all">Tất cả mức độ</option>
                    <option value="easy">Dễ</option>
                    <option value="medium">Trung bình</option>
                    <option value="hard">Khó</option>
                 </select>
              </div>
              <button className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-[#b20112] transition-colors">
                 <span className="material-symbols-outlined text-xl">download</span> Xuất dữ liệu
              </button>
           </div>

           {/* Topics horizontal tabs */}
           <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
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
              {topics.map(t => (
                 <button
                    key={t.topic_id}
                    type="button"
                    onClick={() => setActiveTopic(String(t.topic_id))}
                    className={`px-5 py-3 rounded-2xl font-black text-[9px] uppercase tracking-wider whitespace-nowrap transition-all border cursor-pointer ${
                       activeTopic === String(t.topic_id)
                          ? 'bg-[#b20112] border-[#b20112] text-white shadow-lg shadow-red-900/10'
                          : 'bg-white border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-200'
                    }`}
                 >
                    {t.topic_name}
                 </button>
              ))}
           </div>

           {/* Questions Table-like List */}
           <div className="space-y-4">
              {(() => {
                 const filteredQuestions = questions.filter(q => {
                    const matchesSubject = String(q.subjectId) === String(activeSubject);
                    const matchesTopic = activeTopic === 'all' || String(q.topicId) === String(activeTopic);
                    const matchesSearch = searchQuery.trim() === '' || q.text.toLowerCase().includes(searchQuery.toLowerCase());
                    
                    let matchesDifficulty = true;
                    if (difficultyFilter !== 'all') {
                       const lvl = (q.level || '').toLowerCase();
                       if (difficultyFilter === 'easy') {
                          matchesDifficulty = lvl === 'easy' || lvl === 'dễ';
                       } else if (difficultyFilter === 'medium') {
                          matchesDifficulty = lvl === 'medium' || lvl === 'trung bình';
                       } else if (difficultyFilter === 'hard') {
                          matchesDifficulty = lvl === 'hard' || lvl === 'khó';
                       }
                    }
                    return matchesSubject && matchesTopic && matchesSearch && matchesDifficulty;
                 });

                 if (filteredQuestions.length === 0) {
                    return (
                       <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 text-center text-slate-400 text-xs font-black uppercase tracking-widest">
                          Không tìm thấy câu hỏi nào
                       </div>
                    );
                 }

                 return filteredQuestions.map(q => {
                    const topicName = topics.find(t => String(t.topic_id) === String(q.topicId))?.topic_name || 'Khác';
                    return (
                       <div key={q.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-red-900/5 transition-all group">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                             <div className="space-y-4 flex-1">
                                <div className="flex flex-wrap gap-2">
                                   <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">{q.type || 'Trắc nghiệm'}</span>
                                   <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                      q.level === 'hard' || q.level === 'Khó' ? 'bg-red-50 text-[#b20112]' : 
                                      q.level === 'easy' || q.level === 'Dễ' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                                   }`}>{q.level === 'hard' ? 'Khó' : q.level === 'easy' ? 'Dễ' : q.level === 'medium' ? 'Trung bình' : q.level}</span>
                                   <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">{topicName}</span>
                                   <span className="bg-slate-50 text-slate-400 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest italic">{q.source}</span>
                                </div>
                                <h4 className="text-lg font-black text-slate-800 tracking-tight leading-snug">{q.text}</h4>
                                {q.options.length > 0 && (
                                   <div className="mt-4">
                                      <div className="p-4 rounded-2xl border bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm text-xs font-bold inline-flex items-center gap-2">
                                         <span className="material-symbols-outlined text-sm">check_circle</span>
                                         <span className="opacity-60">Đáp án đúng:</span> 
                                         {['A', 'B', 'C', 'D'][q.correctAnswer]}. {q.options[q.correctAnswer]}
                                      </div>
                                   </div>
                                )}
                             </div>
                             
                             <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => handleOpenEditModal(q)}
                                  className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-[#b20112] hover:text-white transition-all flex items-center justify-center cursor-pointer"
                                >
                                   <span className="material-symbols-outlined text-xl">edit</span>
                                </button>
                                <button 
                                  onClick={() => handleOpenViewModal(q)}
                                  className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center cursor-pointer"
                                >
                                   <span className="material-symbols-outlined text-xl">visibility</span>
                                </button>
                                <button 
                                  onClick={() => handleDelete(q.id)}
                                  className="w-10 h-10 rounded-xl bg-slate-50 text-red-300 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center cursor-pointer"
                                >
                                   <span className="material-symbols-outlined text-xl">delete</span>
                                </button>
                             </div>
                          </div>
                       </div>
                    );
                 });
              })()}
           </div>

           <button 
             onClick={fetchData}
             className="w-full py-6 rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] hover:border-[#b20112] hover:text-[#b20112] transition-all"
           >
              Làm mới danh sách
           </button>
        </div>
      </div>

      {/* Question Modal (Create/Edit/View) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="p-10 md:p-14">
                 <div className="flex justify-between items-start mb-10">
                    <div>
                       <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
                          {modalMode === 'create' ? 'Tạo câu hỏi ' : modalMode === 'edit' ? 'Chỉnh sửa ' : 'Chi tiết '}
                          <span className="text-[#b20112]">Câu hỏi</span>
                       </h2>
                       <p className="text-slate-500 mt-2 font-medium">
                          {modalMode === 'view' ? 'Xem thông tin chi tiết của câu hỏi trong ngân hàng.' : 'Điền thông tin bên dưới để lưu vào ngân hàng.'}
                       </p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center">
                       <span className="material-symbols-outlined">close</span>
                    </button>
                 </div>

                 <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Môn học</label>
                          <select 
                            disabled={modalMode === 'view'}
                            value={formData.subjectId}
                            onChange={async e => {
                               const newSubId = e.target.value;
                               try {
                                  const subTopics = await getTopicsBySubject(newSubId);
                                  setModalTopics(subTopics);
                                  setFormData({ 
                                     ...formData, 
                                     subjectId: newSubId, 
                                     topicId: subTopics.length > 0 ? String(subTopics[0].topic_id) : '1' 
                                  });
                               } catch (err) {
                                  console.error(err);
                                  setFormData({ ...formData, subjectId: newSubId });
                                }
                            }}
                            className="w-full p-4 rounded-2xl bg-slate-50 border-none text-xs font-bold focus:ring-2 focus:ring-red-500/20 disabled:opacity-60"
                          >
                             {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Chương học</label>
                          <select 
                            disabled={modalMode === 'view'}
                            value={formData.topicId}
                            onChange={e => setFormData({ ...formData, topicId: e.target.value })}
                            className="w-full p-4 rounded-2xl bg-slate-50 border-none text-xs font-bold focus:ring-2 focus:ring-red-500/20 disabled:opacity-60 animate-in fade-in"
                          >
                             {modalTopics.map(t => <option key={t.topic_id} value={t.topic_id}>{t.topic_name}</option>)}
                             {modalTopics.length === 0 && <option value="">Chưa có chương học nào</option>}
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Độ khó</label>
                          <select 
                            disabled={modalMode === 'view'}
                            value={formData.difficulty}
                            onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
                            className="w-full p-4 rounded-2xl bg-slate-50 border-none text-xs font-bold focus:ring-2 focus:ring-red-500/20 disabled:opacity-60"
                          >
                             <option value="easy">Dễ</option>
                             <option value="medium">Trung bình</option>
                             <option value="hard">Khó</option>
                          </select>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nội dung câu hỏi</label>
                       <textarea 
                         disabled={modalMode === 'view'}
                         rows={4}
                         placeholder="Nhập nội dung câu hỏi tại đây..."
                         value={formData.content}
                         onChange={e => setFormData({ ...formData, content: e.target.value })}
                         className="w-full p-6 rounded-[2rem] bg-slate-50 border-none text-sm font-bold focus:ring-2 focus:ring-red-500/20 resize-none disabled:opacity-60"
                       />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {formData.options.map((opt, i) => (
                         <div key={i} className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Đáp án {['A', 'B', 'C', 'D'][i]}</label>
                            <input 
                              disabled={modalMode === 'view'}
                              type="text"
                              placeholder={`Nhập đáp án ${['A', 'B', 'C', 'D'][i]}...`}
                              value={opt}
                              onChange={e => handleOptionChange(i, e.target.value)}
                              className="w-full p-4 rounded-2xl bg-slate-50 border-none text-xs font-bold focus:ring-2 focus:ring-red-500/20 disabled:opacity-60"
                            />
                         </div>
                       ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Đáp án đúng</label>
                          <div className="flex gap-3">
                             {['A', 'B', 'C', 'D'].map(label => (
                               <button 
                                 disabled={modalMode === 'view'}
                                 key={label}
                                 type="button"
                                 onClick={() => setFormData({ ...formData, correctOptionLabel: label })}
                                 className={`flex-1 py-4 rounded-xl font-black text-xs transition-all ${formData.correctOptionLabel === label ? 'bg-[#b20112] text-white shadow-lg shadow-red-900/20' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 disabled:opacity-60'}`}
                               >
                                  {label}
                               </button>
                             ))}
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Giải thích (Tùy chọn)</label>
                          <input 
                            disabled={modalMode === 'view'}
                            type="text"
                            placeholder="Giải thích tại sao đáp án này đúng..."
                            value={formData.explanation}
                            onChange={e => setFormData({ ...formData, explanation: e.target.value })}
                            className="w-full p-4 rounded-2xl bg-slate-50 border-none text-xs font-bold focus:ring-2 focus:ring-red-500/20 disabled:opacity-60"
                          />
                       </div>
                    </div>

                    {formError && (
                      <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-xs font-black uppercase tracking-widest flex items-center gap-3">
                         <span className="material-symbols-outlined">error</span> {formError}
                      </div>
                    )}

                    <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                       <button 
                         type="button"
                         onClick={() => setIsModalOpen(false)}
                         className="px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
                       >
                          {modalMode === 'view' ? 'Đóng lại' : 'Hủy bỏ'}
                       </button>
                       {modalMode !== 'view' && (
                         <button 
                           type="submit"
                           disabled={isSubmitting}
                           className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-black transition-all disabled:opacity-50 flex items-center gap-3"
                         >
                            {isSubmitting ? (
                              <>
                                <span className="material-symbols-outlined animate-spin">sync</span> Đang lưu...
                              </>
                            ) : (
                              <>
                                <span className="material-symbols-outlined">check_circle</span> {modalMode === 'create' ? 'Lưu câu hỏi' : 'Cập nhật thay đổi'}
                              </>
                            )}
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


