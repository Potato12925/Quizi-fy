import { Outlet } from 'react-router-dom';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import LogoutButton from '@/components/auth/LogoutButton';
import { useAuth } from '@/contexts/AuthContext';
import NotificationBell from '@/layouts/NotificationBell';

export default function StudentLayout() {
  const { user } = useAuth();
  // TODO: Fetch profile from Auth Context or API
  const profile = {
    role: 'Học sinh',
    full_name: user?.full_name,
    username: user?.username,
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] flex">
      <DashboardSidebar role="student" />

      <div className="flex flex-col flex-1 min-h-screen overflow-x-hidden ml-72">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-10 sticky top-0 z-40 bg-[#f9f9f9]/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
             <div className="px-3 py-1 rounded-lg bg-red-50">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#b20112]">Personal Learning Workspace</p>
             </div>
          </div>
          <div className="flex items-center gap-6">
            <NotificationBell />
            <div className="w-px h-8 bg-slate-200"></div>
            <div className="flex items-center gap-4">
              <div className="hidden text-right sm:block">
                <p className="mb-1 text-xs font-black leading-none text-slate-900">{profile.full_name}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{profile.username}</p>
              </div>
              <div className="relative group">
                 <div className="w-12 h-12 rounded-[1.25rem] bg-white border-2 border-slate-100 shadow-sm flex items-center justify-center overflow-hidden hover:border-[#b20112] transition-all cursor-pointer">
                   <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`} alt="avatar" />
                 </div>
                 {/* Simple Dropdown for Logout */}
                 <div className="absolute right-0 pt-2 transition-all duration-300 translate-y-2 opacity-0 pointer-events-none top-full group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto">
                    <div className="w-48 p-2 bg-white border shadow-2xl border-slate-100 rounded-2xl">
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
