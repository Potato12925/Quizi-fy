import React from 'react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ 
  title = 'Trống', 
  message = 'Chưa có dữ liệu nào để hiển thị.', 
  actionLabel, 
  onAction 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-16 text-center border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/50">
      <div className="w-20 h-20 bg-white text-slate-300 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-slate-100">
        <span className="material-symbols-outlined text-4xl">inbox</span>
      </div>
      <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">{title}</h3>
      <p className="text-sm font-medium text-slate-500 max-w-md mb-8">{message}</p>
      
      {onAction && actionLabel && (
        <button 
          onClick={onAction}
          className="px-8 py-3 bg-[#b20112] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-red-900/20 hover:bg-[#d62828] active:scale-95 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
