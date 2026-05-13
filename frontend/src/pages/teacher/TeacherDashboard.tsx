import React from 'react';
import { Link } from 'react-router-dom';

export default function TeacherDashboard() {
  const stats = [
    { label: 'Tổng số câu hỏi', value: '1,248', growth: '+12% tháng này', icon: 'quiz', color: 'text-[#b20112]', bg: 'bg-red-50' },
    { label: 'Tài liệu đã tải', value: '56', sub: 'Dung lượng: 245MB', icon: 'description', color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Lớp đang dạy', value: '04', sub: '320 Sinh viên', icon: 'groups', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Lượt làm bài của SV', value: '8,902', growth: '+8% tuần này', icon: 'task_alt', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  const recentQuizzes = [
    { title: 'Cơ sở dữ liệu - Chương 3', info: '20 câu hỏi • 2 phút trước', icon: 'auto_awesome', bg: 'bg-[#b20112]' },
    { title: 'Mạng máy tính - Lab 02', info: '15 câu hỏi • 1 giờ trước', icon: 'lan', bg: 'bg-slate-400' },
    { title: 'An toàn thông tin - Final', info: '50 câu hỏi • 3 giờ trước', icon: 'security', bg: 'bg-[#d62828]' },
  ];

  const materials = [
    { name: 'Giao-trinh-CSDL.pdf', date: '12/10/2023', status: 'Đã xử lý AI', statusColor: 'text-emerald-600 bg-emerald-50' },
    { name: 'De-cuong-MMT.docx', date: '14/10/2023', status: 'Đang chờ', statusColor: 'text-amber-600 bg-amber-50' },
    { name: 'Bai-tap-lon-ATTT.pdf', date: '15/10/2023', status: 'Đã xử lý AI', statusColor: 'text-emerald-600 bg-emerald-50' },
    { name: 'Tai-lieu-Java-Nang-cao.pdf', date: '15/10/2023', status: 'Đang chờ', statusColor: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Hero Section - Refined */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-2">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Chào buổi sáng, Thầy Minh</h1>
          <p className="text-slate-500 mt-2 font-medium">Hệ thống AI đã sẵn sàng xử lý các tài liệu mới nhất của thầy.</p>
        </div>
        <Link to="/teacher/ai-generator" className="w-full md:w-auto">
          <button className="w-full bg-[#b20112] text-white px-10 py-4 rounded-[1.5rem] font-black flex items-center justify-center gap-3 shadow-2xl shadow-red-900/20 hover:bg-[#d62828] hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-sm">
            <span className="material-symbols-outlined text-2xl" style={{fontVariationSettings: "'FILL' 1"}}>auto_awesome</span>
            Tạo câu hỏi bằng AI
          </button>
        </Link>
      </div>

      {/* Stats Cards - Bento Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, idx) => (
          <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
            <div className={`w-14 h-14 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <span className="material-symbols-outlined text-3xl">{s.icon}</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">{s.label}</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{s.value}</h3>
            {s.growth ? (
              <p className="text-[10px] font-black text-emerald-500 mt-3 flex items-center gap-1 uppercase tracking-tighter">
                <span className="material-symbols-outlined text-xs">trending_up</span> {s.growth}
              </p>
            ) : (
              <p className="text-[10px] font-black text-slate-300 mt-3 uppercase tracking-tighter">{s.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* Middle Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Quizzes */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Mới tạo</h3>
            <button className="text-[10px] font-black text-[#b20112] uppercase tracking-widest hover:underline decoration-2 underline-offset-4">Xem tất cả</button>
          </div>
          <div className="space-y-4">
            {recentQuizzes.map((q, idx) => (
              <div key={idx} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 hover:border-[#b20112] hover:shadow-lg transition-all cursor-pointer group">
                <div className={`w-14 h-14 ${q.bg} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-black/5 group-hover:rotate-6 transition-transform`}>
                  <span className="material-symbols-outlined text-2xl" style={{fontVariationSettings: q.icon === 'auto_awesome' ? "'FILL' 1" : ""}}>{q.icon}</span>
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900 leading-tight mb-1">{q.title}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{q.info}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Materials Table */}
        <div className="lg:col-span-8 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Tài liệu tải lên</h3>
            <div className="flex gap-3">
               <button className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-[#b20112] transition-colors"><span className="material-symbols-outlined text-xl">filter_list</span></button>
               <button className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-[#b20112] transition-colors"><span className="material-symbols-outlined text-xl">cloud_upload</span></button>
            </div>
          </div>
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                  <th className="pb-6">Tên tài liệu</th>
                  <th className="pb-6">Ngày tải</th>
                  <th className="pb-6">Trạng thái</th>
                  <th className="pb-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50/50">
                {materials.map((m, idx) => (
                  <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-6">
                      <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-slate-300 group-hover:text-[#b20112] transition-colors">description</span>
                        <span className="font-bold text-slate-700">{m.name}</span>
                      </div>
                    </td>
                    <td className="py-6 text-slate-400 text-[11px] font-bold uppercase tracking-tighter">{m.date}</td>
                    <td className="py-6">
                      <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight ${m.statusColor}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="py-6 text-right">
                      <button className="p-2 rounded-xl text-slate-300 hover:text-slate-900 hover:bg-white transition-all">
                        <span className="material-symbols-outlined">more_horiz</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="w-full mt-8 py-4 text-[10px] font-black text-slate-400 hover:text-[#b20112] border-t border-slate-50 transition-all uppercase tracking-[0.3em]">
            Xem tất cả tài liệu
          </button>
        </div>
      </div>

      {/* AI Intelligence Banner */}
      <div className="bg-[#b20112] rounded-[3.5rem] p-12 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between shadow-2xl shadow-red-900/20 border border-white/10">
        <div className="absolute top-0 right-0 p-12 opacity-10">
           <span className="material-symbols-outlined text-[300px]" style={{fontVariationSettings: "'FILL' 1"}}>psychology</span>
        </div>
        <div className="relative z-10 space-y-6 max-w-2xl text-center lg:text-left">
          <span className="bg-white/20 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] backdrop-blur-md border border-white/20">AI Insights</span>
          <h2 className="text-4xl font-black text-white leading-[1.1] tracking-tighter">Tối ưu hoá nội dung giảng dạy</h2>
          <p className="text-white/70 font-medium leading-relaxed">
            Dựa trên kết quả làm bài của lớp 'Cấu trúc dữ liệu', AI nhận thấy sinh viên đang gặp khó khăn ở chương 'Cây nhị phân'. Bạn có muốn tạo thêm một bộ câu hỏi ôn tập chuyên sâu không?
          </p>
          <div className="flex flex-wrap gap-4 pt-4 justify-center lg:justify-start">
            <button className="bg-white text-[#b20112] px-10 py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-red-50 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest">Tạo ngay</button>
            <button className="text-white/60 font-black text-sm hover:text-white transition-colors uppercase tracking-widest">Bỏ qua</button>
          </div>
        </div>
        
        <div className="relative mt-12 lg:mt-0 w-80 h-56 bg-white/10 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/20 shadow-inner group">
           <div className="space-y-4">
              <div className="flex justify-between items-end">
                 <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Hiệu suất lớp</p>
                 <span className="text-white font-black text-2xl tracking-tighter">72%</span>
              </div>
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                 <div className="w-[72%] h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"></div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                 <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Dễ</p>
                    <p className="text-white font-black">45%</p>
                 </div>
                 <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Khó</p>
                    <p className="text-white font-black">28%</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
