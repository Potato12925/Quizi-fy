import React from 'react';

export default function StudentSettings() {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-2">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Cài đặt <span className="text-[#b20112]">Tài khoản</span></h1>
          <p className="text-slate-500 mt-2 font-medium">Tùy chỉnh thông tin và tùy chọn học tập của bạn.</p>
        </div>
      </div>

      <div className="bg-white rounded-[3.5rem] p-12 border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[400px] text-center">
        <span className="material-symbols-outlined text-[100px] text-slate-200 mb-6">engineering</span>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Tính năng đang phát triển</h2>
        <p className="text-slate-500 font-medium">Chúng tôi đang hoàn thiện trang cài đặt. Vui lòng quay lại sau nhé!</p>
      </div>
    </div>
  );
}
