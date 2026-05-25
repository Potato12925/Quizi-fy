import { Link, useLocation } from 'react-router-dom';

export default function DashboardSidebar({ role }: { role?: 'student' | 'teacher' | 'admin' }) {
  const { pathname } = useLocation();
  const isStudent = role === 'student' || pathname.includes('/student');
  const isTeacher = role === 'teacher' || pathname.includes('/teacher');
  const isAdmin = role === 'admin' || pathname.includes('/admin');

  const studentMenu = [
    { name: 'Tổng quan', icon: 'home', path: '/student/dashboard' },
    { name: 'Ôn luyện AI', icon: 'psychology', path: '/student/practice/setup' },
    { name: 'Tiến độ học tập', icon: 'analytics', path: '/student/progress' },
    { name: 'Lịch sử bài làm', icon: 'history', path: '/student/history' },
    { name: 'Cài đặt', icon: 'settings', path: '/student/settings' },
  ];

  const teacherMenu = [
    { name: 'Tổng quan', icon: 'dashboard', path: '/teacher/dashboard' },
    { name: 'Kho tài liệu', icon: 'folder_open', path: '/teacher/resources' },
    { name: 'Tạo câu hỏi AI', icon: 'auto_awesome', path: '/teacher/ai-generator' },
    { name: 'Ngân hàng câu hỏi', icon: 'database', path: '/teacher/question-bank' },
    { name: 'Thống kê lớp', icon: 'bar_chart', path: '/teacher/stats' },
  ];

  const adminMenu = [
    { name: 'Tổng quan', icon: 'admin_panel_settings', path: '/admin/dashboard' },
    { name: 'Quản lý Lớp học', icon: 'class', path: '/admin/classes' },
    { name: 'Quản lý Môn học', icon: 'menu_book', path: '/admin/subjects' },
    { name: 'Quản lý Tài khoản', icon: 'group', path: '/admin/users' },
  ];

  const currentMenu = isStudent ? studentMenu : isTeacher ? teacherMenu : isAdmin ? adminMenu : [];

  return (
    <aside className="w-80 h-screen bg-white border-r border-slate-100 flex flex-col fixed left-0 top-0 z-[100] shadow-2xl shadow-slate-900/5">
      <div className="p-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#b20112] rounded-xl flex items-center justify-center shadow-lg shadow-red-900/20">
            <span className="material-symbols-outlined text-white text-2xl">school</span>
          </div>
          <span className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Quizify<span className="text-[#b20112]">AI</span></span>
        </div>
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] ml-1">
          {isStudent ? 'Giao diện học sinh' : isTeacher ? 'Giao diện giáo viên' : 'Hệ thống quản trị'}
        </p>
      </div>

      <nav className="flex-1 px-6 space-y-2 mt-4">
        {currentMenu.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-5 px-6 py-5 rounded-[2rem] transition-all duration-300 group ${isActive
                  ? 'bg-[#b20112] text-white shadow-2xl shadow-red-900/30 -translate-x-2'
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <span className={`material-symbols-outlined text-2xl ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-[#b20112]'} transition-colors`}>
                {item.icon}
              </span>
              <span className="text-sm font-black uppercase tracking-widest italic">{item.name}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-8 mt-auto border-t border-slate-50">
        <button
          onClick={async () => {
            // TODO: Integrate with Quizi-fy Auth API
            // await authApi.logout();
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/login';
          }}
          className="flex items-center gap-4 px-6 py-4 rounded-2xl w-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all font-black text-[10px] uppercase tracking-widest text-left"
        >
          <span className="material-symbols-outlined">logout</span>
          Đăng xuất hệ thống
        </button>
      </div>
    </aside>
  );
}
