import React, { useState, useEffect } from 'react';
import { getTeacherStats } from '@/api/teacherApi';
import type { TeacherStatsData } from '@/api/teacherApi';

import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import EmptyState from '@/components/common/EmptyState';

export default function TeacherStatsPage() {
  const [data, setData] = useState<TeacherStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Dropdown selectors state
  const [selectedSemester, setSelectedSemester] = useState('Học kỳ 2 - 2024');
  const [selectedClass, setSelectedClass] = useState('Lớp D21CQCN01-B');
  const [isSemesterDropdownOpen, setIsSemesterDropdownOpen] = useState(false);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);

  const semesters = ['Học kỳ 2 - 2024', 'Học kỳ 1 - 2024', 'Học kỳ 2 - 2023'];
  const classes = ['Lớp D21CQCN01-B', 'Lớp D21CQCN02-A', 'Lớp D20CQCN03-B', 'Lớp D22CQCN01-A'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const stats = await getTeacherStats();
        setData(stats);
      } catch {
        setError('Không thể tải dữ liệu');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handleOutsideClick = () => {
      setIsSemesterDropdownOpen(false);
      setIsClassDropdownOpen(false);
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleClassChange = (cls: string) => {
    setSelectedClass(cls);
    setIsClassDropdownOpen(false);
    
    if (data) {
      const seed = cls.charCodeAt(cls.length - 1);
      const newClassStats = data.classStats.map(s => {
        if (s.label === 'Điểm trung bình lớp') {
          return { ...s, value: (7.2 + (seed % 10) * 0.2).toFixed(1) };
        }
        if (s.label === 'Tỉ lệ hoàn thành') {
          return { ...s, value: `${85 + (seed % 5) * 3}%` };
        }
        if (s.label === 'Số giờ tự học') {
          return { ...s, value: `${120 + (seed % 15) * 5}h` };
        }
        if (s.label === 'Bài tập đã làm') {
          return { ...s, value: (1000 + (seed % 8) * 75).toLocaleString() };
        }
        return s;
      });

      const newWeakTopics = [
        { name: 'Giao thức TCP/UDP', errorRate: 30 + (seed % 5) * 5, count: 80 + (seed % 10) * 5 },
        { name: 'Định tuyến IP', errorRate: 25 + (seed % 7) * 4, count: 70 + (seed % 8) * 5 },
        { name: 'Mô hình OSI', errorRate: 15 + (seed % 4) * 5, count: 180 + (seed % 12) * 5 },
        { name: 'Tầng vật lý', errorRate: 8 + (seed % 3) * 3, count: 150 + (seed % 6) * 5 },
      ];

      setData({
        classStats: newClassStats,
        weakTopics: newWeakTopics,
      });
    }
  };

  const handleSemesterChange = (sem: string) => {
    setSelectedSemester(sem);
    setIsSemesterDropdownOpen(false);
    
    if (data) {
      const seed = sem.charCodeAt(sem.length - 1);
      const newClassStats = data.classStats.map(s => {
        if (s.label === 'Điểm trung bình lớp') {
          return { ...s, value: (7.4 + (seed % 5) * 0.2).toFixed(1) };
        }
        if (s.label === 'Tỉ lệ hoàn thành') {
          return { ...s, value: `${88 + (seed % 4) * 2}%` };
        }
        return s;
      });

      setData(prev => prev ? { ...prev, classStats: newClassStats } : null);
    }
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <EmptyState />;

  const { classStats, weakTopics } = data;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-2">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Phân tích <br/><span className="text-[#b20112]">Lớp học</span></h1>
          <p className="text-slate-500 mt-4 font-medium italic">"Dữ liệu thông minh giúp nâng cao hiệu quả giảng dạy."</p>
        </div>
        <div className="bg-white p-2 rounded-2xl border border-slate-100 flex gap-2 relative">
          {/* Semester Selector */}
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsSemesterDropdownOpen(!isSemesterDropdownOpen);
                setIsClassDropdownOpen(false);
              }}
              className="px-6 py-3 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 cursor-pointer hover:bg-slate-800 transition-all animate-in duration-200"
            >
              {selectedSemester}
              <span className="material-symbols-outlined text-xs">keyboard_arrow_down</span>
            </button>
            
            {isSemesterDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                {semesters.map((sem) => (
                  <button
                    key={sem}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSemesterChange(sem);
                    }}
                    className={`w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors cursor-pointer ${
                      selectedSemester === sem ? 'text-[#b20112]' : 'text-slate-600'
                    }`}
                  >
                    {sem}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Class Selector */}
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsClassDropdownOpen(!isClassDropdownOpen);
                setIsSemesterDropdownOpen(false);
              }}
              className="px-6 py-3 rounded-xl border border-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 cursor-pointer hover:bg-slate-50 transition-all animate-in duration-200"
            >
              {selectedClass}
              <span className="material-symbols-outlined text-xs">keyboard_arrow_down</span>
            </button>
            
            {isClassDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                {classes.map((cls) => (
                  <button
                    key={cls}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClassChange(cls);
                    }}
                    className={`w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors cursor-pointer ${
                      selectedClass === cls ? 'text-[#b20112]' : 'text-slate-600'
                    }`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {classStats.map((s, idx) => (
          <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
             <div className={`w-12 h-12 rounded-2xl ${s.bg} ${s.color} flex items-center justify-center mb-6`}>
                <span className="material-symbols-outlined">{s.icon}</span>
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
             <p className="text-3xl font-black text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Knowledge Gaps Analysis */}
        <div className="lg:col-span-7 bg-white rounded-[3.5rem] p-12 border border-slate-100 shadow-sm space-y-10">
           <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">Lỗ hổng kiến thức (Knowledge Gaps)</h3>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">Các chủ đề có tỉ lệ trả lời sai cao nhất</p>
           </div>

           <div className="space-y-8 mt-10">
              {weakTopics.map((topic, idx) => (
                <div key={idx} className="space-y-4">
                   <div className="flex justify-between items-end">
                      <p className="text-sm font-black text-slate-800 tracking-tight">{topic.name}</p>
                      <div className="text-right">
                         <span className="text-xs font-black text-[#b20112]">{topic.errorRate}% Lỗi</span>
                         <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{topic.count} lượt trả lời</p>
                      </div>
                   </div>
                   <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden">
                      <div className="h-full bg-[#b20112] transition-all duration-1000" style={{ width: `${topic.errorRate}%` }}></div>
                   </div>
                </div>
              ))}
           </div>

           <div className="pt-8 border-t border-slate-50">
              <button className="text-[10px] font-black text-[#b20112] uppercase tracking-[0.2em] flex items-center gap-2 hover:underline">
                 Xem tất cả chủ đề <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
           </div>
        </div>

        {/* Activity Distribution */}
        <div className="lg:col-span-5 bg-slate-900 rounded-[3.5rem] p-12 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
           <div className="absolute top-0 right-0 p-12 opacity-10">
              <span className="material-symbols-outlined text-[120px]">groups</span>
           </div>
           
           <div className="relative z-10 space-y-2">
              <h3 className="text-xl font-black uppercase italic tracking-tight mb-2">Phân loại Sinh viên</h3>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Dựa trên hiệu suất ôn tập</p>
           </div>

           {/* Custom SVG Distribution Chart */}
           <div className="flex justify-center items-center py-12 relative z-10">
              <div className="w-48 h-48 relative">
                 <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="white" strokeWidth="12" strokeOpacity="0.05" />
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="emerald-500" strokeWidth="12" strokeDasharray="251" strokeDashoffset="50" />
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#b20112" strokeWidth="12" strokeDasharray="251" strokeDashoffset="210" />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-4xl font-black leading-none">82%</p>
                    <p className="text-[9px] font-black text-white/40 uppercase mt-1 tracking-widest">Active</p>
                 </div>
              </div>
           </div>

           <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest">
                 <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> <span>Xuất sắc (Top 20%)</span></div>
                 <span className="text-white/40">15 SV</span>
              </div>
              <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest">
                 <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-[#b20112]"></div> <span>Cần chú ý</span></div>
                 <span className="text-white/40">5 SV</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
