import React, { useState } from 'react';

import { getUsers } from '@/api/adminApi';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import EmptyState from '@/components/common/EmptyState';

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = React.useState('students');
  const [data, setData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    getUsers().then(setData).catch((e: any) => setError(e.message)).finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <EmptyState />;
  
  const { students = [], teachers = [] } = data || {};



  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-2">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Quản lý <br/><span className="text-[#b20112]">Người dùng</span></h1>
          <p className="text-slate-500 mt-4 font-medium italic">Quản lý định danh và phân quyền truy cập cho toàn hệ thống.</p>
        </div>
        <div className="flex gap-4">
           <button className="bg-[#b20112] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-900/20 hover:bg-[#d62828] transition-all flex items-center gap-3">
              <span className="material-symbols-outlined text-xl">person_add</span> Thêm người dùng
           </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-2 bg-slate-100 rounded-3xl w-fit gap-2">
         <button 
           onClick={() => setActiveTab('students')}
           className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'students' ? 'bg-white text-[#b20112] shadow-xl shadow-red-900/5' : 'text-slate-400 hover:text-slate-600'}`}
         >
            Học sinh (Sinh viên)
         </button>
         <button 
           onClick={() => setActiveTab('teachers')}
           className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'teachers' ? 'bg-white text-[#b20112] shadow-xl shadow-red-900/5' : 'text-slate-400 hover:text-slate-600'}`}
         >
            Giáo viên (Giảng viên)
         </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="border-b border-slate-50">
                     <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">{activeTab === 'students' ? 'Học sinh' : 'Giáo viên'}</th>
                     <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">{activeTab === 'students' ? 'Mã sinh viên / Lớp' : 'Email / Chuyên môn'}</th>
                     <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Trạng thái</th>
                     <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Thao tác</th>
                  </tr>
               </thead>
               <tbody>
                  {activeTab === 'students' ? (
                    students.map((s: any) => (
                      <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all group">
                         <td className="px-10 py-8 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                               <span className="material-symbols-outlined">person</span>
                            </div>
                            <p className="text-sm font-black text-slate-800 tracking-tight">{s.name}</p>
                         </td>
                         <td className="px-6 py-8">
                            <p className="text-xs font-black text-slate-600">{s.code}</p>
                            <p className="text-[9px] font-black text-[#b20112] uppercase tracking-widest">{s.class}</p>
                         </td>
                         <td className="px-6 py-8 text-center">
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                               s.status === 'Hoạt động' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-[#b20112]'
                            }`}>{s.status}</span>
                         </td>
                         <td className="px-10 py-8 text-right space-x-2">
                            <button className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all"><span className="material-symbols-outlined">edit</span></button>
                            <button className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-[#b20112] hover:text-white transition-all"><span className="material-symbols-outlined text-xl">move_up</span></button>
                            <button className="w-10 h-10 rounded-xl bg-slate-50 text-red-300 hover:bg-red-500 hover:text-white transition-all"><span className="material-symbols-outlined text-xl">lock</span></button>
                         </td>
                      </tr>
                    ))
                  ) : (
                    teachers.map((t: any) => (
                      <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all group">
                         <td className="px-10 py-8 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                               <span className="material-symbols-outlined">school</span>
                            </div>
                            <p className="text-sm font-black text-slate-800 tracking-tight">{t.name}</p>
                         </td>
                         <td className="px-6 py-8">
                            <p className="text-xs font-bold text-slate-600 mb-1">{t.email}</p>
                            <div className="flex flex-wrap gap-1">
                               {t.subjects.map((sub: any) => <span key={sub} className="text-[8px] font-black bg-slate-100 text-slate-400 px-2 py-0.5 rounded-md uppercase tracking-tighter">{sub}</span>)}
                            </div>
                         </td>
                         <td className="px-6 py-8 text-center">
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                               t.status === 'Hoạt động' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-[#b20112]'
                            }`}>{t.status}</span>
                         </td>
                         <td className="px-10 py-8 text-right space-x-2">
                            <button className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all"><span className="material-symbols-outlined">edit</span></button>
                            <button className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-[#b20112] hover:text-white transition-all"><span className="material-symbols-outlined text-xl">assignment_ind</span></button>
                            <button className="w-10 h-10 rounded-xl bg-slate-50 text-red-300 hover:bg-red-500 hover:text-white transition-all"><span className="material-symbols-outlined text-xl">lock</span></button>
                         </td>
                      </tr>
                    ))
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
