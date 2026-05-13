import React from 'react';

export default function StudentPracticePage() {
  const practiceModules = [
    { name: 'Cấu trúc dữ liệu & Giải thuật', topics: 12, completed: 8, icon: 'account_tree', color: 'bg-red-500' },
    { name: 'Mạng máy tính', topics: 10, completed: 4, icon: 'settings_input_antenna', color: 'bg-blue-500' },
    { name: 'Lập trình Java nâng cao', topics: 15, completed: 12, icon: 'code', color: 'bg-purple-500' },
    { name: 'Cơ sở dữ liệu', topics: 8, completed: 7, icon: 'database', color: 'bg-orange-500' },
  ];

  const ongoingExams = [
    { title: 'Kiểm tra giữa kỳ - Mạng máy tính', deadline: 'Còn 2 ngày', questions: 40, duration: '60 phút' },
    { title: 'Bài tập tuần 4 - Java', deadline: 'Hôm nay', questions: 20, duration: '30 phút' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-12">
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

      {/* Hero Header */}
      <section className="bg-white rounded-[2.5rem] p-10 md:p-14 border border-slate-50 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight mb-6">Luyện tập thông minh <br /><span className="text-[#b20112]">với Quizify AI</span></h1>
          <p className="text-slate-500 font-medium text-lg leading-relaxed mb-10">Chọn một môn học bên dưới để bắt đầu ôn tập. Hệ thống AI sẽ tự động điều chỉnh độ khó dựa trên kết quả làm bài của bạn.</p>
          <div className="flex gap-4">
             <button className="px-8 py-4 bg-[#b20112] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-red-900/20 hover:scale-105 transition-all">Luyện tập ngẫu nhiên</button>
             <button className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all">Xem bảng xếp hạng</button>
          </div>
        </div>
        <div className="absolute right-[-5%] top-[-10%] w-80 h-80 bg-red-500/5 rounded-full blur-[100px]"></div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Practice Grid */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Môn học của bạn</h3>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">4 Môn đang theo học</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {practiceModules.map((sub, idx) => (
              <div key={idx} className="bg-white p-8 rounded-[2rem] border border-slate-50 shadow-sm hover:shadow-xl transition-all group cursor-pointer relative overflow-hidden">
                <div className="relative z-10">
                  <div className={`w-14 h-14 ${sub.color} text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                    <span className="material-symbols-outlined text-2xl">{sub.icon}</span>
                  </div>
                  <h4 className="text-lg font-black text-slate-900 mb-4 leading-tight">{sub.name}</h4>
                  
                  <div className="flex justify-between items-end mb-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{sub.completed} / {sub.topics} Chủ đề</p>
                    <p className="text-xs font-black text-slate-900">{Math.round((sub.completed / sub.topics) * 100)}%</p>
                  </div>
                  <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                    <div className={`h-full ${sub.color} rounded-full`} style={{ width: `${(sub.completed / sub.topics) * 100}%` }}></div>
                  </div>
                </div>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-slate-50 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Assignments Sidebar */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6">Bài tập được giao</h3>
              <div className="space-y-6">
                {ongoingExams.map((exam, idx) => (
                  <div key={idx} className="space-y-3 group cursor-pointer">
                    <div className="flex justify-between items-start">
                       <h5 className="text-sm font-bold leading-snug pr-4 group-hover:text-red-400 transition-colors">{exam.title}</h5>
                       <span className="text-[9px] font-black bg-red-500 px-2 py-1 rounded text-white whitespace-nowrap">{exam.deadline}</span>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                       <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">quiz</span> {exam.questions} câu</span>
                       <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span> {exam.duration}</span>
                    </div>
                    {idx === 0 && <div className="h-px w-full bg-white/5 mt-4"></div>}
                  </div>
                ))}
              </div>
              <button className="w-full mt-8 py-3.5 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Xem tất cả bài tập</button>
           </div>

           {/* AI Learning Insight */}
           <div className="bg-red-50/50 rounded-[2.5rem] p-8 border border-red-100 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg shadow-red-900/5 mb-6">
                <span className="material-symbols-outlined text-red-500 text-3xl animate-pulse" style={{fontVariationSettings: "'FILL' 1"}}>auto_awesome</span>
              </div>
              <h4 className="text-lg font-black text-slate-900 mb-2 tracking-tight">AI Gợi ý cho bạn</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">Bạn đang làm rất tốt phần 'Địa chỉ IP'. Hãy thử thách bản thân với chủ đề 'Routing Protocols' để bứt phá điểm số nhé!</p>
              <button className="w-full py-3.5 bg-white text-[#b20112] rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:shadow-md transition-all border border-red-100">Bắt đầu ngay</button>
           </div>
        </div>
      </div>
    </div>
  );
}
