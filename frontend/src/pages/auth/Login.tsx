import React, { useState } from 'react';
/* import { createClient } from '@/utils/supabase/client' */;
import { useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  /* const supabase = createClient() */;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Transform username to lowercase internal email for strict matching
    const internalEmail = `${username.trim().toLowerCase()}@quizify.local`;

    const { data, error: authError } = ({} as any).auth.signInWithPassword({
      email: internalEmail,
      password: password,
    });

    if (authError) {
      // Show detailed error from Supabase to help debugging
      setError(authError.message === 'Invalid login credentials' 
        ? 'Tài khoản hoặc mật khẩu không chính xác.' 
        : `Lỗi: ${authError.message}`);
      setLoading(false);
      return;
    }

    // Fetch role from profiles
    const { data: profile, error: profileError } = ({} as any)
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      setError(`Lỗi Profile: ${profileError.message}`);
      setLoading(false);
      return;
    }

    if (profile) {
      navigate(`/${profile.role}/dashboard`);
      window.location.reload();
    } else {
      setError('Không tìm thấy thông tin quyền hạn trong hệ thống.');
      setLoading(false);
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
                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#b20112]">
                    <span className="material-symbols-outlined text-2xl" style={{fontVariationSettings: "'FILL' 1"}}>school</span>
                 </div>
                 <span className="text-2xl font-black tracking-tighter uppercase italic">Quizify<span className="text-white/50">AI</span></span>
              </div>
              <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-[0.9]">
                 Nâng tầm <br/> tri thức với <br/> <span className="text-white/50">Sức mạnh AI</span>
              </h1>
           </div>

           <div className="relative z-10 text-white/60">
              <p className="text-xs font-black uppercase tracking-[0.3em] mb-4">Trạng thái kết nối</p>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                 <span className="text-[10px] font-bold uppercase tracking-widest">Supabase Cloud Connected</span>
              </div>
           </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-12 md:p-20 space-y-10 flex flex-col justify-center">
           <div className="space-y-2">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Đăng nhập</h2>
              <p className="text-slate-400 font-medium text-sm">Sử dụng tài khoản Quizify nội bộ.</p>
           </div>

           <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-[#b20112] p-5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-100 flex items-start gap-3 animate-in slide-in-from-top-2">
                   <span className="material-symbols-outlined text-base mt-0.5">warning</span>
                   <div className="flex-1">{error}</div>
                </div>
              )}

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mã sinh viên / Username</label>
                 <div className="relative group">
                    <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#b20112] transition-colors">person</span>
                    <input 
                      type="text" 
                      required
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="admin_root hoặc B21DCCN001" 
                      className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:bg-white focus:border-[#b20112] transition-all font-bold text-slate-900" 
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mật khẩu</label>
                 <div className="relative group">
                    <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#b20112] transition-colors">lock</span>
                    <input 
                      type="password" 
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••" 
                      className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:bg-white focus:border-[#b20112] transition-all font-bold text-slate-900" 
                    />
                 </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-5 bg-[#b20112] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-red-900/30 hover:bg-[#d62828] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                 {loading ? 'Đang xác thực...' : 'Đăng nhập vào hệ thống'}
                 {!loading && <span className="material-symbols-outlined text-xl">login</span>}
              </button>
           </form>

           <div className="pt-6 text-center border-t border-slate-50">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
                 Quizify AI v1.0 • PTIT Academic Platform
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
