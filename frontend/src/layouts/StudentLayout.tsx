import { Outlet } from 'react-router-dom';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import LogoutButton from '@/components/auth/LogoutButton';

export default function StudentLayout() {
  // TODO: Fetch profile from Auth Context or API
  const profile = {
    role: 'student',
    full_name: 'Học sinh',
    username: 'student',
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] flex">
      <DashboardSidebar role="student" />

      <div className="flex-1 ml-72 flex flex-col min-h-screen overflow-x-hidden">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-10 sticky top-0 z-40 bg-[#f9f9f9]/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
             <div className="px-3 py-1 bg-red-50 rounded-lg">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#b20112]">Personal Learning Workspace</p>
             </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-[#b20112] transition-colors cursor-pointer border border-slate-100 shadow-sm">
               <span className="material-symbols-outlined text-lg">notifications</span>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-900 leading-none mb-1">{profile.full_name}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{profile.username}</p>
              </div>
              <div className="group relative">
                 <div className="w-12 h-12 rounded-[1.25rem] bg-white border-2 border-slate-100 shadow-sm flex items-center justify-center overflow-hidden hover:border-[#b20112] transition-all cursor-pointer">
                   <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`} alt="avatar" />
                 </div>
                 {/* Simple Dropdown for Logout */}
                 <div className="absolute right-0 top-full pt-2 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300">
                    <div className="bg-white border border-slate-100 shadow-2xl rounded-2xl p-2 w-48">
                       <LogoutButton />
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-10 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
