import React from 'react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({ 
  title = 'Đã xảy ra lỗi', 
  message = 'Không thể tải dữ liệu. Vui lòng thử lại sau.', 
  onRetry 
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center animate-in zoom-in-95 duration-300">
      <div className="w-16 h-16 bg-red-50 text-[#b20112] rounded-2xl flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-3xl">error</span>
      </div>
      <h3 className="text-lg font-black text-slate-900 mb-2 uppercase tracking-tight">{title}</h3>
      <p className="text-sm font-medium text-slate-500 max-w-sm mb-6">{message}</p>
      
      {onRetry && (
        <button 
          onClick={onRetry}
          className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          Thử lại
        </button>
      )}
    </div>
  );
}
