import { Outlet } from 'react-router-dom';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import LogoutButton from '@/components/auth/LogoutButton';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLayout() {
  const { user } = useAuth();
  
  const profile = {
    role: 'Quản trị viên',
    full_name: user?.full_name || 'Quản trị viên',
    username: user?.username || 'admin',
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] flex">
      <DashboardSidebar role="admin" />

      <div className="flex flex-col flex-1 min-h-screen overflow-x-hidden ml-72">
        {/* Admin Header */}
        <header className="h-20 flex items-center justify-between px-10 sticky top-0 z-40 bg-[#f9f9f9]/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
             <span className="material-symbols-outlined text-[#b20112] text-xl" style={{fontVariationSettings: "'FILL' 1"}}>security</span>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Administration Console</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-[#b20112] transition-colors cursor-pointer border border-slate-100 shadow-sm">
               <span className="text-lg material-symbols-outlined">notifications</span>
            </div>
            <div className="w-px h-8 bg-slate-200"></div>
            <div className="flex items-center gap-4">
              <div className="hidden text-right sm:block">
                <p className="mb-1 text-xs font-black leading-none text-slate-900">{profile.full_name}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter italic">Master Access</p>
              </div>
              <div className="relative group">
                 <div className="w-12 h-12 rounded-[1.25rem] bg-slate-900 text-white shadow-sm flex items-center justify-center font-black text-xs cursor-pointer hover:bg-slate-800 transition-all overflow-hidden border-2 border-slate-900">
                    <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${profile.username}`} alt="admin-avatar" />
                 </div>
                 <div className="absolute right-0 pt-2 transition-all duration-300 translate-y-2 opacity-0 pointer-events-none top-full group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto">
                    <div className="w-48 p-2 text-left bg-white border shadow-2xl border-slate-100 rounded-2xl">
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
