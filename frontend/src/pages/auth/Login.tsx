import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

type RoleType = 'teacher' | 'student';

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');

  const [selectedRoles, setSelectedRoles] = useState<RoleType[]>([]);

  React.useEffect(() => {
    if (isAuthenticated && user) {
      navigate(`/${user.role}/dashboard`, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const toggleRole = (role: RoleType) => {
    setSelectedRoles((prev) => {
      if (prev.includes(role)) {
        return prev.filter((r) => r !== role);
      }

      return [...prev, role];
    });
  };

  const handleGoogleAuth = async () => {
    setError('');

    try {
      // TODO:
      // Thay bằng Google OAuth thật của bạn
      // Ví dụ:
      // await loginWithGoogle({
      //    mode,
      //    roles: selectedRoles
      // });

      console.log('Mode:', mode);
      console.log('Selected Roles:', selectedRoles);

      // Fake navigate
      navigate('/student/dashboard');
    } catch (err: any) {
      setError(err.message || 'Google authentication thất bại.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />

      <div className="w-full max-w-5xl grid md:grid-cols-2 bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-700">

        {/* LEFT SIDE */}
        <div className="bg-[#b20112] p-12 text-white relative hidden md:flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 right-0 p-20 opacity-10">
            <span className="material-symbols-outlined text-[300px]">
              psychology
            </span>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="bg-white p-3 rounded-2xl shadow-lg shadow-black/20">
                <span className="material-symbols-outlined text-[#b20112] text-3xl">
                  lightbulb
                </span>
              </div>

              <h2 className="text-3xl font-black tracking-tight">
                Quizi-fy
              </h2>
            </div>

            <div className="space-y-6">
              <h1 className="text-5xl font-black tracking-tight leading-tight uppercase">
                Your AI <br />
                Study Partner
              </h1>

              <p className="text-white/80 text-lg font-medium leading-relaxed max-w-sm">
                Tự động hóa việc ôn thi với bộ câu hỏi được sinh ra bằng AI từ tài liệu học tập của PTIT.
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-12 pt-8 border-t border-white/20">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-4">
                <div className="w-10 h-10 rounded-full border-2 border-[#b20112] bg-white text-center leading-10 font-bold text-xs text-[#b20112]">
                  PTIT
                </div>

                <div className="w-10 h-10 rounded-full border-2 border-[#b20112] bg-slate-200 text-center leading-10 font-bold text-xs text-slate-600">
                  D21
                </div>

                <div className="w-10 h-10 rounded-full border-2 border-[#b20112] bg-slate-300 text-center leading-10 font-bold text-xs text-slate-700">
                  +
                </div>
              </div>

              <div className="text-sm font-medium">
                Tham gia cùng hàng nghìn sinh viên PTIT.
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="p-10 md:p-16 flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">

            {/* MOBILE LOGO */}
            <div className="flex md:hidden items-center gap-3 mb-10">
              <div className="bg-[#b20112] p-3 rounded-2xl shadow-lg shadow-red-900/20">
                <span className="material-symbols-outlined text-white text-3xl">
                  lightbulb
                </span>
              </div>

              <h2 className="text-3xl font-black tracking-tight text-[#b20112]">
                Quizi-fy
              </h2>
            </div>

            {/* TABS */}
            <div className="flex bg-slate-100 rounded-2xl p-1 mb-8">
              <button
                onClick={() => setMode('login')}
                className={`flex-1 py-3 rounded-2xl text-sm font-black transition-all ${
                  mode === 'login'
                    ? 'bg-[#b20112] text-white shadow-lg'
                    : 'text-slate-500'
                }`}
              >
                Đăng nhập
              </button>

              <button
                onClick={() => setMode('register')}
                className={`flex-1 py-3 rounded-2xl text-sm font-black transition-all ${
                  mode === 'register'
                    ? 'bg-[#b20112] text-white shadow-lg'
                    : 'text-slate-500'
                }`}
              >
                Đăng ký
              </button>
            </div>

            {/* TITLE */}
            <div className="mb-8 text-center md:text-left">
              <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-2">
                {mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
              </h2>

              <p className="text-slate-500 font-medium">
                {mode === 'login'
                  ? 'Tiếp tục bằng tài khoản Google'
                  : 'Tạo tài khoản mới bằng Google'}
              </p>
            </div>

            {/* ERROR */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-[#b20112] rounded-2xl border border-red-100 flex gap-3 text-sm font-semibold">
                <span className="material-symbols-outlined shrink-0 text-lg">
                  error
                </span>

                {error}
              </div>
            )}

            {/* REGISTER OPTIONS */}
            {mode === 'register' && (
              <div className="mb-8 bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4">

                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 mb-1">
                    Chọn vai trò
                  </h3>

                  <p className="text-sm text-slate-500">
                    Có thể chọn cả Giáo viên và Học sinh
                  </p>
                </div>

                {/* TEACHER */}
                <label className="flex items-center gap-3 cursor-pointer bg-white border border-slate-200 rounded-2xl px-4 py-4 hover:border-[#b20112] transition-all">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes('teacher')}
                    onChange={() => toggleRole('teacher')}
                    className="w-5 h-5 accent-[#b20112]"
                  />

                  <div>
                    <div className="font-bold text-slate-800">
                      Giáo viên
                    </div>

                    <div className="text-sm text-slate-500">
                      Tạo tài liệu và sinh câu hỏi AI
                    </div>
                  </div>
                </label>

                {/* STUDENT */}
                <label className="flex items-center gap-3 cursor-pointer bg-white border border-slate-200 rounded-2xl px-4 py-4 hover:border-[#b20112] transition-all">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes('student')}
                    onChange={() => toggleRole('student')}
                    className="w-5 h-5 accent-[#b20112]"
                  />

                  <div>
                    <div className="font-bold text-slate-800">
                      Học sinh
                    </div>

                    <div className="text-sm text-slate-500">
                      Ôn tập và luyện đề
                    </div>
                  </div>
                </label>
              </div>
            )}

            {/* GOOGLE BUTTON */}
            <button
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full h-16 rounded-2xl border-2 border-slate-200 bg-white hover:border-[#b20112] hover:shadow-xl transition-all flex items-center justify-center gap-4 font-black text-slate-700"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">
                    sync
                  </span>

                  Đang xử lý...
                </>
              ) : (
                <>
                  {/* GOOGLE ICON */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    className="w-7 h-7"
                  >
                    <path
                      fill="#FFC107"
                      d="M43.6 20.5H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"
                    />
                    <path
                      fill="#FF3D00"
                      d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
                    />
                    <path
                      fill="#4CAF50"
                      d="M24 44c5.2 0 10-2 13.5-5.2l-6.2-5.2C29.3 35 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.5 16.2 44 24 44z"
                    />
                    <path
                      fill="#1976D2"
                      d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.3 5.5-6 7l6.2 5.2C39.5 36.7 44 31 44 24c0-1.3-.1-2.3-.4-3.5z"
                    />
                  </svg>

                  {mode === 'login'
                    ? 'Tiếp tục với Google'
                    : 'Đăng ký bằng Google'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}