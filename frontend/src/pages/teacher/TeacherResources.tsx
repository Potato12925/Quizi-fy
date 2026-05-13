import React from 'react';
import { Link } from 'react-router-dom';

export default function TeacherResourcesPage() {
  const resources = [
    { id: 1, name: 'Giao trinh Mang may tinh - Chuong 3.pdf', size: '2.4 MB', date: '20/04/2026', usage: 45, subject: 'Mạng máy tính' },
    { id: 2, name: 'Slide Bai giang Co so du lieu.pptx', size: '12.8 MB', date: '18/04/2026', usage: 12, subject: 'Cơ sở dữ liệu' },
    { id: 3, name: 'Tai lieu on tap He dieu hanh.docx', size: '1.1 MB', date: '15/04/2026', usage: 0, subject: 'Hệ điều hành' },
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-2">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Tài liệu <br/><span className="text-[#b20112]">Học tập</span></h1>
          <p className="text-slate-500 mt-4 font-medium italic">"Kho nguyên liệu để khởi tạo tri thức AI."</p>
        </div>
        <div className="flex gap-4">
           <button className="bg-[#b20112] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-900/20 hover:bg-[#d62828] transition-all flex items-center gap-3">
              <span className="material-symbols-outlined text-xl">upload_file</span> Tải tài liệu mới
           </button>
        </div>
      </div>

      {/* Resource Inventory */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Upload Dropzone Placeholder */}
        <div className="md:col-span-1 border-4 border-dashed border-slate-100 rounded-[3rem] p-10 flex flex-col items-center justify-center text-center space-y-6 hover:border-red-100 hover:bg-red-50/30 transition-all group cursor-pointer h-full min-h-[400px]">
           <div className="w-20 h-20 rounded-[2rem] bg-slate-50 text-slate-300 flex items-center justify-center group-hover:bg-[#b20112] group-hover:text-white transition-all shadow-sm">
              <span className="material-symbols-outlined text-4xl">add</span>
           </div>
           <div>
              <p className="text-sm font-black text-slate-800 uppercase italic tracking-tight">Kéo thả tài liệu</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Hỗ trợ PDF, DOCX, PPTX (Max 50MB)</p>
           </div>
        </div>

        {/* Resource Cards */}
        <div className="md:col-span-2 space-y-6">
           <div className="flex justify-between items-center px-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tài liệu đã tải lên ({resources.length})</h3>
              <button className="text-[10px] font-black text-[#b20112] uppercase tracking-[0.2em] hover:underline">Sắp xếp theo ngày</button>
           </div>
           
           <div className="space-y-4">
              {resources.map(res => (
                <div key={res.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-red-900/5 transition-all group">
                   <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                      <div className="flex items-center gap-6">
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${
                            res.name.endsWith('.pdf') ? 'bg-red-50 text-red-500' : 
                            res.name.endsWith('.pptx') ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'
                         }`}>
                            <span className="material-symbols-outlined">
                               {res.name.endsWith('.pdf') ? 'picture_as_pdf' : 
                                res.name.endsWith('.pptx') ? 'presentation_play' : 'description'}
                            </span>
                         </div>
                         <div>
                            <h4 className="text-base font-black text-slate-800 tracking-tight leading-none mb-2">{res.name}</h4>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                               {res.subject} • {res.size} • Tải lên: {res.date}
                            </p>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                         <div className="text-right px-6 border-r border-slate-100 hidden md:block">
                            <p className="text-sm font-black text-slate-900">{res.usage}</p>
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none">Câu hỏi AI</p>
                         </div>
                         <div className="flex gap-2">
                           <Link to="/teacher/ai-generator" className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-[#b20112] transition-all shadow-lg shadow-slate-900/20">
                              <span className="material-symbols-outlined text-xl">auto_awesome</span>
                           </Link>
                           <button className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-200 transition-all flex items-center justify-center">
                              <span className="material-symbols-outlined text-xl">more_vert</span>
                           </button>
                         </div>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
