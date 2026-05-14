import React, { useState, useEffect } from 'react';
import { getSubjects } from '@/api/adminApi';
import type { AdminSubject } from '@/api/adminApi';

import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import EmptyState from '@/components/common/EmptyState';

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<AdminSubject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getSubjects();
        setSubjects(data);
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

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-2">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Quản lý <br/><span className="text-[#b20112]">Môn học</span></h1>
          <p className="text-slate-500 mt-4 font-medium italic">Xây dựng danh mục đào tạo và phân công chuyên môn.</p>
        </div>
        <div className="flex gap-4">
           <button className="bg-[#b20112] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-900/20 hover:bg-[#d62828] transition-all flex items-center gap-3">
              <span className="material-symbols-outlined text-xl">library_add</span> Thêm môn học
           </button>
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {subjects.map((s) => (
           <div key={s.id} className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-red-900/5 transition-all group">
              <div className="flex justify-between items-start mb-8">
                 <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-[#b20112] transition-all">
                    <span className="material-symbols-outlined text-3xl">menu_book</span>
                 </div>
                 <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center">
                       <span className="material-symbols-outlined text-xl">edit</span>
                    </button>
                    <button className="w-10 h-10 rounded-xl bg-slate-50 text-red-300 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                       <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                 </div>
              </div>

              <div className="space-y-6">
                 <div>
                    <h4 className="text-xl font-black text-slate-800 tracking-tight leading-tight uppercase italic">{s.name}</h4>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">{s.code} • {s.credits} Tín chỉ</p>
                 </div>

                 <div className="p-6 bg-slate-50 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Giáo viên phụ trách</p>
                       <p className={`text-xs font-black ${s.teacher === 'Chưa gán' ? 'text-red-500' : 'text-slate-800'}`}>{s.teacher}</p>
                    </div>
                    <div className="flex justify-between items-center">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Số lớp đang học</p>
                       <p className="text-xs font-black text-slate-800">{s.classes} Lớp</p>
                    </div>
                 </div>

                 <div className="pt-2 flex gap-4">
                    <button className="flex-1 py-4 rounded-xl border border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-900 hover:text-white transition-all">Gán giáo viên</button>
                    <button className="flex-1 py-4 rounded-xl border border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:bg-[#b20112] hover:text-white transition-all">Gán vào lớp</button>
                 </div>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
}
