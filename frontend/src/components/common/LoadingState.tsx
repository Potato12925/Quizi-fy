import React from 'react';

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message = 'Đang tải dữ liệu...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-slate-500 animate-in fade-in duration-500">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-[#b20112] rounded-full animate-spin mb-4"></div>
      <p className="text-sm font-black uppercase tracking-widest">{message}</p>
    </div>
  );
}
