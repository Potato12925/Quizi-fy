import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStudentProgress } from '@/api/studentApi';
import type { StudentProgressData } from '@/api/studentApi';

import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import EmptyState from '@/components/common/EmptyState';

export default function ProgressPage() {
  const [data, setData] = useState<StudentProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getStudentProgress();
        setData(result);
      } catch {
        setError('Không thể tải dữ liệu');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <EmptyState />;

  const { stats, subjectPerformance } = data;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-2">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Tiến độ <br/><span className="text-[#b20112]">Học tập</span></h1>
          <p className="text-slate-500 mt-4 font-medium uppercase text-[10px] tracking-widest">Phân tích dữ liệu ôn luyện từ 01/01/2026 - Nay</p>
        </div>
        <div className="flex gap-4">
           <button className="bg-white border border-slate-100 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm flex items-center gap-2 hover:bg-slate-50">
              <span className="material-symbols-outlined text-base">file_download</span> Xuất báo cáo
           </button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Điểm trung bình', value: stats.avgScore, icon: 'grade', color: 'text-[#b20112]', bg: 'bg-red-50' },
          { label: 'Số lượt ôn tập', value: stats.totalAttempts, icon: 'history_edu', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Câu hỏi đã làm', value: stats.totalQuestions, icon: 'quiz', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Thời gian học', value: stats.timeStudied, icon: 'schedule', color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((s, idx) => (
          <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:scale-[1.02]">
             <div className={`w-12 h-12 rounded-2xl ${s.bg} ${s.color} flex items-center justify-center mb-6`}>
                <span className="material-symbols-outlined">{s.icon}</span>
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
             <p className="text-3xl font-black text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Chart Card */}
        <div className="lg:col-span-8 bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-sm space-y-10">
           <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">Xu hướng điểm số</h3>
              <div className="flex gap-2">
                 <button className="px-4 py-2 rounded-xl bg-slate-900 text-white text-[9px] font-black uppercase">Tuần</button>
                 <button className="px-4 py-2 rounded-xl bg-slate-50 text-slate-400 text-[9px] font-black uppercase">Tháng</button>
              </div>
           </div>
           
           {/* Custom SVG Line Chart */}
           <div className="w-full h-64 relative mt-10">
              <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
                <defs>
                   <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#b20112" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#b20112" stopOpacity="0" />
                   </linearGradient>
                </defs>
                {/* Grid Lines */}
                {[0, 50, 100, 150].map(y => (
                  <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                ))}
                {/* Path Area */}
                <path d="M0,150 L100,120 L200,140 L300,80 L400,100 L500,40 L600,60 L700,20 L800,30 L800,200 L0,200 Z" fill="url(#lineGrad)" />
                {/* Main Line */}
                <path d="M0,150 L100,120 L200,140 L300,80 L400,100 L500,40 L600,60 L700,20 L800,30" fill="none" stroke="#b20112" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                {/* Points */}
                {[
                  {x: 100, y: 120}, {x: 300, y: 80}, {x: 500, y: 40}, {x: 700, y: 20}
                ].map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r="6" fill="white" stroke="#b20112" strokeWidth="3" />
                ))}
              </svg>
              <div className="flex justify-between mt-6 text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">
                 <span>Tuần 1</span><span>Tuần 2</span><span>Tuần 3</span><span>Tuần 4</span><span>Tuần 5</span><span>Tuần 6</span><span>Tuần 7</span><span>Tuần 8</span>
              </div>
           </div>
        </div>

        {/* Accuracy Card */}
        <div className="lg:col-span-4 bg-slate-900 rounded-[3.5rem] p-10 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-10 opacity-10">
              <span className="material-symbols-outlined text-[100px]">track_changes</span>
           </div>
           <div className="relative z-10">
              <h3 className="text-xl font-black uppercase italic tracking-tight mb-2">Độ chính xác</h3>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Tỉ lệ trả lời đúng tổng thể</p>
           </div>
           
           <div className="flex flex-col items-center py-10 relative z-10">
              <div className="w-40 h-40 rounded-full border-[10px] border-white/5 flex items-center justify-center relative">
                 <div className="absolute inset-0 border-[10px] border-emerald-500 rounded-full border-t-transparent border-l-transparent rotate-45"></div>
                 <div className="text-center">
                    <p className="text-5xl font-black leading-none text-emerald-400">{stats.accuracy}%</p>
                    <p className="text-[9px] font-black text-white/30 uppercase mt-2 tracking-widest">Efficiency</p>
                 </div>
              </div>
           </div>

           <div className="bg-white/5 p-6 rounded-2xl border border-white/10 relative z-10">
              <p className="text-xs font-medium text-white/60 leading-relaxed italic">"Bạn đang làm rất tốt ở các câu hỏi mức độ Trung bình. Hãy thử sức thêm ở mức độ Khó!"</p>
           </div>
        </div>
      </div>

      {/* Subject Performance */}
      <div className="bg-white rounded-[3.5rem] p-12 border border-slate-100 shadow-sm">
         <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tight mb-12 flex items-center gap-4">
            <span className="material-symbols-outlined text-[#b20112]">bar_chart</span> Hiệu suất theo môn học
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-12">
            {subjectPerformance.map((s, idx) => (
              <div key={idx} className="space-y-4">
                 <div className="flex justify-between items-end">
                    <p className="text-sm font-black text-slate-800 tracking-tight">{s.name}</p>
                    <p className="text-sm font-black text-slate-900">{s.score}%</p>
                 </div>
                 <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden">
                    <div className={`h-full ${s.color} transition-all duration-1000`} style={{ width: `${s.score}%` }}></div>
                 </div>
                 <div className="flex gap-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Đã ôn: 12 bài</span>
                    <span>Thứ hạng: Top 15%</span>
                 </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
}
