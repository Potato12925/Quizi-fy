import React, { useState, useEffect, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';

function SetupContent() {
  const [searchParams] = useSearchParams();
  const initialSubject = searchParams.get('subjectId') || '';

  const [config, setConfig] = useState({
    subject: initialSubject,
    quantity: 20,
    level: 'Trung bình',
    topics: [] as string[],
    mode: 'random-all' 
  });

  // Sync state if query param changes
  useEffect(() => {
    const sId = searchParams.get('subjectId');
    if (sId) setConfig(prev => ({ ...prev, subject: sId }));
  }, [searchParams]);

  const subjects = [
    { id: '1', name: 'Mạng máy tính', class: 'D21CQCN01-B' },
    { id: '2', name: 'Cấu trúc dữ liệu và Giải thuật', class: 'D21CQCN01-B' },
    { id: '3', name: 'Hệ điều hành', class: 'D21CQCN02-B' },
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link to="/student/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-[#b20112] transition-colors group w-fit">
           <span className="material-symbols-outlined text-base group-hover:-translate-x-1 transition-transform">arrow_back</span>
           <span className="text-[10px] font-black uppercase tracking-[0.2em]">Quay lại Dashboard</span>
        </Link>
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Thiết lập <br/><span className="text-[#b20112]">Bộ đề ôn tập</span></h1>
        <p className="text-slate-500 font-medium max-w-xl">Tùy chỉnh các tiêu chí để hệ thống AI khởi tạo bộ đề cá nhân hóa dành riêng cho bạn.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Form */}
        <div className="lg:col-span-8 space-y-10">
          <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center gap-4">
               <span className="w-10 h-10 rounded-xl bg-red-50 text-[#b20112] flex items-center justify-center font-black">01</span>
               <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Chọn môn học ôn luyện</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjects.map((s) => (
                <div 
                  key={s.id}
                  onClick={() => setConfig({...config, subject: s.id})}
                  className={`p-6 rounded-3xl border-2 transition-all cursor-pointer group ${config.subject === s.id ? 'border-[#b20112] bg-red-50/20 shadow-lg shadow-red-900/5' : 'border-slate-50 bg-slate-50/50 hover:border-slate-200'}`}
                >
                  <div className="flex justify-between items-start mb-4">
                     <span className="material-symbols-outlined text-3xl text-slate-300 group-hover:text-[#b20112] transition-colors">library_books</span>
                     {config.subject === s.id && <span className="material-symbols-outlined text-[#b20112] text-xl" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>}
                  </div>
                  <p className="text-sm font-black text-slate-800 mb-1">{s.name}</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.class}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-10">
            <div className="flex items-center gap-4">
               <span className="w-10 h-10 rounded-xl bg-red-50 text-[#b20112] flex items-center justify-center font-black">02</span>
               <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Tiêu chí đề thi</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               <div className="space-y-6">
                 <div className="flex justify-between items-center">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Số lượng câu hỏi</label>
                   <span className="bg-[#b20112] text-white px-4 py-1 rounded-lg text-xs font-black">{config.quantity} CÂU</span>
                 </div>
                 <input 
                  type="range" min="10" max="50" step="5" 
                  value={config.quantity} 
                  onChange={(e) => setConfig({...config, quantity: parseInt(e.target.value)})}
                  className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-[#b20112]" 
                 />
               </div>

               <div className="space-y-6">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Mức độ khó</label>
                  <div className="flex p-1.5 bg-slate-50 rounded-2xl gap-1">
                    {['Dễ', 'Trung bình', 'Khó'].map(l => (
                      <button 
                        key={l}
                        onClick={() => setConfig({...config, level: l})}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${config.level === l ? 'bg-white text-[#b20112] shadow-xl shadow-red-900/5' : 'text-slate-400'}`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
               </div>
            </div>
          </section>
        </div>

        {/* Sidebar Summary */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white shadow-2xl h-fit sticky top-32 transition-all">
              <div className="space-y-10">
                 <div>
                    <h3 className="text-2xl font-black tracking-tight mb-2 uppercase italic leading-none">Sẵn sàng <br/><span className="text-[#b20112]">Chinh phục</span></h3>
                    <p className="text-white/40 text-xs font-medium tracking-widest uppercase">Kiểm tra thông tin bộ đề</p>
                 </div>

                 <div className="space-y-6">
                    <div className="flex justify-between items-end border-b border-white/10 pb-4">
                       <p className="text-white/30 text-[9px] font-black uppercase tracking-widest">Môn học</p>
                       <p className="text-sm font-black text-white text-right">{subjects.find(s => s.id === config.subject)?.name || 'Chưa chọn'}</p>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/10 pb-4">
                       <p className="text-white/30 text-[9px] font-black uppercase tracking-widest">Cấu hình</p>
                       <p className="text-sm font-black text-white">{config.quantity} câu • {config.level}</p>
                    </div>
                 </div>

                 <div className="pt-6">
                    <Link to="/student/practice/demo">
                       <button 
                        disabled={!config.subject}
                        className={`w-full py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 ${
                          config.subject 
                          ? 'bg-[#b20112] text-white shadow-2xl shadow-red-900/40 hover:bg-[#d62828] active:scale-95' 
                          : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                        }`}
                       >
                          Bắt đầu làm bài <span className="material-symbols-outlined text-xl">play_arrow</span>
                       </button>
                    </Link>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

export default function PracticeSetupPage() {
  return (
    <Suspense fallback={<div className="p-10 text-slate-400 font-black uppercase tracking-widest animate-pulse">Đang tải cấu hình...</div>}>
      <SetupContent />
    </Suspense>
  );
}
