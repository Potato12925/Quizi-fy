import React, { useState, useEffect } from 'react';
import { getAdminDashboardStats } from '@/api/adminApi';
import type { DashboardStats } from '@/api/adminApi';

import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import EmptyState from '@/components/common/EmptyState';

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const stats = await getAdminDashboardStats();
        setData(stats);
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
  if (!data) return <EmptyState />;

  const { users, classes } = data;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-2">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Quản trị hệ thống</h1>
          <p className="text-slate-500 mt-2 font-medium">Kiểm soát toàn diện người dùng, lớp học và tài nguyên AI.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
           <button className="flex-1 md:flex-none px-8 py-4 rounded-2xl bg-white border border-slate-100 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-[#b20112] hover:border-[#b20112] transition-all shadow-sm">
             Báo cáo tổng kết
           </button>
           <button className="flex-1 md:flex-none px-8 py-4 rounded-2xl bg-[#b20112] text-white text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-red-900/20 hover:bg-[#d62828] active:scale-95 transition-all flex items-center justify-center gap-2">
             <span className="material-symbols-outlined text-xl">person_add</span> Thêm người dùng
           </button>
        </div>
      </div>

      {/* Bento Stats Grid - Optimized */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white rounded-[3rem] p-10 flex flex-col justify-between shadow-sm border border-slate-50 relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8">Tổng số người dùng</h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-8">
              <div className="space-y-2">
                <span className="text-6xl font-black text-slate-900 tracking-tighter">{data.totalUsers.toLocaleString()}</span>
                <p className="text-[10px] text-emerald-500 font-black uppercase flex items-center gap-1">
                   <span className="material-symbols-outlined text-xs">trending_up</span> {data.activityGrowth} tháng này
                </p>
              </div>
              <div className="flex gap-4 w-full sm:w-auto">
                <div className="flex-1 bg-slate-50 px-6 py-4 rounded-[1.5rem] group-hover:bg-red-50 transition-colors">
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Giảng viên</p>
                  <p className="text-2xl font-black text-[#b20112]">{data.teachersCount}</p>
                </div>
                <div className="flex-1 bg-slate-50 px-6 py-4 rounded-[1.5rem] group-hover:bg-slate-100 transition-colors">
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Sinh viên</p>
                  <p className="text-2xl font-black text-slate-800">{data.studentsCount.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-[#b20112]/5 rounded-full blur-[100px] pointer-events-none"></div>
        </div>

        <div className="lg:col-span-3 bg-[#b20112] rounded-[3rem] p-10 flex flex-col justify-between text-white shadow-2xl shadow-red-900/20 group cursor-pointer relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 opacity-10 rotate-12 transition-transform group-hover:rotate-0 duration-700">
             <span className="material-symbols-outlined text-[180px]" style={{fontVariationSettings: "'FILL' 1"}}>quiz</span>
          </div>
          <div className="flex justify-between items-start relative z-10">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
              <span className="material-symbols-outlined text-3xl" style={{fontVariationSettings: "'FILL' 1"}}>quiz</span>
            </div>
            <span className="text-[10px] font-black bg-white/20 px-4 py-1.5 rounded-full uppercase tracking-widest border border-white/20">Kho câu hỏi</span>
          </div>
          <div className="relative z-10">
            <h3 className="text-5xl font-black tracking-tighter">{data.approvedQuestions}</h3>
            <p className="text-[11px] font-bold opacity-60 mt-2 uppercase tracking-[0.1em]">Đã được phê duyệt</p>
          </div>
        </div>

        <div className="lg:col-span-3 bg-slate-900 rounded-[3rem] p-10 flex flex-col justify-between text-white shadow-2xl group cursor-pointer relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 opacity-10 rotate-12 transition-transform group-hover:rotate-0 duration-700">
             <span className="material-symbols-outlined text-[180px]" style={{fontVariationSettings: "'FILL' 1"}}>bolt</span>
          </div>
          <div className="flex justify-between items-start relative z-10">
            <div className="w-14 h-14 bg-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/20">
              <span className="material-symbols-outlined text-3xl" style={{fontVariationSettings: "'FILL' 1"}}>trending_up</span>
            </div>
            <span className="text-[10px] font-black bg-red-500 px-4 py-1.5 rounded-full uppercase tracking-widest">Traffic</span>
          </div>
          <div className="relative z-10">
            <h3 className="text-5xl font-black tracking-tighter">{data.activityGrowth}</h3>
            <p className="text-[11px] font-bold opacity-50 mt-2 uppercase tracking-[0.1em]">Hoạt động hôm nay</p>
          </div>
        </div>
      </section>

      {/* User Management Section */}
      <section className="space-y-6">
        <div className="flex justify-between items-center px-4">
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Danh sách người dùng</h3>
          <div className="flex items-center gap-4">
             <div className="relative hidden md:block">
               <input type="text" placeholder="Tìm tên, email..." className="bg-white border border-slate-100 rounded-xl py-2 px-10 text-xs outline-none focus:ring-2 focus:ring-red-100 transition-all w-64" />
               <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-sm">search</span>
             </div>
             <button className="text-[10px] font-black text-[#b20112] uppercase tracking-widest hover:underline decoration-2 underline-offset-4">Xem tất cả</button>
          </div>
        </div>

        <div className="bg-white rounded-[3rem] overflow-hidden shadow-sm border border-slate-50">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Người dùng</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Vai trò</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Lớp / Khoa</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Trạng thái</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50/50">
                {users.map((user, idx) => (
                  <tr key={idx} className="group hover:bg-slate-50/30 transition-colors">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        {user.img ? (
                          <img src={user.img} className="w-12 h-12 rounded-2xl object-cover shadow-sm ring-2 ring-white" alt={user.name} />
                        ) : (
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm ring-2 ring-white ${user.initial === 'NH' ? 'bg-slate-100 text-slate-500' : 'bg-red-50 text-[#b20112]'}`}>
                            {user.initial}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-black text-slate-900">{user.name}</p>
                          <p className="text-[11px] text-slate-400 font-bold tracking-tight">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase ${user.role === 'GIẢNG VIÊN' ? 'bg-red-50 text-[#b20112]' : 'bg-slate-50 text-slate-600'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-xs font-bold text-slate-500">{user.dept}</td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full shadow-sm ${user.status === 'Hoạt động' ? 'bg-emerald-500 ring-4 ring-emerald-500/10' : 'bg-slate-300'}`}></div>
                        <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{user.status}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-3 rounded-xl bg-slate-50 hover:bg-[#b20112] hover:text-white transition-all duration-300"><span className="material-symbols-outlined text-lg">edit</span></button>
                        <button className="p-3 rounded-xl bg-slate-50 hover:bg-red-500 hover:text-white transition-all duration-300"><span className="material-symbols-outlined text-lg">delete</span></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-10 py-8 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-center bg-slate-50/20 gap-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Hiển thị 3 trong 3,650 người dùng</p>
            <div className="flex gap-3">
              <button className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 hover:bg-white hover:border-[#b20112] hover:text-[#b20112] transition-all disabled:opacity-30" disabled>
                <span className="material-symbols-outlined text-xl">chevron_left</span>
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 hover:bg-white hover:border-[#b20112] hover:text-[#b20112] transition-all">
                <span className="material-symbols-outlined text-xl">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAB Quick Action - Premium */}
      <button className="fixed bottom-10 right-10 w-16 h-16 bg-[#b20112] text-white rounded-[2rem] shadow-2xl shadow-red-900/40 flex items-center justify-center hover:scale-110 hover:rotate-12 active:scale-95 transition-all z-50 group">
        <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform" style={{fontVariationSettings: "'FILL' 1"}}>bolt</span>
      </button>

      {/* Background Decor - Refined */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[15%] right-[-10%] w-[600px] h-[600px] bg-[#b20112]/5 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-[5%] left-[-10%] w-[400px] h-[400px] bg-red-100/30 rounded-full blur-[120px]"></div>
      </div>
    </div>
  );
}
