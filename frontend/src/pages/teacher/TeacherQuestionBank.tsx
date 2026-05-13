import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function QuestionBankPage() {
  const [activeSubject, setActiveSubject] = useState('1');

  const subjects = [
    { id: '1', name: 'Mạng máy tính', count: 156 },
    { id: '2', name: 'Cấu trúc dữ liệu', count: 84 },
    { id: '3', name: 'Hệ điều hành', count: 42 },
  ];

  const questions = [
    { id: 1, text: 'Giao thức HTTP hoạt động ở tầng nào của mô hình OSI?', type: 'Trắc nghiệm', level: 'Dễ', source: 'Giao trình MMT - Ch3', status: 'Đã duyệt' },
    { id: 2, text: 'Trình bày sự khác biệt giữa TCP và UDP?', type: 'Tự luận (AI chấm)', level: 'Khó', source: 'Slide bài giảng 2', status: 'Đã duyệt' },
    { id: 3, text: 'Độ dài tối đa của một khung hình Ethernet là bao nhiêu?', type: 'Trắc nghiệm', level: 'Trung bình', source: 'Tài liệu bổ trợ', status: 'Đã duyệt' },
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-2">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Ngân hàng <br/><span className="text-[#b20112]">Câu hỏi</span></h1>
          <p className="text-slate-500 mt-4 font-medium">Quản lý và tinh chỉnh hệ thống câu hỏi đã được phê duyệt.</p>
        </div>
        <div className="flex gap-4">
           <Link to="/teacher/ai-generator" className="bg-[#b20112] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-900/20 hover:bg-[#d62828] transition-all flex items-center gap-3">
              <span className="material-symbols-outlined text-xl">add_circle</span> Tạo thêm bằng AI
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Sidebar: Subject List */}
        <div className="lg:col-span-3 space-y-6">
           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Danh sách môn học</h3>
           <div className="space-y-2">
              {subjects.map(s => (
                <button 
                  key={s.id}
                  onClick={() => setActiveSubject(s.id)}
                  className={`w-full p-6 rounded-3xl border-2 transition-all text-left flex justify-between items-center group ${activeSubject === s.id ? 'border-[#b20112] bg-red-50/20 shadow-lg shadow-red-900/5' : 'border-slate-50 bg-white hover:border-slate-200'}`}
                >
                   <div>
                      <p className={`text-sm font-black transition-colors ${activeSubject === s.id ? 'text-[#b20112]' : 'text-slate-600'}`}>{s.name}</p>
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">{s.count} câu hỏi</p>
                   </div>
                   <span className={`material-symbols-outlined text-xl transition-all ${activeSubject === s.id ? 'text-[#b20112] translate-x-1' : 'text-slate-200 opacity-0 group-hover:opacity-100'}`}>chevron_right</span>
                </button>
              ))}
           </div>
        </div>

        {/* Main Content: Question List */}
        <div className="lg:col-span-9 space-y-8">
           {/* Filters & Actions */}
           <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-4">
                 <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input type="text" placeholder="Tìm kiếm nội dung..." className="pl-12 pr-6 py-3 rounded-xl bg-slate-50 border-none text-xs font-bold focus:ring-2 focus:ring-red-500/20 transition-all w-64" />
                 </div>
                 <select className="px-6 py-3 rounded-xl bg-slate-50 border-none text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer focus:ring-2 focus:ring-red-500/20">
                    <option>Tất cả mức độ</option>
                    <option>Dễ</option>
                    <option>Trung bình</option>
                    <option>Khó</option>
                 </select>
              </div>
              <button className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-[#b20112] transition-colors">
                 <span className="material-symbols-outlined text-xl">download</span> Xuất dữ liệu
              </button>
           </div>

           {/* Questions Table-like List */}
           <div className="space-y-4">
              {questions.map(q => (
                <div key={q.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-red-900/5 transition-all group">
                   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="space-y-4 flex-1">
                         <div className="flex flex-wrap gap-2">
                            <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">{q.type}</span>
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                               q.level === 'Khó' ? 'bg-red-50 text-[#b20112]' : 
                               q.level === 'Dễ' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                            }`}>{q.level}</span>
                            <span className="bg-slate-50 text-slate-400 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest italic">{q.source}</span>
                         </div>
                         <h4 className="text-lg font-black text-slate-800 tracking-tight leading-snug">{q.text}</h4>
                      </div>
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-[#b20112] hover:text-white transition-all flex items-center justify-center">
                            <span className="material-symbols-outlined text-xl">edit</span>
                         </button>
                         <button className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center">
                            <span className="material-symbols-outlined text-xl">visibility</span>
                         </button>
                         <button className="w-10 h-10 rounded-xl bg-slate-50 text-red-300 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                            <span className="material-symbols-outlined text-xl">delete</span>
                         </button>
                      </div>
                   </div>
                </div>
              ))}
           </div>

           <button className="w-full py-6 rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] hover:border-[#b20112] hover:text-[#b20112] transition-all">
              Tải thêm câu hỏi
           </button>
        </div>
      </div>
    </div>
  );
}
