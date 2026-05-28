import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminDashboardStats, type DashboardStats } from '@/api/adminApi';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAdminDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Không thể kết nối API thống kê.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingState message="Đang tải dữ liệu bảng điều khiển..." />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <ErrorState 
          title="Lỗi tải Dashboard" 
          message={error || 'Không có dữ liệu.'} 
          onRetry={fetchStats} 
        />
      </div>
    );
  }

  // Filter users based on search
  const filteredUsers = stats.users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.dept && user.dept.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const metricCards = [
    { label: 'Tổng số người dùng', value: stats.totalUsers.toLocaleString(), note: `${stats.activityGrowth} tháng này` },
    { label: 'Giáo viên', value: stats.teachersCount.toLocaleString(), note: 'Đang hoạt động' },
    { label: 'Học sinh', value: stats.studentsCount.toLocaleString(), note: 'Đã phân vào lớp' },
    { label: 'Câu hỏi duyệt', value: stats.approvedQuestions, note: 'Kho câu hỏi AI' },
  ];

  return (
    <div className="pb-20 space-y-10 duration-700 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col items-start justify-between gap-6 pt-2 lg:flex-row lg:items-end">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Administration Console</p>
          <h1 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter uppercase italic leading-[0.9]">
            Quản trị <br />
            <span className="text-[#b20112]">Admin</span>
          </h1>
          <p className="max-w-2xl mt-4 italic font-medium text-slate-500">
            Giao diện quản lý lớp học, học sinh, giáo viên và môn học kết nối API động của hệ thống.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => alert('Chức năng xuất báo cáo tổng kết sẽ được tích hợp với Backend.')}
            className="px-7 py-4 rounded-2xl bg-white border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm hover:text-[#b20112] hover:border-[#b20112] transition-all cursor-pointer"
          >
            Báo cáo tổng kết
          </button>
          <button 
            onClick={() => navigate('/admin/users')}
            className="px-7 py-4 rounded-2xl bg-[#b20112] text-white text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-red-900/20 hover:bg-[#d62828] transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className="text-xl material-symbols-outlined">person_add</span>
            Thêm tài khoản
          </button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card, index) => (
          <div
            key={card.label}
            className={`rounded-[2.5rem] p-7 border shadow-sm overflow-hidden relative ${
              index === 0 ? 'bg-white border-slate-100' : 
              index === 1 ? 'bg-[#b20112] text-white border-transparent shadow-red-900/20' : 
              index === 2 ? 'bg-slate-900 text-white border-transparent' : 
              'bg-white border-slate-100'
            }`}
          >
            <div className="relative z-10 flex items-start justify-between gap-4">
              <div>
                <p className={`text-[10px] font-black uppercase tracking-[0.25em] ${index === 1 || index === 2 ? 'text-white/60' : 'text-slate-400'}`}>
                  {card.label}
                </p>
                <h3 className={`mt-4 text-4xl font-black tracking-tighter ${index === 1 || index === 2 ? 'text-white' : 'text-slate-900'}`}>
                  {card.value}
                </h3>
              </div>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${index === 1 ? 'bg-white/15' : index === 2 ? 'bg-white/10' : 'bg-slate-50'}`}>
                <span className={`material-symbols-outlined text-3xl ${index === 1 || index === 2 ? 'text-white' : 'text-[#b20112]'}`}>
                  {index === 0 ? 'group' : index === 1 ? 'school' : index === 2 ? 'library_books' : 'verified'}
                </span>
              </div>
            </div>
            <p className={`mt-6 text-xs font-bold uppercase tracking-[0.2em] ${index === 1 || index === 2 ? 'text-white/55' : 'text-slate-400'}`}>
              {card.note}
            </p>
            {index === 0 && <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-[#b20112]/5 blur-3xl" />}
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.85fr] gap-6">
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex flex-col justify-between gap-4 p-8 border-b border-slate-50 md:flex-row md:items-center bg-slate-50/30">
            <div>
              <h2 className="text-xl font-black tracking-tight uppercase text-slate-900">Danh sách người dùng mới</h2>
              <p className="mt-1 text-sm text-slate-500">Quản lý và phê duyệt thông tin tài khoản giáo viên & sinh viên.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-full md:w-72">
                <span className="absolute text-sm -translate-y-1/2 material-symbols-outlined left-4 top-1/2 text-slate-400">search</span>
                <input
                  type="text"
                  placeholder="Tìm tên, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-3 pl-10 pr-4 text-xs font-bold transition-all bg-white border outline-none rounded-xl border-slate-100 focus:ring-2 focus:ring-red-100"
                />
              </div>
              <button 
                onClick={() => navigate('/admin/users')}
                className="px-4 py-3 rounded-xl bg-[#b20112] text-white text-[10px] font-black uppercase tracking-widest cursor-pointer"
              >
                Xem tất cả
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredUsers.length === 0 ? (
              <div className="p-8 italic font-medium text-center text-slate-400">Không tìm thấy người dùng phù hợp.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-50 bg-slate-50/50">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Người dùng</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Vai trò</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Lớp</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Trạng thái</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredUsers.map((user) => (
                    <tr key={user.email} className="transition-colors hover:bg-slate-50/40">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-[#b20112] flex items-center justify-center font-black text-sm ring-2 ring-white shadow-sm overflow-hidden">
                            {user.img ? (
                              <img src={user.img} alt={user.name} className="object-cover w-full h-full" />
                            ) : (
                              user.initial || user.name.substring(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900">{user.name}</p>
                            <p className="text-[11px] text-slate-400 font-semibold">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                          user.role.toUpperCase() === 'GIẢNG VIÊN' || user.role === 'teacher'
                            ? 'bg-red-50 text-[#b20112]' 
                            : 'bg-slate-50 text-slate-600'
                        }`}>
                          {user.role.toUpperCase() === 'GIẢNG VIÊN' || user.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}
                        </span>
                      </td>
                      <td className="px-6 py-6 text-xs font-bold text-slate-500">{user.dept || 'N/A'}</td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${user.status === 'Hoạt động' || user.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          <span className="text-[11px] font-black uppercase tracking-tight text-slate-700">
                            {user.status === 'Hoạt động' || user.status === 'active' ? 'Hoạt động' : 'Ngoại tuyến'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => navigate(`/admin/users?edit=${user.id}`)}
                            className="p-3 transition-all cursor-pointer rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white"
                          >
                            <span className="text-lg material-symbols-outlined">edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#b20112] text-white rounded-[3rem] p-8 shadow-2xl shadow-red-900/20 relative overflow-hidden">
            <div className="absolute -right-14 -bottom-8 opacity-15">
              <span className="material-symbols-outlined text-[180px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                notifications_active
              </span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60">Thông báo hệ thống</p>
            <h3 className="mt-4 text-3xl font-black leading-tight tracking-tighter">Chủ nhiệm lớp mới đã được gán</h3>
            <p className="mt-4 text-sm leading-relaxed text-white/75">
              Hệ thống hiện tại hiển thị dữ liệu trực quan dựa trên API của PTIT Quizify. Bạn có thể quản lý phân quyền và tạo mới thực thể tại đây.
            </p>
          </div>

          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Lớp nổi bật</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Tổng quan dữ liệu lớp</h3>
              </div>
              <span className="w-12 h-12 rounded-2xl bg-slate-50 text-[#b20112] flex items-center justify-center">
                <span className="material-symbols-outlined">class</span>
              </span>
            </div>
            <div className="space-y-4">
              {stats.classes.slice(0, 3).map((item) => (
                <div key={item.code} className="flex items-center justify-between px-5 py-4 rounded-2xl bg-slate-50">
                  <div>
                    <p className="text-sm font-black text-slate-800">{item.name}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">{item.students} học sinh</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-8 border-b border-slate-50 bg-slate-50/30">
            <div>
              <h2 className="text-xl font-black tracking-tight uppercase text-slate-900">Lớp học đang quản lý</h2>
              <p className="mt-1 text-sm text-slate-500">Thông tin lớp học, giáo viên chủ nhiệm và sĩ số.</p>
            </div>
            <button 
              onClick={() => navigate('/admin/classes')}
              className="text-[10px] font-black uppercase tracking-widest text-[#b20112] cursor-pointer"
            >
              Xem chi tiết
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Mã lớp</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Trạng thái</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Sĩ số</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stats.classes.map((item) => (
                  <tr key={item.code} className="transition-colors hover:bg-slate-50/40">
                    <td className="px-8 py-5">
                      <p className="text-sm font-black text-slate-900">{item.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.code}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        item.status === 'Hoạt động' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-[#b20112]'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm font-black text-center text-slate-900">{item.students}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-8 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Hành động nhanh</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Trung tâm điều khiển Admin</h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-500">
              Bạn có thể dễ dàng quản lý hệ thống dữ liệu QuizifyAI qua các trang chức năng. Nhấp chọn để truy cập nhanh:
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-8">
            {[
              { label: 'Quản lý Lớp học', path: '/admin/classes' },
              { label: 'Quản lý Môn học', path: '/admin/subjects' },
              { label: 'Quản lý Học sinh', path: '/admin/users' },
              { label: 'Quản lý Giáo viên', path: '/admin/users' }
            ].map((item) => (
              <div 
                key={item.label} 
                onClick={() => navigate(item.path)}
                className="rounded-3xl bg-slate-50 p-5 border border-slate-100 hover:border-[#b20112] hover:bg-red-50/10 transition-all cursor-pointer group"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 group-hover:text-[#b20112]">Chuyển trang</p>
                <p className="mt-3 text-sm font-black text-slate-900 leading-tight group-hover:text-[#b20112]">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[12%] right-[-10%] w-[520px] h-[520px] bg-[#b20112]/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-[8%] left-[-10%] w-[420px] h-[420px] bg-red-100/30 rounded-full blur-[120px]" />
      </div>
    </div>
  );
}
