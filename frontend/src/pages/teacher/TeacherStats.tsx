import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getTeacherStats, type TeacherStatsData } from '@/api/teacherApi';
import {
  getTeacherAssignedSubjects,
  getTeacherTopicsBySubjectId,
  type TeacherAssignedSubject,
  type TeacherTopicItem,
} from '@/api/teacherAIGeneratorApi';

import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import EmptyState from '@/components/common/EmptyState';

const formatNumber = (value: number) => new Intl.NumberFormat('vi-VN').format(value);

const clampPercent = (value: number) => Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));

export default function TeacherStatsPage() {
  const [data, setData] = useState<TeacherStatsData | null>(null);
  const [subjects, setSubjects] = useState<TeacherAssignedSubject[]>([]);
  const [topics, setTopics] = useState<TeacherTopicItem[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const [isTopicDropdownOpen, setIsTopicDropdownOpen] = useState(false);

  const hasBootstrappedRef = useRef(false);

  const selectedSubject = useMemo(
    () => subjects.find((subject) => subject.subject_id === selectedSubjectId) || null,
    [subjects, selectedSubjectId],
  );

  const selectedTopic = useMemo(
    () => topics.find((topic) => topic.topic_id === selectedTopicId) || null,
    [topics, selectedTopicId],
  );

  const loadStats = async (
    subjectId: number | null,
    topicId: number | null,
    showBlockingLoader: boolean,
  ) => {
    if (showBlockingLoader) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const stats = await getTeacherStats({
        subjectId: subjectId ?? undefined,
        topicId: topicId ?? undefined,
      });
      setData(stats);
      setError('');
    } catch {
      setError('Không thể tải thống kê. Vui lòng thử lại.');
      if (!data) {
        setData(null);
      }
    } finally {
      if (showBlockingLoader) {
        setIsLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  };

  const loadTopicsBySubject = async (subjectId: number | null) => {
    if (!subjectId) {
      setTopics([]);
      return;
    }
    try {
      const topicItems = await getTeacherTopicsBySubjectId(subjectId);
      setTopics(topicItems);
    } catch {
      setTopics([]);
    }
  };

  const bootstrap = async () => {
    setIsLoading(true);
    setError('');
    try {
      const subjectItems = await getTeacherAssignedSubjects();
      setSubjects(subjectItems);
      await loadStats(null, null, true);
    } catch {
      setError('Không thể tải thống kê. Vui lòng thử lại.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    bootstrap();
  }, []);

  useEffect(() => {
    if (!hasBootstrappedRef.current) {
      hasBootstrappedRef.current = true;
      return;
    }
    loadStats(selectedSubjectId, selectedTopicId, false);
  }, [selectedSubjectId, selectedTopicId]);

  useEffect(() => {
    const handleOutsideClick = () => {
      setIsSubjectDropdownOpen(false);
      setIsTopicDropdownOpen(false);
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleSelectSubject = async (subjectId: number | null) => {
    setSelectedSubjectId(subjectId);
    setSelectedTopicId(null);
    setIsSubjectDropdownOpen(false);
    setIsTopicDropdownOpen(false);
    await loadTopicsBySubject(subjectId);
  };

  const handleSelectTopic = (topicId: number | null) => {
    setSelectedTopicId(topicId);
    setIsTopicDropdownOpen(false);
  };

  if (isLoading && !data) return <LoadingState message="Đang tải thống kê..." />;
  if (error && !data) return <ErrorState message={error} onRetry={bootstrap} />;
  if (!data) return <EmptyState />;

  const summary = data.summary;
  const weakTopics = data.weak_topics;
  const studentDistribution = data.student_distribution;

  const overviewStats = [
    {
      label: 'Điểm trung bình lớp',
      value: summary.average_score.toFixed(2),
      icon: 'auto_graph',
      color: 'text-[#b20112]',
      bg: 'bg-red-50',
    },
    {
      label: 'Tỉ lệ hoàn thành',
      value: `${summary.completion_rate_pct.toFixed(1)}%`,
      icon: 'checklist',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Số giờ tự học',
      value: `${formatNumber(summary.total_study_hours)}h`,
      icon: 'timer',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Bài tập đã làm',
      value: formatNumber(summary.total_answered_questions),
      icon: 'quiz',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  const totalStudents = studentDistribution.total_students;
  const activeRate = clampPercent(studentDistribution.active_rate_pct);
  const needsAttentionRate = totalStudents > 0
    ? clampPercent((studentDistribution.needs_attention_count / totalStudents) * 100)
    : 0;
  const circumference = 2 * Math.PI * 40;
  const activeArc = (activeRate / 100) * circumference;
  const needsAttentionArc = (needsAttentionRate / 100) * circumference;
  const needsAttentionOffset = -activeArc;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-2">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
            Phân tích <br />
            <span className="text-[#b20112]">Lớp học</span>
          </h1>
          <p className="text-slate-500 mt-4 font-medium italic">
            "Dữ liệu thông minh giúp nâng cao hiệu quả giảng dạy."
          </p>
        </div>

        <div className="bg-white p-2 rounded-2xl border border-slate-100 flex gap-2 relative flex-wrap">
          <div className="relative">
            <button
              onClick={(event) => {
                event.stopPropagation();
                setIsSubjectDropdownOpen(!isSubjectDropdownOpen);
                setIsTopicDropdownOpen(false);
              }}
              className="px-6 py-3 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 cursor-pointer hover:bg-slate-800 transition-all animate-in duration-200"
            >
              {selectedSubject ? selectedSubject.subject_name : 'Tất cả môn học'}
              <span className="material-symbols-outlined text-xs">keyboard_arrow_down</span>
            </button>

            {isSubjectDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    handleSelectSubject(null);
                  }}
                  className={`w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors cursor-pointer ${
                    selectedSubjectId === null ? 'text-[#b20112]' : 'text-slate-600'
                  }`}
                >
                  Tất cả môn học
                </button>
                {subjects.map((subject) => (
                  <button
                    key={subject.subject_id}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleSelectSubject(subject.subject_id);
                    }}
                    className={`w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors cursor-pointer ${
                      selectedSubjectId === subject.subject_id ? 'text-[#b20112]' : 'text-slate-600'
                    }`}
                  >
                    {subject.subject_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={(event) => {
                event.stopPropagation();
                if (!selectedSubjectId) return;
                setIsTopicDropdownOpen(!isTopicDropdownOpen);
                setIsSubjectDropdownOpen(false);
              }}
              className={`px-6 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all animate-in duration-200 ${
                selectedSubjectId
                  ? 'border-slate-100 text-slate-600 cursor-pointer hover:bg-slate-50'
                  : 'border-slate-50 text-slate-300 cursor-not-allowed'
              }`}
            >
              {selectedTopic ? selectedTopic.topic_name : 'Tất cả topic'}
              <span className="material-symbols-outlined text-xs">keyboard_arrow_down</span>
            </button>

            {isTopicDropdownOpen && selectedSubjectId && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    handleSelectTopic(null);
                  }}
                  className={`w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors cursor-pointer ${
                    selectedTopicId === null ? 'text-[#b20112]' : 'text-slate-600'
                  }`}
                >
                  Tất cả topic
                </button>
                {topics.map((topic) => (
                  <button
                    key={topic.topic_id}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleSelectTopic(topic.topic_id);
                    }}
                    className={`w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors cursor-pointer ${
                      selectedTopicId === topic.topic_id ? 'text-[#b20112]' : 'text-slate-600'
                    }`}
                  >
                    {topic.topic_name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isRefreshing && (
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đang cập nhật thống kê...</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {overviewStats.map((item) => (
          <div key={item.label} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center mb-6`}>
              <span className="material-symbols-outlined">{item.icon}</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
            <p className="text-3xl font-black text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 bg-white rounded-[3.5rem] p-12 border border-slate-100 shadow-sm space-y-10">
          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">
              Lỗ hổng kiến thức (Knowledge Gaps)
            </h3>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">
              Các topic có tỉ lệ trả lời sai cao nhất
            </p>
          </div>

          {!weakTopics.length ? (
            <div className="border-2 border-dashed border-slate-100 rounded-3xl p-10 text-center">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                Chưa có dữ liệu lỗ hổng theo bộ lọc hiện tại
              </p>
            </div>
          ) : (
            <div className="space-y-8 mt-10">
              {weakTopics.map((topic) => (
                <div key={topic.topic_id} className="space-y-4">
                  <div className="flex justify-between items-end">
                    <p className="text-sm font-black text-slate-800 tracking-tight">{topic.topic_name}</p>
                    <div className="text-right">
                      <span className="text-xs font-black text-[#b20112]">{topic.error_rate_pct.toFixed(1)}% lỗi</span>
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                        {formatNumber(topic.total_answers)} lượt trả lời
                      </p>
                    </div>
                  </div>
                  <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#b20112] transition-all duration-1000"
                      style={{ width: `${clampPercent(topic.error_rate_pct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 bg-slate-900 rounded-[3.5rem] p-12 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <span className="material-symbols-outlined text-[120px]">groups</span>
          </div>

          <div className="relative z-10 space-y-2">
            <h3 className="text-xl font-black uppercase italic tracking-tight mb-2">Phân loại sinh viên</h3>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Dựa trên điểm trung bình bài nộp</p>
          </div>

          <div className="flex justify-center items-center py-12 relative z-10">
            <div className="w-48 h-48 relative">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="white" strokeWidth="12" strokeOpacity="0.05" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="rgb(16 185 129)"
                  strokeWidth="12"
                  strokeDasharray={`${activeArc} ${circumference}`}
                  strokeLinecap="round"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#b20112"
                  strokeWidth="12"
                  strokeDasharray={`${needsAttentionArc} ${circumference}`}
                  strokeDashoffset={needsAttentionOffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-4xl font-black leading-none">{activeRate.toFixed(0)}%</p>
                <p className="text-[9px] font-black text-white/40 uppercase mt-1 tracking-widest">Active</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Xuất sắc (Top 20%)</span>
              </div>
              <span className="text-white/40">{formatNumber(studentDistribution.top_student_count)} SV</span>
            </div>
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#b20112]" />
                <span>Cần chú ý</span>
              </div>
              <span className="text-white/40">{formatNumber(studentDistribution.needs_attention_count)} SV</span>
            </div>
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-white/40">
              <span>Tổng sinh viên có dữ liệu</span>
              <span>{formatNumber(totalStudents)} SV</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


