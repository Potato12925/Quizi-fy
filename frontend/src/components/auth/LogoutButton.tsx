import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function LogoutButton() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <button 
      onClick={handleLogout}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-[#b20112] transition-all text-[10px] font-black uppercase tracking-widest text-left"
    >
      <span className="material-symbols-outlined text-lg">logout</span>
      Đăng xuất
    </button>
  );
}
