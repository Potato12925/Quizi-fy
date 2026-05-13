export default function LogoutButton() {
  const handleLogout = async () => {
    // TODO: Integrate with Quizi-fy Auth API
    // await authApi.logout();
    
    // Clear all local storage / session storage just in case
    localStorage.clear();
    sessionStorage.clear();

    // Force a hard reload to the login page to clear all server-side cookies
    window.location.href = '/login';
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
