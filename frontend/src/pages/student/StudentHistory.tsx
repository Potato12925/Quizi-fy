import React from 'react';
import { Link } from 'react-router-dom';

export default function HistoryPage() {
  const attempts = [
    { id: 1, subject: 'Mạng máy tính', date: '25/04/2024', score: 8, total: 10, time: '12:45', status: 'Giỏi' },
    { id: 2, subject: 'Cấu trúc dữ liệu', date: '24/04/2024', score: 9, total: 10, time: '15:20', status: 'Xuất sắc' },
    { id: 3, subject: 'Lập trình hướng đối tượng', date: '23/04/2024', score: 6, total: 10, time: '18:10', status: 'Khá' },
    { id: 4, subject: 'Cơ sở dữ liệu', date: '22/04/2024', score: 7, total: 10, time: '14:30', status: 'Khá' },
    { id: 5, subject: 'Mạng máy tính', date: '21/04/2024', score: 5, total: 10, time: '20:00', status: 'TB' },
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-2">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Lịch sử <span className="text-[#b20112]">ôn luyện</span></h1>
          <p className="text-slate-500 mt-2 font-medium">Theo dõi sự tiến bộ của bạn qua từng bài tập.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
           <button className="flex-1 md:flex-none px-8 py-4 rounded-2xl bg-white border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#b20112] transition-all shadow-sm">
             Tải báo cáo (PDF)
           </button>
        </div>
      </div>

      {/* Progress Chart Mockup */}
      <section className="bg-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20">
         <div className="absolute top-0 right-0 p-20 opacity-5">
            <span className="material-symbols-outlined text-[300px]">trending_up</span>
         </div>
         <div className="relative z-10 space-y-8">
            <div className="flex justify-between items-center">
               <h3 className="text-xl font-black uppercase tracking-tight">Xu hướng học tập</h3>
               <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-[#b20112]"></div>
                     <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Điểm số</span>
                  </div>
               </div>
            </div>
            
            {/* Simple Bar Chart UI */}
            <div className="flex items-end justify-between h-48 gap-2 md:gap-4">
               {[40, 60, 45, 90, 65, 80, 55, 75, 85, 95].map((val, i) => (
                 <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                    <div className="w-full bg-white/5 rounded-t-xl relative overflow-hidden h-full flex items-end">
                       <div 
                         className="w-full bg-gradient-to-t from-[#b20112] to-[#ff4d4d] rounded-t-xl transition-all duration-1000 delay-300 group-hover:brightness-125" 
                         style={{ height: `${val}%` }}
                       >
                          <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-slate-900 px-2 py-1 rounded text-[9px] font-black transition-all">
                             {val}%
                          </div>
                       </div>
                    </div>
                    <span className="text-[8px] font-black opacity-30 uppercase tracking-tighter">Bài {i + 1}</span>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
           <input type="text" placeholder="Tìm kiếm môn học..." className="w-full bg-slate-50 border-none rounded-xl py-4 px-12 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-red-100 transition-all" />
           <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">search</span>
        </div>
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
           <select className="bg-slate-50 border-none rounded-xl py-4 px-6 text-xs font-black uppercase tracking-widest text-slate-500 outline-none cursor-pointer">
              <option>Tất cả môn học</option>
              <option>Mạng máy tính</option>
              <option>Cấu trúc dữ liệu</option>
           </select>
           <button className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-center hover:bg-slate-800 transition-all">
              <span className="material-symbols-outlined text-xl">tune</span>
           </button>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-4">
         {attempts.map((attempt) => (
           <div key={attempt.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:border-[#b20112]/30 transition-all group flex flex-col md:flex-row items-center gap-8">
              <div className="w-20 h-20 rounded-2xl bg-slate-50 flex flex-col items-center justify-center border border-slate-100 group-hover:bg-red-50 group-hover:border-red-100 transition-colors">
                 <span className="text-2xl font-black text-slate-900 group-hover:text-[#b20112]">{attempt.score}</span>
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">/{attempt.total}</span>
              </div>
              
              <div className="flex-1 text-center md:text-left">
                 <h4 className="text-xl font-black text-slate-900 tracking-tight mb-1">{attempt.subject}</h4>
                 <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <span className="material-symbols-outlined text-sm">calendar_month</span> {attempt.date}
                    </p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <span className="material-symbols-outlined text-sm">timer</span> {attempt.time}
                    </p>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      attempt.status === 'Xuất sắc' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                      attempt.status === 'Giỏi' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                    }`}>
                       {attempt.status}
                    </span>
                 </div>
              </div>

              <div className="flex gap-3">
                 <Link to="/student/results">
                    <button className="px-6 py-3 rounded-xl bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-[#b20112] hover:text-white transition-all shadow-sm">
                       Xem lại
                    </button>
                 </Link>
                 <button className="px-6 py-3 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10">
                    Luyện lại
                 </button>
              </div>
           </div>
         ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center py-8">
         <div className="flex gap-2">
            {[1, 2, 3, '...', 12].map((p, i) => (
              <button key={i} className={`w-12 h-12 rounded-xl flex items-center justify-center text-[10px] font-black transition-all border ${p === 1 ? 'bg-[#b20112] border-[#b20112] text-white shadow-lg shadow-red-900/20' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}>
                 {p}
              </button>
            ))}
         </div>
      </div>
    </div>
  );
}
