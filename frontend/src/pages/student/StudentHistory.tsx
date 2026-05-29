import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getStudentHistory, exportStudentHistoryPdf, startRetakeSession } from '@/api/studentApi';
import type { HistoryItem } from '@/api/studentApi';

import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import EmptyState from '@/components/common/EmptyState';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [allAttempts, setAllAttempts] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isRetaking, setIsRetaking] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, sortOrder]);

  const filteredAttempts = useMemo(() => {
    let result = [...allAttempts];
    if (searchQuery) {
      result = result.filter(a => a.subject.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    result.sort((a, b) => {
      if (sortBy === 'date') {
        const timeA = new Date(a.started_at).getTime();
        const timeB = new Date(b.started_at).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      } else {
        return sortOrder === 'desc' ? b.score - a.score : a.score - b.score;
      }
    });
    return result;
  }, [allAttempts, searchQuery, sortBy, sortOrder]);

  const chartData = useMemo(() => {
    const sortedByDate = [...allAttempts].sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
    const top10 = sortedByDate.slice(0, 10);
    return top10.reverse(); // oldest to newest in chart
  }, [allAttempts]);

  const totalPages = Math.max(1, Math.ceil(filteredAttempts.length / itemsPerPage));
  const paginatedAttempts = filteredAttempts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getPaginationButtons = () => {
    const buttons = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) buttons.push(i);
    } else {
      if (currentPage <= 3) {
        buttons.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        buttons.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        buttons.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return buttons;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const historyData = await getStudentHistory();
        setAllAttempts(historyData);
      } catch {
        setError('Không thể tải dữ liệu');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-2">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Lịch sử <span className="text-[#b20112]">ôn luyện</span></h1>
          <p className="text-slate-500 mt-2 font-medium">Theo dõi sự tiến bộ của bạn qua từng bài tập.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={async () => {
              setIsExporting(true);
              try {
                await exportStudentHistoryPdf();
              } finally {
                setIsExporting(false);
              }
            }}
            disabled={isExporting}
            className={`flex-1 md:flex-none px-8 py-4 rounded-2xl bg-white border border-slate-100 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${isExporting ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-[#b20112]'
              }`}
          >
            {isExporting ? 'Đang xuất...' : 'Tải báo cáo (PDF)'}
          </button>
        </div>
      </div>

      {/* Progress Chart Mockup */}
      <section className="bg-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20">
        <div className="absolute top-0 right-0 p-20 opacity-5">
          <span className="material-symbols-outlined text-[300px]">trending_up</span>
        </div>
        <div className="relative z-10 space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black uppercase tracking-tight">Xu hướng học tập</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#b20112]"></div>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Điểm số</span>
              </div>
            </div>
          </div>

          {/* Simple Bar Chart UI */}
          <div className="flex justify-center md:justify-start h-48 gap-3 md:gap-5">
            {chartData.length > 0 ? chartData.map((attempt, i) => {
              const rawScore = Number(attempt.score) || 0;
              const heightPercent = attempt.status === 'Đang làm' ? 5 : Math.max(rawScore * 10, 5);

              return (
                <div key={attempt.id} className="flex-1 flex flex-col items-center justify-end gap-3 group mt-6 h-full max-w-[64px]">
                  <div className="w-full bg-white/5 rounded-t-xl relative overflow-visible flex-1 flex items-end">
                    <div
                      className={`w-full bg-gradient-to-t rounded-t-xl transition-all duration-1000 group-hover:brightness-125 ${attempt.status === 'Đang làm' ? 'from-slate-400 to-slate-300' : 'from-[#b20112] to-[#ff4d4d]'
                        }`}
                      style={{ height: `${heightPercent}%` }}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white text-slate-900 px-2 py-1 rounded text-[9px] font-black shadow-sm whitespace-nowrap z-10 border border-slate-100">
                        {attempt.status === 'Đang làm' ? '...' : `${rawScore}`}
                      </div>
                    </div>
                  </div>
                  <span className="text-[8px] font-black opacity-30 uppercase tracking-tighter truncate max-w-full" title={attempt.subject}>Bài {i + 1}</span>
                </div>
              );
            }) : (
              <div className="w-full h-full flex items-center justify-center opacity-50 text-sm">Chưa có dữ liệu</div>
            )}
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="Tìm kiếm môn học..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-4 px-12 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-red-100 transition-all"
          />
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">search</span>
        </div>
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          <select
            className="bg-slate-50 border-none rounded-xl py-4 px-6 text-xs font-black uppercase tracking-widest text-slate-500 outline-none cursor-pointer"
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'date_desc') { setSortBy('date'); setSortOrder('desc'); }
              else if (val === 'date_asc') { setSortBy('date'); setSortOrder('asc'); }
              else if (val === 'score_desc') { setSortBy('score'); setSortOrder('desc'); }
              else if (val === 'score_asc') { setSortBy('score'); setSortOrder('asc'); }
            }}
          >
            <option value="date_desc">Mới nhất</option>
            <option value="date_asc">Cũ nhất</option>
            <option value="score_desc">Điểm cao nhất</option>
            <option value="score_asc">Điểm thấp nhất</option>
          </select>
          <button className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-center hover:bg-slate-800 transition-all">
            <span className="material-symbols-outlined text-xl">tune</span>
          </button>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-4">
        {paginatedAttempts.length === 0 ? (
          <EmptyState message="Không tìm thấy bài làm nào" />
        ) : paginatedAttempts.map((attempt) => (
          <div key={attempt.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:border-[#b20112]/30 transition-all group flex flex-col md:flex-row items-center gap-8">
            <div className="w-20 h-20 rounded-2xl bg-slate-50 flex flex-col items-center justify-center border border-slate-100 group-hover:bg-red-50 group-hover:border-red-100 transition-colors">
              <span className="text-2xl font-black text-slate-900 group-hover:text-[#b20112]">{attempt.score}</span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">/10</span>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h4 className="text-xl font-black text-slate-900 tracking-tight mb-1">{attempt.subject}</h4>
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">calendar_month</span> {attempt.date}
                </p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">timer</span> {attempt.time}
                </p>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${attempt.status === 'Xuất sắc' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                  attempt.status === 'Giỏi' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                  }`}>
                  {attempt.status}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Link to={`/student/results/${attempt.id}`}>
                <button className="px-6 py-3 rounded-xl bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-[#b20112] hover:text-white transition-all shadow-sm">
                  Xem lại
                </button>
              </Link>
              <button
                onClick={async () => {
                  setIsRetaking(true);
                  try {
                    const { practiceId } = await startRetakeSession(attempt.practice_set_id);
                    navigate(`/student/practice/${practiceId}`);
                  } catch (err) {
                    alert('Không thể bắt đầu lại!');
                  } finally {
                    setIsRetaking(false);
                  }
                }}
                disabled={isRetaking}
                className="px-6 py-3 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50"
              >
                Luyện lại
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center py-8">
          <div className="flex gap-2">
            {getPaginationButtons().map((p, i) => (
              <button
                key={i}
                onClick={() => typeof p === 'number' && setCurrentPage(p)}
                disabled={typeof p !== 'number'}
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-[10px] font-black transition-all border ${p === currentPage
                    ? 'bg-[#b20112] border-[#b20112] text-white shadow-lg shadow-red-900/20'
                    : typeof p === 'number'
                      ? 'bg-white border-slate-100 text-slate-400 hover:border-[#b20112] hover:text-[#b20112]'
                      : 'bg-transparent border-transparent text-slate-300'
                  }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
