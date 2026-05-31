import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import { getPostLoginPath } from '@/utils/authRouting';

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading, login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getPostLoginPath(user), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    try {
      const loggedInUser = await login({
        username: username.trim(),
        password,
      });

      navigate(getPostLoginPath(loggedInUser), { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-6 font-sans bg-slate-50">
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />

      <div className="w-full max-w-5xl grid md:grid-cols-2 bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-700">
        <div className="bg-[#b20112] p-12 text-white relative hidden md:flex flex-col justify-between overflow-hidden">
          <div className="absolute top-0 right-0 p-20 opacity-10">
            <span className="material-symbols-outlined text-[300px]">psychology</span>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="p-3 bg-white shadow-lg rounded-2xl shadow-black/20">
                <span className="material-symbols-outlined text-[#b20112] text-3xl">lightbulb</span>
              </div>

              <h2 className="text-3xl font-black tracking-tight">Quizi-fy</h2>
            </div>

            <div className="space-y-6">
              <h1 className="text-5xl font-black leading-tight tracking-tight uppercase">
                Trợ lý học tập <br />
                ứng dụng AI
              </h1>

              <p className="max-w-sm text-lg font-medium leading-relaxed text-white/80">
                Tự động hóa việc ôn tập với bộ câu hỏi được sinh ra bằng AI từ tài liệu học tập.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center p-10 md:p-16">
          <div className="w-full max-w-sm mx-auto">
            <div className="flex items-center gap-3 mb-10 md:hidden">
              <div className="bg-[#b20112] p-3 rounded-2xl shadow-lg shadow-red-900/20">
                <span className="text-3xl text-white material-symbols-outlined">lightbulb</span>
              </div>

              <h2 className="text-3xl font-black tracking-tight text-[#b20112]">Quizi-fy</h2>
            </div>

            <div className="mb-8 text-center md:text-left">
              <h2 className="mb-2 text-3xl font-black tracking-tight text-slate-900">
                Đăng nhập
              </h2>
              <p className="font-medium text-slate-500">
                Sử dụng tài khoản và mật khẩu được cấp.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-[#b20112] rounded-2xl border border-red-100 flex gap-3 text-sm font-semibold">
                <span className="text-lg material-symbols-outlined shrink-0">error</span>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="block mb-2 text-sm font-semibold text-slate-700"
                >
                  Tên đăng nhập
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  className="w-full h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-[#b20112]"
                  placeholder="Nhập tên đăng nhập"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block mb-2 text-sm font-semibold text-slate-700"
                >
                  Mật khẩu
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  className="w-full h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-[#b20112]"
                  placeholder="Nhập mật khẩu"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 rounded-2xl bg-[#b20112] hover:bg-[#98010f] text-white font-black transition-all disabled:opacity-60"
              >
                {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}