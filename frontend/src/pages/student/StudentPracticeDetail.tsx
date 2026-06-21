import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getPracticeDetail, autosaveAnswers, submitPractice } from '../../api/studentApi';
import type { Question } from '../../api/studentApi';

export default function PracticePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
        getPracticeDetail(id).then(res => {
            setQuestions(res.questions);

            const duration = Number(res.duration || 0);
            let startedAtMs = null;
            if (res.startedAt) {
                const dateStr = res.startedAt;
                const suffixPattern = /(Z|[+-]\d{2}:\d{2})$/;
                const normalizedStr = suffixPattern.test(dateStr) ? dateStr : dateStr + 'Z';
                startedAtMs = new Date(normalizedStr).getTime();
            }
            const elapsedSeconds = startedAtMs ? Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)) : 0;
            setTimeLeft(Math.max(0, duration - elapsedSeconds));

            // Pre-fill answers if any
            const initAns: Record<number, number> = {};
            res.questions.forEach((q, idx) => {
                if (q.selectedOptionId) {
                    initAns[idx] = q.selectedOptionId;
                }
            });
            setAnswers(initAns);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
            alert("Không thể lấy đề thi");
            navigate('/student/dashboard');
        });
    }
  }, [id, navigate]);

  // Timer effect
  useEffect(() => {
    if (loading || submitting || timeLeft === null || timeLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, submitting, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (optionId: number, questionIdx: number) => {
    const newAnswers = { ...answers, [questionIdx]: optionId };
    setAnswers(newAnswers);
    
    // Autosave
    if (id) {
        autosaveAnswers(id, {
            answers: [
                {
                    question_id: questions[questionIdx].id,
                    selected_option_id: optionId
                }
            ]
        });
    }
  };

  const handleSubmit = async () => {
    if (!id) return;
    const confirm = window.confirm("Bạn có chắc chắn muốn nộp bài?");
    if (!confirm) return;
    
    setSubmitting(true);
    try {
        await submitPractice(id);
        navigate(`/student/results/${id}`);
    } catch(e) {
        alert("Lỗi nộp bài");
        setSubmitting(false);
    }
  }

  const autoSubmit = useCallback(async () => {
    if (!id || submitting) return;
    setSubmitting(true);
    try {
        await submitPractice(id);
        navigate(`/student/results/${id}`);
    } catch(e) {
        console.error("Auto-submit failed", e);
        navigate(`/student/results/${id}`);
    }
  }, [id, submitting, navigate]);

  useEffect(() => {
    if (!loading && !submitting && timeLeft === 0 && id) {
      autoSubmit();
    }
  }, [loading, submitting, timeLeft, id, autoSubmit]);

  if (loading) {
      return <div className="min-h-screen flex items-center justify-center text-slate-500 font-black uppercase tracking-widest">Đang tải đề thi...</div>;
  }

  if (questions.length === 0) {
      return <div className="min-h-screen flex items-center justify-center text-slate-500 font-black uppercase tracking-widest">Đề thi trống.</div>;
  }

  const progress = (Object.keys(answers).length / questions.length) * 100;

  return (
    <div className="min-h-screen bg-[#f3f3f3] text-slate-900 font-sans">
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

      {/* Focus Mode Header */}
      <header className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-xl border-b border-slate-100 px-8 py-4 z-50 flex justify-between items-center">
        <div className="flex items-center gap-6">
           <Link to="/student/practice/setup" className="material-symbols-outlined text-slate-400 hover:text-red-500 transition-colors">close</Link>
           <div className="h-6 w-px bg-slate-100"></div>
           <div>
              <h1 className="text-sm font-black uppercase tracking-tight italic">Mạng máy tính <span className="text-[#b20112]">Practice</span></h1>
              <div className="flex items-center gap-2 mt-0.5">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đang ghi nhận lượt làm</span>
              </div>
           </div>
        </div>

        <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
               <span className="material-symbols-outlined text-[#b20112] text-xl">timer</span>
               <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">{timeLeft !== null ? formatTime(timeLeft) : '--:--'}</span>
            </div>
           <button 
             onClick={handleSubmit}
             disabled={submitting}
             className="bg-[#b20112] text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-red-900/20 hover:bg-[#d62828] active:scale-95 transition-all">
              {submitting ? 'Đang nộp...' : 'Nộp bài tập'}
           </button>
        </div>
      </header>

      {/* Main Layout */}
      <main className="max-w-7xl mx-auto pt-32 pb-20 px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Side: Question Area */}
        <div className="lg:col-span-8 space-y-8">
           {/* Progress Bar */}
           <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-3">
              <div className="flex justify-between items-end">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tiến độ câu hỏi</p>
                 <p className="text-sm font-black text-[#b20112]">{Object.keys(answers).length}/{questions.length}</p>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full bg-[#b20112] transition-all duration-500" style={{ width: `${progress}%` }}></div>
              </div>
           </div>

           {/* Question Card */}
           <div className="bg-white rounded-[3rem] p-12 shadow-sm border border-slate-100 min-h-[500px] flex flex-col justify-between">
              <div className="space-y-10">
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Câu hỏi số {currentQuestion + 1}</p>
                   <h2 className="text-2xl font-black text-slate-800 leading-snug tracking-tight">{questions[currentQuestion].text}</h2>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {questions[currentQuestion].options.map((opt, idx) => (
                    <div 
                      key={opt.id}
                      onClick={() => handleSelectAnswer(opt.id, currentQuestion)}
                      className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-5 group ${answers[currentQuestion] === opt.id ? 'border-[#b20112] bg-red-50/20' : 'border-slate-50 bg-slate-50/50 hover:border-slate-200'}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-all ${answers[currentQuestion] === opt.id ? 'bg-[#b20112] text-white shadow-lg' : 'bg-white text-slate-400 group-hover:text-slate-600'}`}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className={`font-bold text-sm ${answers[currentQuestion] === opt.id ? 'text-[#b20112]' : 'text-slate-600'}`}>{opt.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-10 border-t border-slate-50 mt-12">
                 <button 
                  disabled={currentQuestion === 0}
                  onClick={() => setCurrentQuestion(currentQuestion - 1)}
                  className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-900 disabled:opacity-20 transition-all"
                 >
                    <span className="material-symbols-outlined text-lg">west</span> Câu trước
                 </button>
                 <button 
                  disabled={currentQuestion === questions.length - 1}
                  onClick={() => setCurrentQuestion(currentQuestion + 1)}
                  className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 hover:bg-[#b20112] hover:shadow-red-900/10 disabled:opacity-20 transition-all flex items-center gap-2"
                 >
                    Câu kế tiếp <span className="material-symbols-outlined text-lg">east</span>
                 </button>
              </div>
           </div>
        </div>

        {/* Right Side: Navigation Panel */}
        <div className="lg:col-span-4">
           <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm sticky top-32">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-3">
                 <span className="material-symbols-outlined text-xl">grid_view</span> Bảng điều hướng
              </h3>
              
              <div className="grid grid-cols-5 gap-3">
                 {questions.map((_, idx) => (
                   <button 
                    key={idx}
                    onClick={() => setCurrentQuestion(idx)}
                    className={`w-full aspect-square rounded-xl text-[10px] font-black transition-all border-2 ${
                      currentQuestion === idx ? 'bg-[#b20112] text-white border-[#b20112] shadow-lg shadow-red-900/20' :
                      answers[idx] !== undefined ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      'bg-white text-slate-300 border-slate-100 hover:border-slate-200'
                    }`}
                   >
                      {idx + 1}
                   </button>
                 ))}
              </div>

              <div className="mt-10 pt-8 border-t border-slate-50 space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đã trả lời</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-slate-100 border border-slate-200"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chưa làm</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-[#b20112]"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đang xem</span>
                 </div>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}
