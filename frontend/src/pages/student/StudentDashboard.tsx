import React from 'react';
import { Link } from 'react-router-dom';

import { getStudentDashboard } from '@/api/studentApi';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { useAuth } from '@/contexts/AuthContext';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    getStudentDashboard().then(setData).catch((e: any) => setError(e.message)).finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  
  const subjects = data?.subjects || [];
  const metrics = data?.metrics || [];
  const activities = data?.activities || [];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
      
      {/* Hero Banner */}
      <div className="bg-[#b20112] rounded-[3.5rem] p-12 md:p-16 text-white relative overflow-hidden shadow-2xl shadow-red-900/20">
         <div className="absolute top-0 right-0 p-20 opacity-10">
            <span className="material-symbols-outlined text-[300px]">auto_awesome</span>
         </div>
         <div className="relative z-10 space-y-10">
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-2 rounded-full border border-white/10">
               <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>auto_awesome</span>
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">AI Personal Tutor</span>
            </div>
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-[1.1] uppercase italic max-w-2xl">
                 Chào {user?.full_name || 'Học sinh'}, hôm nay chúng mình cùng ôn bài gì nào?
              </h1>
              <p className="text-white/70 text-lg font-medium max-w-2xl leading-relaxed">
                 Hệ thống đã chuẩn bị sẵn các bộ câu hỏi ôn tập bám sát chương trình và các đề thi thử mới nhất. Chọn môn học để bắt đầu ngay nhé!
              </p>
            </div>
         </div>
      </div>

      {/* Stats & Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         
         {/* Tiến độ của bạn */}
         <div className="lg:col-span-8 space-y-8">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-3">
               Tiến độ của bạn
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
               {metrics.map((s: any, idx: number) => (
                 <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm flex flex-col items-center justify-center text-center transition-all hover:shadow-xl hover:shadow-red-900/5 group cursor-default">
                    <div className={`w-12 h-12 rounded-2xl ${s.bg} ${s.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                       <span className="material-symbols-outlined">{s.icon}</span>
                    </div>
                    <p className="text-2xl font-black text-slate-900 leading-none mb-1">{s.value}</p>
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{s.label}</p>
                 </div>
               ))}
            </div>
         </div>

         {/* Hoạt động */}
         <div className="lg:col-span-4 space-y-8">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-3">
               Hoạt động gần đây
            </h3>
            <div className="bg-white rounded-[3rem] p-8 border border-slate-50 shadow-sm h-full flex flex-col justify-between min-h-[300px]">
               <div className="space-y-8">
                  {activities.length === 0 ? (
                     <p className="text-xs text-slate-400 font-medium italic text-center py-10">Chưa có hoạt động làm bài nào gần đây.</p>
                  ) : (
                     activities.map((act: any) => (
                        <div key={act.id} className="flex justify-between items-center group cursor-default">
                           <div>
                              <p className="text-sm font-black text-slate-800 tracking-tight">{act.subject}</p>
                              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">{act.time}</p>
                           </div>
                           <span className="bg-red-50 text-[#b20112] px-3 py-1 rounded-lg text-xs font-black">{act.score}</span>
                        </div>
                     ))
                  )}
               </div>
               
               <Link to="/student/history" className="text-center pt-8 border-t border-slate-50">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] hover:text-[#b20112] transition-colors">Xem lịch sử</span>
               </Link>
            </div>
         </div>
      </div>

      {/* Select Subject to Start (Updated with query param) */}
      <div className="space-y-8 pt-6">
         <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">Bắt đầu ôn tập môn học</h3>
         {subjects.length === 0 ? (
            <p className="text-slate-400 font-bold uppercase tracking-widest">Không tìm thấy môn học nào được gán cho bạn.</p>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {subjects.map((s: any) => (
                 <Link key={s.id} to={`/student/practice/setup?subjectId=${s.id}`} className="group">
                   <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm transition-all hover:shadow-2xl hover:shadow-red-900/10 hover:-translate-y-2 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity select-none">
                         <span className={`text-[90px] font-black tracking-tighter ${s.color}`}>{s.indexNum}</span>
                      </div>
                      <div className={`w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center ${s.color} font-black text-xl mb-8 group-hover:bg-[#b20112] group-hover:text-white transition-all`}>
                         {s.indexNum}
                      </div>
                      <h4 className="text-xl font-black text-slate-800 tracking-tight mb-2 uppercase italic">{s.name}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">{s.questions} Câu hỏi AI đã chuẩn bị</p>
                      <div className="flex items-center gap-3 text-[#b20112] font-black text-[10px] uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all">
                         Thiết lập ngay <span className="material-symbols-outlined text-lg">east</span>
                      </div>
                   </div>
                 </Link>
               ))}
            </div>
         )}
      </div>
    </div>
  );
}
