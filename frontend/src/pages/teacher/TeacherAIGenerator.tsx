import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { generateQuestions, saveGeneratedQuestions, getTopicsBySubject, getResources, type GeneratedQuestion, type DbTopic, type TeacherResource } from '@/api/teacherApi';

export default function AiGeneratorPage() {
  const location = useLocation();
  const passedDocId = location.state?.documentId;

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    subjectId: 1,
    topicId: 1,
    documentId: passedDocId ? String(passedDocId) : 'all',
    rangeType: 'all', // 'all' | 'partial'
    partialText: '',
    level: 'Trung bình',
    quantity: 20,
    language: 'Tiếng Việt'
  });

  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [expandedSource, setExpandedSource] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [resources, setResources] = useState<TeacherResource[]>([]);
  const [availableTopics, setAvailableTopics] = useState<DbTopic[]>([]);

  // Load resources and pre-select subject
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const resList = await getResources();
        setResources(resList);
        
        if (passedDocId) {
          const doc = resList.find(r => String(r.id) === String(passedDocId));
          if (doc && doc.subjectId) {
            setFormData(prev => ({ ...prev, subjectId: doc.subjectId! }));
          }
        }
      } catch (err) {
        console.error('Lỗi tải tài liệu', err);
      }
    };
    loadInitialData();
  }, [passedDocId]);

  // Load topics dynamically based on subjectId
  useEffect(() => {
    const loadTopics = async () => {
      try {
        const topics = await getTopicsBySubject(formData.subjectId);
        setAvailableTopics(topics);
        if (topics.length > 0) {
          setFormData(prev => ({ ...prev, topicId: topics[0].topic_id }));
        }
      } catch (err) {
        console.error('Lỗi tải chương học', err);
      }
    };
    loadTopics();
  }, [formData.subjectId]);

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subjectId) {
      setError('Vui lòng chọn môn học');
      return;
    }

    if (!formData.topicId) {
      setError('Vui lòng chọn chương học để lưu trữ câu hỏi');
      return;
    }

    if (formData.rangeType === 'partial' && !formData.partialText.trim()) {
      setError('Vui lòng nhập phần trích dẫn văn bản giới hạn nội dung');
      return;
    }

    if (!formData.level) {
      setError('Vui lòng chọn mức độ khó');
      return;
    }

    if (!formData.quantity || formData.quantity < 1 || formData.quantity > 100) {
      setError('Số lượng câu hỏi phải từ 1 đến 100');
      return;
    }

    setError('');
    setStep(3); // Show processing UI
    setIsGenerating(true);

    try {
      const result = await generateQuestions(formData);
      setQuestions(result);
      setStep(4); // Move to review step
    } catch {
        setError('Lỗi tạo câu hỏi');
      setStep(2); // Go back if error
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    const approvedQuestions = questions.filter(q => q.isApproved);
    if (approvedQuestions.length === 0) {
      alert('Chưa có câu hỏi nào được duyệt!');
      return;
    }

    setIsSaving(true);
    try {
      const questionsToSave = approvedQuestions.map(q => ({
        ...q,
        topicId: String(formData.topicId)
      }));
      await saveGeneratedQuestions({ questions: questionsToSave });
      alert('Đã lưu câu hỏi thành công!');
      navigate('/teacher/question-bank');
    } catch {
      alert('Lỗi lưu câu hỏi');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleApprove = (id: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, isApproved: !q.isApproved } : q));
  };

  const handleEdit = (idx: number, field: string, value: any, optIdx?: number) => {
    const newQuestions = [...questions];
    if (optIdx !== undefined) {
      newQuestions[idx].options[optIdx] = value;
    } else {
      newQuestions[idx] = { ...newQuestions[idx], [field]: value };
    }
    newQuestions[idx].isApproved = false;
    setQuestions(newQuestions);
  };

  const approvedCount = questions.filter(q => q.isApproved).length;
  const isAllApproved = approvedCount === questions.length && questions.length > 0;

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c] font-sans pb-24">
      {/* Import Material Symbols */}
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-50/80 backdrop-blur-xl shadow-[0px_12px_32px_rgba(147,0,10,0.06)] flex items-center justify-between px-6 py-4 w-full">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#d62828] flex items-center justify-center text-white font-bold text-sm overflow-hidden border-2 border-[#ffdad6]">
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvM0S4MsBPNPJhU-zrBiqAM7h3sCY7Fa-y70x1pukUjhC5aSrNhNC-YR8NsLqClRS55fpCPM5L3TudsHQanfoWWGiX4Y2cHBF0aLcGrstlkNxOBg-r2drMNS5YLDnUGGzvkkoeqYJQ6gfrLEtYsgttuK-zknztDK0FFGPmJ-vvR65tQLKWoDu9LUVJsvV7YuTryC_tvhngvA9WOpVZabdcnlrYM6TNb2k_NQHSUW34kNbzU7Mys2ZT17DKJnCK4-VVQSi7Uv80SVg" alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-xl font-bold tracking-tighter text-[#b20112]">Quizify AI</h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="material-symbols-outlined text-slate-600 p-2 hover:bg-red-50 rounded-full transition-all">notifications</button>
          <Link to="/teacher/dashboard" className="material-symbols-outlined text-slate-500 p-2 hover:bg-red-50 rounded-full transition-all">close</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Stepper */}
        <nav className="flex justify-between items-center mb-16 relative">
          <div className="absolute top-5 left-0 w-full h-[2px] bg-[#e2e2e2] -z-10"></div>
          
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2 bg-[#f9f9f9] px-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                step === i ? 'bg-[#b20112] text-white shadow-lg ring-4 ring-white' : 
                step > i ? 'bg-green-100 text-green-700 border-2 border-green-200' : 
                'bg-[#e2e2e2] text-[#5c403d]'
              }`}>
                {step > i ? <span className="material-symbols-outlined text-sm">check</span> : <span className="text-sm font-bold">{i}</span>}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${step >= i ? 'text-[#b20112]' : 'text-slate-400'}`}>
                {i === 1 ? '1. Tải tài liệu' : i === 2 ? '2. Cấu hình' : i === 3 ? '3. Xử lý' : '4. Duyệt & Lưu'}
              </span>
            </div>
          ))}
        </nav>

        {/* STEP 1: UPLOAD (RESTORED) */}
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="md:col-span-12 space-y-8 bg-white p-10 md:p-12 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="space-y-2">
                <h2 className="text-4xl font-extrabold tracking-tight leading-tight">Chọn nguồn tài nguyên tài liệu</h2>
                <p className="text-lg text-[#5c403d] leading-relaxed font-medium">Chọn phạm vi tài liệu giảng dạy để AI phân tích và thiết lập bộ câu hỏi.</p>
              </div>

              {error && <div className="p-4 bg-red-50 text-red-500 rounded-xl font-bold text-xs">{error}</div>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="space-y-4">
                  <label className="block text-sm font-bold uppercase tracking-wider text-[#5c403d]">Chọn môn học</label>
                  <select 
                    value={formData.subjectId}
                    onChange={e => setFormData({ ...formData, subjectId: parseInt(e.target.value) })}
                    className="w-full bg-[#f3f3f3] border-none rounded-xl px-6 py-4 text-on-surface focus:ring-2 focus:ring-[#d62828] outline-none font-bold"
                  >
                    <option value={1}>Mạng máy tính</option>
                    <option value={2}>Cấu trúc dữ liệu và Giải thuật</option>
                    <option value={3}>Hệ điều hành</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-bold uppercase tracking-wider text-[#5c403d]">Phạm vi tài liệu nguồn</label>
                  <div className="flex gap-4 p-1 bg-[#e8e8e8] rounded-xl">
                    <button 
                      type="button" 
                      onClick={() => setFormData({ ...formData, documentId: 'all' })}
                      className={`flex-1 py-3.5 text-xs font-bold rounded-lg transition-all ${formData.documentId === 'all' ? 'bg-white text-[#b20112] shadow-sm' : 'text-[#5c403d]'}`}
                    >
                      Tất cả tài liệu môn học
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        const firstDoc = resources.find(r => r.subjectId === formData.subjectId);
                        setFormData({ ...formData, documentId: firstDoc ? String(firstDoc.id) : '' });
                      }}
                      className={`flex-1 py-3.5 text-xs font-bold rounded-lg transition-all ${formData.documentId !== 'all' ? 'bg-white text-[#b20112] shadow-sm' : 'text-[#5c403d]'}`}
                    >
                      Chọn tài liệu cụ thể
                    </button>
                  </div>
                </div>
              </div>

              {formData.documentId !== 'all' && (
                <div className="space-y-6 pt-4 border-t border-slate-100 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="block text-sm font-bold uppercase tracking-wider text-[#5c403d]">Chọn tệp tài liệu cụ thể</label>
                      <select 
                        value={formData.documentId}
                        onChange={e => setFormData({ ...formData, documentId: e.target.value })}
                        className="w-full bg-[#f3f3f3] border-none rounded-xl px-6 py-4 text-on-surface focus:ring-2 focus:ring-[#d62828] outline-none font-bold"
                      >
                        <option value="">-- Chọn tệp tài liệu --</option>
                        {resources.filter(r => r.subjectId === formData.subjectId).map(doc => (
                          <option key={doc.id} value={doc.id}>{doc.name} ({doc.size})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-4">
                      <label className="block text-sm font-bold uppercase tracking-wider text-[#5c403d]">Độ dài nội dung đọc</label>
                      <div className="flex gap-4 p-1 bg-[#e8e8e8] rounded-xl">
                        <button 
                          type="button" 
                          onClick={() => setFormData({ ...formData, rangeType: 'all' })}
                          className={`flex-1 py-3.5 text-xs font-bold rounded-lg transition-all ${formData.rangeType === 'all' ? 'bg-white text-[#b20112] shadow-sm' : 'text-[#5c403d]'}`}
                        >
                          Toàn bộ tài liệu
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setFormData({ ...formData, rangeType: 'partial' })}
                          className={`flex-1 py-3.5 text-xs font-bold rounded-lg transition-all ${formData.rangeType === 'partial' ? 'bg-white text-[#b20112] shadow-sm' : 'text-[#5c403d]'}`}
                        >
                          Một phần tài liệu
                        </button>
                      </div>
                    </div>
                  </div>

                  {formData.rangeType === 'partial' && (
                    <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                      <label className="block text-sm font-bold uppercase tracking-wider text-[#5c403d]">Nhập đoạn văn bản trích dẫn giới hạn nội dung tạo câu hỏi</label>
                      <textarea 
                        rows={6}
                        placeholder="Hãy copy và dán một phần bài viết hoặc nội dung chính xác trong giáo trình tại đây để AI phân tích..."
                        value={formData.partialText}
                        onChange={e => setFormData({ ...formData, partialText: e.target.value })}
                        className="w-full p-6 rounded-3xl bg-[#f3f3f3] border-none text-xs font-bold focus:ring-2 focus:ring-[#d62828] resize-none"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end pt-6 border-t border-slate-50">
                <button 
                  onClick={() => {
                    if (formData.documentId !== 'all' && !formData.documentId) {
                      setError('Vui lòng chọn tài liệu cụ thể');
                      return;
                    }
                    setError('');
                    nextStep();
                  }}
                  className="bg-[#b20112] text-white px-10 py-4 rounded-xl font-bold shadow-md hover:bg-black transition-all uppercase tracking-widest text-xs flex items-center gap-2"
                >
                  Tiếp tục cấu hình <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CONFIG (RESTORED) */}
        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in slide-in-from-right-4 duration-500">
            <aside className="lg:col-span-3 space-y-8">
               <div className="rounded-xl overflow-hidden shadow-sm border border-slate-100">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBUVZ5nWRiO3ygovmn4sN0uEJ_yAc1t3kCFcUBlTd2XL0JnvivaOlk6L5nMQSernACk-_KBu2bl28AEJ2niiRIC9yQHPgW1CAE9j6_0LpduRXoD4bEszGiiOR65AHJG5QEQqLKizNdbfFGYP7vk0sha7xhasdpI9qe5c-RqD-4HYuWxFnGxSAlueobJ7rBpZjkGJJEZ0bBXhZ1v-6v-S88d2JdYb-Mmo0daTdzDpdtCG2tVQG25LzBho5UmpczDLRybhlRA-xFJyXs" alt="Decoration" className="w-full h-40 object-cover" />
                <div className="p-4 bg-[#f3f3f3]">
                  <p className="text-[10px] text-[#5c403d] italic">"Giáo dục là vũ khí mạnh nhất để thay đổi thế giới."</p>
                </div>
              </div>
            </aside>
            <section className="lg:col-span-9">
              <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-[0px_12px_32px_rgba(147,0,10,0.06)]">
                {error && <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-xl font-bold">{error}</div>}
                <form className="space-y-10" onSubmit={handleGenerate}>
                  <div className="space-y-4">
                    <label className="block text-sm font-bold uppercase tracking-wider text-[#5c403d]">Lưu bộ câu hỏi vào chương (Topic)</label>
                    <select 
                      value={formData.topicId}
                      onChange={e => setFormData({ ...formData, topicId: parseInt(e.target.value) })}
                      className="w-full bg-[#f3f3f3] border-none rounded-xl px-6 py-4 text-on-surface focus:ring-2 focus:ring-[#d62828] outline-none font-bold cursor-pointer"
                    >
                      {availableTopics.map(topic => (
                        <option key={topic.topic_id} value={topic.topic_id}>{topic.topic_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-bold uppercase tracking-wider text-[#5c403d]">Số lượng câu hỏi</label>
                      <span className="bg-[#d62828] text-white px-3 py-1 rounded-lg text-xs font-bold">{formData.quantity} CÂU</span>
                    </div>
                    <input type="range" min="10" max="100" step="10" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})} className="w-full h-2 bg-[#e8e8e8] rounded-full appearance-none cursor-pointer accent-[#d62828]" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <label className="block text-sm font-bold uppercase tracking-wider text-[#5c403d]">Mức độ khó</label>
                      <div className="flex p-1 bg-[#e8e8e8] rounded-xl gap-1">
                        {['Dễ', 'Trung bình', 'Khó'].map(l => (
                          <button key={l} type="button" onClick={() => setFormData({...formData, level: l})} className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all ${formData.level === l ? 'bg-white text-[#b20112] shadow-sm' : 'text-[#5c403d]'}`}>{l}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-4 pt-8">
                    <button type="button" onClick={prevStep} className="flex-1 py-4 text-sm font-bold border-2 border-[#e5bdb9] text-[#b20112] rounded-xl hover:bg-red-50 transition-all flex items-center justify-center gap-2">
                      Quay lại
                    </button>
                    <button type="submit" disabled={isGenerating} className="flex-[2] py-4 text-sm font-bold bg-gradient-to-r from-[#d62828] to-[#ffb3b3] text-white rounded-xl shadow-lg uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed">
                      {isGenerating ? 'Đang tạo...' : <>Bắt đầu tạo <span className="material-symbols-outlined text-base" style={{fontVariationSettings: "'FILL' 1"}}>bolt</span></>}
                    </button>
                  </div>
                </form>
              </div>
            </section>
          </div>
        )}

        {/* STEP 3: PROCESSING (RESTORED) */}
        {step === 3 && (
          <div className="flex-1 flex flex-col items-center justify-center py-12 animate-in zoom-in-95 duration-700">
            <div className="relative w-80 h-80 flex items-center justify-center mb-12" onClick={nextStep}>
              <div className="absolute inset-0 border-4 border-[#d62828]/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-[#b20112] border-t-transparent rounded-full animate-spin duration-[3s]"></div>
              <div className="w-64 h-64 rounded-full bg-white shadow-xl flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-md">
                <div className="absolute inset-0 bg-[#b20112]/5 animate-pulse"></div>
                <span className="material-symbols-outlined text-[#b20112] text-6xl mb-4" style={{fontVariationSettings: "'FILL' 1"}}>psychology</span>
                <div className="text-4xl font-extrabold tracking-tighter">94%</div>
                <div className="text-xs font-medium text-[#5c403d] uppercase tracking-widest mt-1">Đang xử lý</div>
              </div>
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Đang phân tích tài liệu...</h2>
          </div>
        )}

        {/* STEP 4: ENHANCED REVIEW & APPROVAL (ONLY THIS STEP UPDATED) */}
        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 pb-32">
            <div className="mb-8 flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight mb-2">Kết quả tạo câu hỏi</h2>
                <p className="text-[#5c403d] max-w-2xl font-medium">Bạn cần kiểm tra và xác nhận từng câu hỏi trước khi lưu vào ngân hàng.</p>
              </div>
              <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 text-right">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tiến độ duyệt</p>
                 <p className="text-xl font-black text-[#b20112] leading-none">{approvedCount}/{questions.length}</p>
              </div>
            </div>

            <div className="space-y-6">
              {questions.map((q, idx) => (
                <article key={q.id} className={`bg-white rounded-[2rem] p-8 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border-l-[6px] transition-all duration-500 ${q.isApproved ? 'border-emerald-500 bg-emerald-50/10' : 'border-[#b20112]'}`}>
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black transition-colors ${q.isApproved ? 'bg-emerald-500 text-white' : 'bg-[#b20112] text-white'}`}>
                         {q.isApproved ? '✓' : idx + 1}
                      </span>
                      <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full uppercase tracking-widest">Trắc nghiệm</span>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => setExpandedSource(expandedSource === q.id ? null : q.id)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border transition-all ${expandedSource === q.id ? 'bg-[#b20112] text-white border-[#b20112]' : 'bg-white text-slate-400 border-slate-100 hover:text-slate-600'}`}>
                          <span className="material-symbols-outlined text-sm">menu_book</span> {expandedSource === q.id ? 'Đóng nguồn' : 'Xem nguồn'}
                       </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <textarea 
                      className="w-full bg-transparent border-none p-0 font-bold text-slate-800 text-lg outline-none focus:ring-0 resize-none leading-relaxed"
                      rows={2}
                      value={q.text}
                      onChange={(e) => handleEdit(idx, 'text', e.target.value)}
                    />
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className={`p-4 rounded-xl border-2 transition-all flex items-center gap-4 cursor-pointer ${q.correctAnswer === optIdx ? 'border-[#b20112] bg-red-50/30' : 'border-slate-50 bg-slate-50'}`} onClick={() => handleEdit(idx, 'correctAnswer', optIdx)}>
                           <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${q.correctAnswer === optIdx ? 'border-[#b20112] bg-[#b20112]' : 'border-slate-300'}`}>
                              {q.correctAnswer === optIdx && <span className="text-white text-[10px]">✓</span>}
                           </div>
                           <input 
                             type="text" 
                             className="flex-1 bg-transparent border-none font-medium text-sm text-slate-700 outline-none"
                             value={opt}
                             onChange={(e) => handleEdit(idx, 'options', e.target.value, optIdx)}
                             onClick={(e) => e.stopPropagation()}
                           />
                        </div>
                      ))}
                    </div>
                  </div>

                  {expandedSource === q.id && (
                     <div className="mt-6 p-6 bg-slate-900 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                        <p className="text-[10px] font-black text-[#b20112] uppercase tracking-widest mb-2">Trích dẫn tài liệu</p>
                        <p className="text-white/80 text-xs italic font-medium leading-relaxed">"{q.sourceSnippet}"</p>
                     </div>
                  )}

                  <div className="mt-8 pt-6 border-t border-slate-50 flex justify-end items-center">
                    <button 
                      onClick={() => toggleApprove(q.id)}
                      className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${q.isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-900 text-white hover:bg-[#b20112]'}`}
                    >
                      {q.isApproved ? 'Đã duyệt ✓' : 'Xác nhận duyệt'}
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {/* Fixed Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md px-6 py-8 border-t border-slate-100 z-50 shadow-2xl">
              <div className="max-w-5xl mx-auto flex items-center justify-between gap-6">
                <div className="hidden md:block">
                  <p className="font-bold text-slate-900 uppercase text-xs tracking-tight">Trạng thái: {approvedCount}/{questions.length} câu đã duyệt</p>
                  <div className="w-48 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                     <div className="h-full bg-[#b20112] transition-all duration-1000" style={{ width: `${(approvedCount/questions.length)*100}%` }}></div>
                  </div>
                </div>
                <button 
                  disabled={!isAllApproved || isSaving}
                  onClick={handleSave} 
                  className={`flex-1 md:flex-none md:min-w-[400px] h-14 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95 ${
                    isAllApproved && !isSaving
                    ? 'bg-gradient-to-r from-[#d62828] to-[#ffb3b3] text-white hover:brightness-110' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border border-slate-200'
                  }`}
                >
                  <span className="material-symbols-outlined">database</span> 
                  {isSaving ? 'Đang lưu...' : isAllApproved ? 'Lưu vào ngân hàng câu hỏi' : 'Vui lòng duyệt hết các câu'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
