import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getStudentResultDetail } from '@/api/studentApi';
import type { StudentResultData } from '@/api/studentApi';

import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import EmptyState from '@/components/common/EmptyState';

export default function ResultsPage() {
   const { id } = useParams();
   const [data, setData] = useState<StudentResultData | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState('');

   useEffect(() => {
      if (!id) return;
      const fetchResult = async () => {
         try {
            const resultData = await getStudentResultDetail(id);
            setData(resultData);
         } catch {
            setError('Không thể tải dữ liệu kết quả');
         } finally {
            setIsLoading(false);
         }
      };
      fetchResult();
   }, [id]);

   if (isLoading) return <LoadingState />;
   if (error) return <ErrorState message={error} />;
   if (!data) return <EmptyState />;

   const results = data.overview;
   const questions = data.questions;

   return (
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
         {/* Score Summary Header */}
         <section className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm p-12 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-20 opacity-[0.02]">
               <span className="material-symbols-outlined text-[300px]">emoji_events</span>
            </div>

            <div className="relative w-56 h-56 flex items-center justify-center">
               <svg className="w-full h-full -rotate-90">
                  <circle cx="112" cy="112" r="100" fill="none" stroke="#f1f5f9" strokeWidth="16" />
                  <circle
                     cx="112"
                     cy="112"
                     r="100"
                     fill="none"
                     stroke="#b20112"
                     strokeWidth="16"
                     strokeDasharray="628"
                     strokeDashoffset={628 - (628 * results.accuracy) / 100}
                     strokeLinecap="round"
                     className="transition-all duration-1000 ease-out"
                  />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-6xl font-black text-slate-900 tracking-tighter">{results.score}<span className="text-2xl text-slate-300">/10</span></span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Điểm số</span>
               </div>
            </div>

            <div className="flex-1 space-y-8 relative z-10 text-center md:text-left">
               <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">Hoàn thành bài tập!</h2>
                  <p className="text-slate-500 font-medium">Bạn đã hoàn thành bài ôn tập. Dưới đây là kết quả chi tiết.</p>
               </div>

               <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Số câu hỏi</p>
                     <p className="text-2xl font-black text-slate-900 tracking-tight">{results.total}</p>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Thời gian</p>
                     <p className="text-2xl font-black text-slate-900 tracking-tight">{results.time}</p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Độ chính xác</p>
                     <p className="text-2xl font-black text-emerald-500 tracking-tight">{results.accuracy}%</p>
                  </div>
                  <div className="hidden sm:block bg-slate-50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Xếp hạng</p>
                     <p className="text-2xl font-black text-amber-500 tracking-tight">{results.score >= 8 ? 'Giỏi' : results.score >= 5 ? 'Khá' : 'TB'}</p>
                  </div>
               </div>
            </div>
         </section>

         {/* Action Buttons */}
         <section className="flex flex-wrap gap-4 justify-center md:justify-start px-4">
            <Link to="/student/practice/setup">
               <button className="px-10 py-5 rounded-2xl bg-[#b20112] text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-red-900/20 hover:bg-[#d62828] active:scale-95 transition-all flex items-center gap-3">
                  <span className="material-symbols-outlined text-xl">refresh</span> Làm bộ đề mới
               </button>
            </Link>
            <Link to="/student/history">
               <button className="px-10 py-5 rounded-2xl bg-white border border-slate-100 text-slate-900 text-xs font-black uppercase tracking-[0.2em] shadow-sm hover:border-[#b20112] transition-all flex items-center gap-3">
                  <span className="material-symbols-outlined text-xl">history</span> Xem lịch sử
               </button>
            </Link>
            <Link to="/student/dashboard">
               <button className="px-10 py-5 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center gap-3">
                  <span className="material-symbols-outlined text-xl">home</span> Dashboard
               </button>
            </Link>
         </section>

         {/* Detailed Review List */}
         <section className="space-y-8 px-2">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Chi tiết câu trả lời</h3>
            <div className="space-y-6">
               {questions.map((q, idx) => (
                  <div key={idx} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                     <div className="p-8 md:p-12 space-y-8">
                        <div className="flex justify-between items-center">
                           <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${q.userAnswer === q.correctAnswer ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                              {q.userAnswer === q.correctAnswer ? 'Chính xác' : 'Chưa đúng'}
                           </span>
                           <span className="text-xs font-black text-slate-300 uppercase tracking-widest italic">Câu {idx + 1}</span>
                        </div>

                        <h4 className="text-xl font-black text-slate-800 leading-relaxed tracking-tight">{q.text}</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {q.options.map((opt, i) => {
                              const label = String.fromCharCode(65 + i);
                              const isCorrect = opt.id === q.correctAnswer;
                              const isUser = opt.id === q.userAnswer;
                              return (
                                 <div key={opt.id} className={`p-5 rounded-2xl border-2 flex items-center gap-4 transition-all ${isCorrect ? 'border-emerald-500 bg-emerald-50/50' :
                                       isUser && !isCorrect ? 'border-[#b20112] bg-red-50/50' : 'border-slate-50 bg-slate-50/30'
                                    }`}>
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs transition-all ${isCorrect ? 'bg-emerald-500 text-white' :
                                          isUser ? 'bg-[#b20112] text-white' : 'bg-white text-slate-300'
                                       }`}>
                                       {label}
                                    </div>
                                    <span className={`font-bold text-sm ${isCorrect ? 'text-emerald-700' : isUser ? 'text-[#b20112]' : 'text-slate-500'}`}>
                                       {opt.text || `Option ${i + 1}`}
                                    </span>
                                    {isCorrect && <span className="material-symbols-outlined text-emerald-500 ml-auto">check_circle</span>}
                                    {isUser && !isCorrect && <span className="material-symbols-outlined text-[#b20112] ml-auto">cancel</span>}
                                 </div>
                              );
                           })}
                        </div>

                        <div className="bg-slate-900 rounded-[1.5rem] p-8 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:rotate-12 transition-transform">
                              <span className="material-symbols-outlined text-5xl text-white">school</span>
                           </div>
                           <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <span className="material-symbols-outlined text-sm">auto_awesome</span> Giải thích từ AI
                              <span className="material-symbols-outlined text-sm">history_edu</span> Giải thích từ giáo viên
                           </p>
                           <p className="text-white/80 text-xs leading-relaxed font-medium">
                              {q.explanation || 'Chưa có giải thích cho câu hỏi này.'}
                           </p>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </section>
      </div>
   );
}
