import React from 'react';

export default function TeacherStatsPage() {
  const classStats = [
    { label: 'Điểm trung bình lớp', value: '7.8', icon: 'auto_graph', color: 'text-[#b20112]', bg: 'bg-red-50' },
    { label: 'Tỉ lệ hoàn thành', value: '92%', icon: 'checklist', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Số giờ tự học', value: '142h', icon: 'timer', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Bài tập đã làm', value: '1,240', icon: 'quiz', color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const weakTopics = [
    { name: 'Giao thức TCP/UDP', errorRate: 45, count: 120 },
    { name: 'Định tuyến IP', errorRate: 38, count: 95 },
    { name: 'Mô hình OSI', errorRate: 25, count: 210 },
    { name: 'Tầng vật lý', errorRate: 12, count: 180 },
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-2">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Phân tích <br/><span className="text-[#b20112]">Lớp học</span></h1>
          <p className="text-slate-500 mt-4 font-medium italic">"Dữ liệu thông minh giúp nâng cao hiệu quả giảng dạy."</p>
        </div>
        <div className="bg-white p-2 rounded-2xl border border-slate-100 flex gap-2">
           <button className="px-6 py-3 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">Học kỳ 2 - 2024</button>
           <button className="px-6 py-3 rounded-xl text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Lớp D21CQCN01-B</button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {classStats.map((s, idx) => (
          <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
             <div className={`w-12 h-12 rounded-2xl ${s.bg} ${s.color} flex items-center justify-center mb-6`}>
                <span className="material-symbols-outlined">{s.icon}</span>
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
             <p className="text-3xl font-black text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Knowledge Gaps Analysis */}
        <div className="lg:col-span-7 bg-white rounded-[3.5rem] p-12 border border-slate-100 shadow-sm space-y-10">
           <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">Lỗ hổng kiến thức (Knowledge Gaps)</h3>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">Các chủ đề có tỉ lệ trả lời sai cao nhất</p>
           </div>

           <div className="space-y-8 mt-10">
              {weakTopics.map((topic, idx) => (
                <div key={idx} className="space-y-4">
                   <div className="flex justify-between items-end">
                      <p className="text-sm font-black text-slate-800 tracking-tight">{topic.name}</p>
                      <div className="text-right">
                         <span className="text-xs font-black text-[#b20112]">{topic.errorRate}% Lỗi</span>
                         <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{topic.count} lượt trả lời</p>
                      </div>
                   </div>
                   <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden">
                      <div className="h-full bg-[#b20112] transition-all duration-1000" style={{ width: `${topic.errorRate}%` }}></div>
                   </div>
                </div>
              ))}
           </div>

           <div className="pt-8 border-t border-slate-50">
              <button className="text-[10px] font-black text-[#b20112] uppercase tracking-[0.2em] flex items-center gap-2 hover:underline">
                 Xem tất cả chủ đề <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
           </div>
        </div>

        {/* Activity Distribution */}
        <div className="lg:col-span-5 bg-slate-900 rounded-[3.5rem] p-12 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
           <div className="absolute top-0 right-0 p-12 opacity-10">
              <span className="material-symbols-outlined text-[120px]">groups</span>
           </div>
           
           <div className="relative z-10 space-y-2">
              <h3 className="text-xl font-black uppercase italic tracking-tight mb-2">Phân loại Sinh viên</h3>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Dựa trên hiệu suất ôn tập</p>
           </div>

           {/* Custom SVG Distribution Chart */}
           <div className="flex justify-center items-center py-12 relative z-10">
              <div className="w-48 h-48 relative">
                 <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="white" strokeWidth="12" strokeOpacity="0.05" />
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="emerald-500" strokeWidth="12" strokeDasharray="251" strokeDashoffset="50" />
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#b20112" strokeWidth="12" strokeDasharray="251" strokeDashoffset="210" />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-4xl font-black leading-none">82%</p>
                    <p className="text-[9px] font-black text-white/40 uppercase mt-1 tracking-widest">Active</p>
                 </div>
              </div>
           </div>

           <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest">
                 <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> <span>Xuất sắc (Top 20%)</span></div>
                 <span className="text-white/40">15 SV</span>
              </div>
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest">
                 <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-[#b20112]"></div> <span>Cần chú ý</span></div>
                 <span className="text-white/40">5 SV</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
