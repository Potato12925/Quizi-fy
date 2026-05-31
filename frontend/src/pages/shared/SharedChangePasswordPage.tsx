import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { changePasswordApi } from '@/api/authApi';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboardByRoles, getPrimaryRole } from '@/utils/authRouting';

type StatusMessage = { type: 'success' | 'error'; text: string } | null;

const ROLE_CONTENT: Record<string, { title: string; description: string }> = {
  admin: {
    title: 'Bao mat Tai khoan Quan tri',
    description: 'Cap nhat mat khau de bao ve he thong va du lieu quan tri.',
  },
  teacher: {
    title: 'Bao mat Tai khoan Giao vien',
    description: 'Doi mat khau de bao ve tai khoan giang day cua ban.',
  },
  student: {
    title: 'Bao mat Tai khoan Hoc sinh',
    description: 'Doi mat khau de bao ve tai khoan hoc tap cua ban.',
  },
};

export default function SharedChangePasswordPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessage>(null);

  const roleContent = useMemo(() => {
    const role = getPrimaryRole(user?.roles ?? ['student']);
    return ROLE_CONTENT[role];
  }, [user?.roles]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatusMessage(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setStatusMessage({ type: 'error', text: 'Vui long dien day du thong tin.' });
      return;
    }

    if (newPassword.length < 6) {
      setStatusMessage({ type: 'error', text: 'Mat khau moi phai co toi thieu 6 ky tu.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'Xac nhan mat khau moi khong khop.' });
      return;
    }

    if (oldPassword === newPassword) {
      setStatusMessage({ type: 'error', text: 'Mat khau moi khong duoc trung voi mat khau hien tai.' });
      return;
    }

    setIsLoading(true);

    try {
      await changePasswordApi({ oldPassword, newPassword });
      updateUser({ must_change_password: false });
      setStatusMessage({
        type: 'success',
        text: 'Doi mat khau thanh cong. Ban se duoc chuyen ve trang tong quan.',
      });

      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');

      if (user) {
        navigate(getDashboardByRoles(user.roles), { replace: true });
      }
    } catch (error: any) {
      setStatusMessage({
        type: 'error',
        text: error?.message || 'Co loi xay ra khi doi mat khau. Vui long thu lai.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-2">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
            Doi <span className="text-[var(--color-primary)]">Mat khau</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">{roleContent.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-[2.5rem] p-8 text-white shadow-xl shadow-red-950/20 relative overflow-hidden group">
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-1/4 translate-y-1/4 transition-transform duration-700 group-hover:scale-110">
              <span className="material-symbols-outlined text-[180px]">security</span>
            </div>

            <span className="material-symbols-outlined text-4xl mb-4 bg-white/20 p-3 rounded-2xl inline-block backdrop-blur-sm">
              lock_reset
            </span>
            <h3 className="text-xl font-black tracking-tight mb-2 uppercase italic text-white">{roleContent.title}</h3>
            <p className="text-red-100 text-sm font-medium leading-relaxed">
              Ban nen doi mat khau dinh ky de tang cuong an toan tai khoan. Khong chia se mat khau cho bat ky ai.
            </p>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-md">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-8 uppercase italic flex items-center gap-3">
              <span className="material-symbols-outlined text-[var(--color-primary)] text-2xl">key</span>
              Cap nhat mat khau
            </h2>

            {statusMessage && (
              <div
                className={`p-6 rounded-2xl mb-8 flex items-start gap-4 transition-all animate-in fade-in duration-300 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-100 text-emerald-800'
                    : 'bg-red-50 border border-red-100 text-[var(--color-primary)]'
                }`}
              >
                <span className="material-symbols-outlined shrink-0 mt-0.5">
                  {statusMessage.type === 'success' ? 'check_circle' : 'error'}
                </span>
                <p className="font-semibold text-sm leading-relaxed">{statusMessage.text}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">
                  Mat khau hien tai
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">lock</span>
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(event) => setOldPassword(event.target.value)}
                    placeholder="Nhap mat khau hien tai"
                    disabled={isLoading}
                    className="w-full pl-14 pr-14 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all font-semibold text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword((prev) => !prev)}
                    tabIndex={-1}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[var(--color-primary)] transition-colors"
                  >
                    <span className="material-symbols-outlined">{showOldPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">
                  Mat khau moi
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">vpn_key</span>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="Nhap mat khau moi (toi thieu 6 ky tu)"
                    disabled={isLoading}
                    className="w-full pl-14 pr-14 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all font-semibold text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    tabIndex={-1}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[var(--color-primary)] transition-colors"
                  >
                    <span className="material-symbols-outlined">{showNewPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">
                  Xac nhan mat khau moi
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">key_visualizer</span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Nhap lai mat khau moi"
                    disabled={isLoading}
                    className="w-full pl-14 pr-14 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all font-semibold text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    tabIndex={-1}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[var(--color-primary)] transition-colors"
                  >
                    <span className="material-symbols-outlined">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-4.5 rounded-[2rem] bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-black uppercase tracking-widest text-sm italic shadow-xl shadow-red-950/20 transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-3 ${
                    isLoading ? 'opacity-80 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Dang cap nhat...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">save</span>
                      <span>Luu mat khau moi</span>
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
