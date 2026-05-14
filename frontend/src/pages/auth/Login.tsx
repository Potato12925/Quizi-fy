import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, isAuthenticated, user, isLoading } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated && user) {
      navigate(`/${user.role}/dashboard`, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Vui lòng nhập Mã sinh viên / Username.');
      return;
    }
    
    if (/\s/.test(username.trim())) {
      setError('Username không hợp lệ (không chứa khoảng trắng).');
      return;
    }

    if (!password.trim()) {
      setError('Vui lòng nhập mật khẩu.');
      return;
    }

    const internalEmail = `${username.trim().toLowerCase()}@quizify.local`;

    try {
      const loggedInUser = await login({ email: internalEmail, password });
      navigate(`/${loggedInUser.role}/dashboard`);
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      
      <div className="w-full max-w-5xl grid md:grid-cols-2 bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-700">
        
        {/* Left Side: Visual Branding */}
        <div className="bg-[#b20112] p-12 text-white relative hidden md:flex flex-col justify-between overflow-hidden">
           <div className="absolute top-0 right-0 p-20 opacity-10">
              <span className="material-symbols-outlined text-[300px]">psychology</span>
           </div>
           
           <div className="relative z-10">
              <div className="flex items-center gap-3 mb-10">
                 <div className="bg-white p-3 rounded-2xl shadow-lg shadow-black/20">
                    <span className="material-symbols-outlined text-[#b20112] text-3xl">lightbulb</span>
                 </div>
                 <h2 className="text-3xl font-black tracking-tight">Quizi-fy</h2>
              </div>
              
              <div className="space-y-6">
                 <h1 className="text-5xl font-black tracking-tight leading-tight uppercase">
                    Your AI <br/>Study Partner
                 </h1>
                 <p className="text-white/80 text-lg font-medium leading-relaxed max-w-sm">
                    Tự động hóa việc ôn thi với bộ câu hỏi được sinh ra bằng AI từ tài liệu học tập của PTIT.
                 </p>
              </div>
           </div>

           <div className="relative z-10 mt-12 pt-8 border-t border-white/20">
              <div className="flex items-center gap-4">
                 <div className="flex -space-x-4">
                    <div className="w-10 h-10 rounded-full border-2 border-[#b20112] bg-white text-center leading-10 font-bold text-xs text-[#b20112]">PTIT</div>
                    <div className="w-10 h-10 rounded-full border-2 border-[#b20112] bg-slate-200 text-center leading-10 font-bold text-xs text-slate-600">D21</div>
                    <div className="w-10 h-10 rounded-full border-2 border-[#b20112] bg-slate-300 text-center leading-10 font-bold text-xs text-slate-700">+</div>
                 </div>
                 <div className="text-sm font-medium">Tham gia cùng hàng nghìn sinh viên PTIT.</div>
              </div>
           </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-10 md:p-16 flex flex-col justify-center">
           <div className="max-w-sm mx-auto w-full">
              
              {/* Mobile Branding */}
              <div className="flex md:hidden items-center gap-3 mb-10">
                 <div className="bg-[#b20112] p-3 rounded-2xl shadow-lg shadow-red-900/20">
                    <span className="material-symbols-outlined text-white text-3xl">lightbulb</span>
                 </div>
                 <h2 className="text-3xl font-black tracking-tight text-[#b20112]">Quizi-fy</h2>
              </div>

              <div className="mb-10 text-center md:text-left">
                 <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-2">Đăng nhập</h2>
                 <p className="text-slate-500 font-medium">Sử dụng tài khoản Quản lý Đào tạo PTIT</p>
              </div>

              {error && (
                 <div className="mb-6 p-4 bg-red-50 text-[#b20112] rounded-2xl border border-red-100 flex gap-3 text-sm font-semibold">
                    <span className="material-symbols-outlined shrink-0 text-lg">error</span>
                    {error}
                 </div>
              )}

              <form onSubmit={handleLogin} className="space-y-6">
                 <div className="space-y-4">
                    <div className="group">
                       <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2 ml-1">Tài khoản</label>
                       <div className="relative">
                          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#b20112] transition-colors">
                             <span className="material-symbols-outlined">person</span>
                          </div>
                          <input 
                             type="text" 
                             value={username}
                             onChange={(e) => setUsername(e.target.value)}
                             placeholder="Mã sinh viên (VD: B21DCCNxxx)"
                             className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-medium focus:outline-none focus:border-[#b20112] focus:bg-white transition-all"
                          />
                       </div>
                    </div>

                    <div className="group">
                       <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2 ml-1">Mật khẩu</label>
                       <div className="relative">
                          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#b20112] transition-colors">
                             <span className="material-symbols-outlined">lock</span>
                          </div>
                          <input 
                             type="password" 
                             value={password}
                             onChange={(e) => setPassword(e.target.value)}
                             placeholder="Nhập mật khẩu"
                             className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-medium focus:outline-none focus:border-[#b20112] focus:bg-white transition-all"
                          />
                       </div>
                    </div>
                 </div>

                 <div className="pt-2">
                    <button 
                       type="submit" 
                       disabled={isLoading}
                       className="w-full py-5 bg-[#b20112] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-red-900/30 hover:-translate-y-1 hover:shadow-red-900/40 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 transition-all flex justify-center items-center gap-2"
                    >
                       {isLoading ? (
                          <>
                             <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                             Đang xử lý...
                          </>
                       ) : (
                          <>
                             Đăng nhập ngay
                             <span className="material-symbols-outlined text-lg ml-1" style={{fontVariationSettings: "'FILL' 1"}}>arrow_forward</span>
                          </>
                       )}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      </div>
    </div>
  );
}
