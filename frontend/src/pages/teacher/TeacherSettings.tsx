import React, { useState, useEffect } from 'react';
import { getTeacherSettings, updateTeacherSettings } from '@/api/teacherApi';
import type { TeacherSettings } from '@/api/teacherApi';

import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import EmptyState from '@/components/common/EmptyState';

export default function TeacherSettingsPage() {
  const [data, setData] = useState<TeacherSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const settings = await getTeacherSettings();
        setData(settings);
      } catch {
        setError('Không thể tải dữ liệu');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!data) return;

    if (!data.profile.name || data.profile.name.trim() === '') {
      alert('Tên không được để trống!');
      return;
    }

    if (data.profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.profile.email)) {
      alert('Email không đúng định dạng!');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateTeacherSettings(data);
      setData(updated);
      alert('Cài đặt đã được lưu!');
    } catch {
      alert('Lỗi khi lưu cài đặt');
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfileChange = (field: string, value: string) => {
    if (data) {
      setData({ ...data, profile: { ...data.profile, [field]: value } });
    }
  };

  const handleAIConfigChange = (field: string, value: any) => {
    if (data) {
      setData({ ...data, aiConfig: { ...data.aiConfig, [field]: value } });
    }
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <EmptyState />;

  return (
    <div className="max-w-4xl space-y-10 animate-in fade-in duration-700 pb-12">
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Cài đặt hệ thống</h1>
        <p className="text-slate-500 font-medium mt-1">Quản lý tài khoản và cấu hình trải nghiệm AI của bạn</p>
      </div>

      {/* Profile Section */}
      <section className="bg-white rounded-[2.5rem] p-10 border border-slate-50 shadow-sm space-y-8">
        <div className="flex items-center gap-8 pb-8 border-b border-slate-50">
           <div className="relative group">
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDp3ITMZPoicyVnF4zOlQHrtYgw4Fb4_jdZH3vVFmqZKgvSkE-TuPzSqtm0o0kxTgBRL9NjIuVxzM2xxI5x6sPHFn_FOD2T1pTKankSO4kvZoqYhsa1ngJyVIfeBuwymRN0W4Xk9SRkUpzjC6DXBo9RzV5iNFVnQGMIlIsqVmc9fbDwdDPweSJV1_-bpDunZTEczl_g2J-7uq7PsR_aZpFL665ks_IKAPEtljpVvsan7mthhlIEOFRUIuEr9BucsnwQ7QQGqmRqeZo" className="w-24 h-24 rounded-3xl object-cover shadow-xl border-4 border-white" alt="Avatar" />
              <button className="absolute -bottom-2 -right-2 bg-slate-900 text-white p-2 rounded-xl shadow-lg hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-sm">photo_camera</span>
              </button>
           </div>
           <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900">{data.profile.name}</h3>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-tight">Giảng viên {data.profile.department} • Học viện Công nghệ BCVT</p>
              <div className="flex gap-2 pt-2">
                 <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest">Tài khoản xác thực</span>
                 <span className="px-3 py-1 bg-red-50 text-[#b20112] rounded-lg text-[9px] font-black uppercase tracking-widest">Premium AI Plan</span>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Họ và tên</label>
              <input type="text" value={data.profile.name} onChange={(e) => handleProfileChange('name', e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-50 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-red-500/5 focus:border-[#b20112]/20 transition-all" />
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Học viện</label>
              <input type="email" value={data.profile.email} disabled className="w-full px-6 py-4 bg-slate-100 border border-slate-100 rounded-2xl text-sm font-bold text-slate-400 outline-none cursor-not-allowed" />
           </div>
        </div>
      </section>

      {/* AI Configuration Section */}
      <section className="bg-slate-900 rounded-[2.5rem] p-10 text-white space-y-8 relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
           <div>
              <h3 className="text-xl font-black tracking-tight">Cấu hình Quizify AI</h3>
              <p className="text-xs text-slate-400 font-medium mt-1">Tùy chỉnh mô hình ngôn ngữ và phong cách tạo câu hỏi</p>
           </div>
           <span className="material-symbols-outlined text-3xl text-red-500" style={{fontVariationSettings: "'FILL' 1"}}>auto_awesome</span>
        </div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mô hình mặc định</p>
              <div className="space-y-3">
                 {['Gemini 1.5 Pro (Khuyên dùng)', 'GPT-4o Integration', 'Claude 3.5 Sonnet'].map((model, idx) => (
                    <div key={idx} onClick={() => handleAIConfigChange('model', model)} className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${data.aiConfig.model === model || (data.aiConfig.model === 'Gemini 1.5 Pro' && idx === 0) ? 'bg-white/10 border-red-500/50' : 'bg-white/5 border-transparent hover:bg-white/10'}`}>
                       <span className="text-xs font-bold">{model}</span>
                       <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${data.aiConfig.model === model || (data.aiConfig.model === 'Gemini 1.5 Pro' && idx === 0) ? 'border-red-500' : 'border-white/20'}`}>
                          {(data.aiConfig.model === model || (data.aiConfig.model === 'Gemini 1.5 Pro' && idx === 0)) && <div className="w-2 h-2 bg-red-500 rounded-full"></div>}
                       </div>
                    </div>
                 ))}
              </div>
           </div>
           <div className="space-y-6">
              <div className="space-y-4">
                 <div className="flex justify-between items-end">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Độ sáng tạo (Temperature)</p>
                    <span className="text-xs font-black text-red-400">{data.aiConfig.temperature}</span>
                 </div>
                 <div className="h-1.5 w-full bg-white/10 rounded-full relative cursor-pointer">
                    <div className="absolute left-0 top-0 h-full bg-red-500 rounded-full" style={{ width: `${data.aiConfig.temperature * 100}%` }}></div>
                    <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-xl shadow-red-500/20" style={{ left: `${data.aiConfig.temperature * 100}%` }}></div>
                 </div>
              </div>
              <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5 space-y-3">
                 <div className="flex items-center justify-between" onClick={() => handleAIConfigChange('explainDetails', !data.aiConfig.explainDetails)}>
                    <span className="text-xs font-bold cursor-pointer">Giải thích chi tiết đáp án</span>
                    <div className={`w-10 h-5 rounded-full relative cursor-pointer ${data.aiConfig.explainDetails ? 'bg-red-500' : 'bg-white/10'}`}>
                       <div className={`absolute top-1 w-3 h-3 rounded-full ${data.aiConfig.explainDetails ? 'right-1 bg-white' : 'left-1 bg-white/40'}`}></div>
                    </div>
                 </div>
                 <div className="flex items-center justify-between" onClick={() => handleAIConfigChange('suggestTopics', !data.aiConfig.suggestTopics)}>
                    <span className="text-xs font-bold cursor-pointer">Gợi ý chủ đề liên quan</span>
                    <div className={`w-10 h-5 rounded-full relative cursor-pointer ${data.aiConfig.suggestTopics ? 'bg-red-500' : 'bg-white/10'}`}>
                       <div className={`absolute top-1 w-3 h-3 rounded-full ${data.aiConfig.suggestTopics ? 'right-1 bg-white' : 'left-1 bg-white/40'}`}></div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-red-500/10 rounded-full blur-[100px]"></div>
      </section>

      {/* Security Section */}
      <section className="bg-white rounded-[2.5rem] p-10 border border-slate-50 shadow-sm">
         <h3 className="text-xl font-black text-slate-900 mb-8">Bảo mật & Đăng nhập</h3>
         <div className="space-y-6">
            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-50 hover:border-red-500/20 transition-all cursor-pointer">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-400">
                    <span className="material-symbols-outlined">key</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Thay đổi mật khẩu</p>
                    <p className="text-[10px] text-slate-400 font-medium">Lần cuối thay đổi: 3 tháng trước</p>
                  </div>
               </div>
               <span className="material-symbols-outlined text-slate-300">chevron_right</span>
            </div>
            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-50 hover:border-red-500/20 transition-all cursor-pointer">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-400">
                    <span className="material-symbols-outlined">vibration</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Xác thực 2 yếu tố (2FA)</p>
                    <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">Chưa kích hoạt</p>
                  </div>
               </div>
               <span className="material-symbols-outlined text-slate-300">chevron_right</span>
            </div>
         </div>
      </section>

      <div className="flex justify-end gap-4">
         <button className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Hủy thay đổi</button>
         <button 
            disabled={isSaving}
            onClick={handleSave}
            className="px-10 py-4 bg-[#b20112] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-900/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {isSaving ? 'Đang lưu...' : 'Lưu cài đặt'}
         </button>
      </div>
    </div>
  );
}
