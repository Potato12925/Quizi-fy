import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getTeacherDashboardStats,
  uploadTeacherDashboardDocument,
  type TeacherDashboardData,
  type TeacherDashboardUploadSubject,
} from '@/api/teacherDashboardApi';
import { useAuth } from '@/contexts/AuthContext';

import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import EmptyState from '@/components/common/EmptyState';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];
const MAX_FILE_SIZE = 20 * 1024 * 1024;

type DashboardStatCard = {
  label: string;
  value: string;
  growth?: string;
  sub?: string;
  icon: string;
  color: string;
  bg: string;
};

const formatNumber = (value: number) => new Intl.NumberFormat('vi-VN').format(value);

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('vi-VN');
};

const toTimeAgo = (value?: string | null) => {
  if (!value) return 'vừa xong';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'vừa xong';
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
};

const statusUiByAiStatus = (
  status: string | null,
): { label: string; color: string } => {
  if (status === 'completed') return { label: 'Đã xử lý AI', color: 'text-emerald-600 bg-emerald-50' };
  if (status === 'processing') return { label: 'Đang xử lý', color: 'text-blue-600 bg-blue-50' };
  if (status === 'pending') return { label: 'Đang chờ', color: 'text-amber-600 bg-amber-50' };
  if (status === 'failed') return { label: 'Thất bại', color: 'text-red-600 bg-red-50' };
  if (status === 'cancelled') return { label: 'Đã hủy', color: 'text-slate-600 bg-slate-100' };
  return { label: 'Chưa tạo AI', color: 'text-slate-500 bg-slate-100' };
};

const cardFromRequestStatus = (status: string): { icon: string; bg: string } => {
  if (status === 'completed') return { icon: 'task_alt', bg: 'bg-emerald-500' };
  if (status === 'processing') return { icon: 'autorenew', bg: 'bg-blue-500' };
  if (status === 'failed') return { icon: 'error', bg: 'bg-[#b20112]' };
  if (status === 'cancelled') return { icon: 'cancel', bg: 'bg-slate-500' };
  return { icon: 'hourglass_top', bg: 'bg-amber-500' };
};

const clampPct = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const resolveInitialUploadSelection = (
  subjects: TeacherDashboardUploadSubject[],
): { subjectId: number | null; topicId: number | null } => {
  const firstSubject = subjects[0];
  if (!firstSubject) return { subjectId: null, topicId: null };
  const firstTopic = firstSubject.topics[0];
  return {
    subjectId: firstSubject.subject_id,
    topicId: firstTopic ? firstTopic.topic_id : null,
  };
};

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadFormData, setUploadFormData] = useState({
    title: '',
    subjectId: null as number | null,
    topicId: null as number | null,
    description: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDashboard = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    setError('');
    try {
      const result = await getTeacherDashboardStats(5);
      setData(result);
    } catch {
      setError('Không thể tải dữ liệu dashboard');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(true);
  }, []);

  const uploadSubjects = data?.upload_subjects || [];
  const selectedSubject = useMemo(
    () => uploadSubjects.find((subject) => subject.subject_id === uploadFormData.subjectId) || null,
    [uploadSubjects, uploadFormData.subjectId],
  );
  const currentTopics = selectedSubject?.topics || [];

  useEffect(() => {
    if (!isUploadModalOpen) return;
    if (!uploadSubjects.length) return;
    if (uploadFormData.subjectId && selectedSubject) {
      const stillHasTopic = currentTopics.some((topic) => topic.topic_id === uploadFormData.topicId);
      if (!stillHasTopic) {
        setUploadFormData((prev) => ({
          ...prev,
          topicId: currentTopics[0]?.topic_id ?? null,
        }));
      }
      return;
    }

    const initial = resolveInitialUploadSelection(uploadSubjects);
    setUploadFormData((prev) => ({
      ...prev,
      subjectId: initial.subjectId,
      topicId: initial.topicId,
    }));
  }, [isUploadModalOpen, uploadSubjects, uploadFormData.subjectId, uploadFormData.topicId, selectedSubject, currentTopics]);

  const statCards: DashboardStatCard[] = useMemo(() => {
    if (!data) return [];
    const { summary, ai_request_statuses, question_statuses } = data;
    return [
      {
        label: 'Tổng số câu hỏi',
        value: formatNumber(summary.total_questions),
        growth: `${data.insights.question_approval_rate_pct.toFixed(1)}% đã duyệt`,
        sub: `${formatNumber(question_statuses.draft)} nháp | ${formatNumber(question_statuses.approved)} đã duyệt`,
        icon: 'quiz',
        color: 'text-[#b20112]',
        bg: 'bg-red-50',
      },
      {
        label: 'Tài liệu đã tải',
        value: formatNumber(summary.total_documents),
        sub: `${formatNumber(summary.total_ai_requests)} AI requests`,
        icon: 'description',
        color: 'text-amber-600',
        bg: 'bg-amber-50',
      },
      {
        label: 'Chủ đề giảng dạy',
        value: formatNumber(summary.total_topics),
        sub: `${formatNumber(summary.total_assigned_subjects)} môn được phân công`,
        icon: 'topic',
        color: 'text-blue-600',
        bg: 'bg-blue-50',
      },
      {
        label: 'Tiến trình AI',
        value: formatNumber(summary.total_ai_requests),
        growth: `${data.insights.ai_completion_rate_pct.toFixed(1)}% completed`,
        sub: `${formatNumber(ai_request_statuses.pending + ai_request_statuses.processing)} đang chờ/xử lý`,
        icon: 'auto_awesome',
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
      },
    ];
  }, [data]);

  const recentAiCards = useMemo(() => {
    if (!data) return [];
    return data.recent_ai_requests.map((request) => {
      const iconUi = cardFromRequestStatus(request.status);
      return {
        title: request.document_title || `Yêu cầu #${request.request_id}`,
        info: `${request.num_questions} câu hỏi | ${toTimeAgo(request.created_at)}`,
        icon: iconUi.icon,
        bg: iconUi.bg,
      };
    });
  }, [data]);

  const recentMaterials = useMemo(() => {
    if (!data) return [];
    return data.recent_documents.map((doc) => {
      const statusUi = statusUiByAiStatus(doc.latest_ai_status);
      return {
        id: doc.document_id,
        name: doc.title,
        date: formatDate(doc.created_at),
        status: statusUi.label,
        statusColor: statusUi.color,
      };
    });
  }, [data]);

  const recentApprovedQuestions = useMemo(() => {
    if (!data) return [];
    return data.recent_approved_questions.slice(0, 3);
  }, [data]);

  const handleOpenUpload = () => {
    const initial = resolveInitialUploadSelection(uploadSubjects);
    setUploadFormData({
      title: '',
      subjectId: initial.subjectId,
      topicId: initial.topicId,
      description: '',
    });
    setSelectedFile(null);
    setFormError('');
    setIsUploadModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isTxtByExtension = file.name.toLowerCase().endsWith('.txt');
    if (!ALLOWED_TYPES.includes(file.type) && !isTxtByExtension) {
      setFormError('Chỉ hỗ trợ file PDF, DOCX, TXT');
      setSelectedFile(null);
      return;
    }

    if (file.size <= 0) {
      setFormError('File rỗng');
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFormError('Dung lượng tối đa 20MB');
      setSelectedFile(null);
      return;
    }

    setFormError('');
    setSelectedFile(file);
    if (!uploadFormData.title) {
      setUploadFormData((prev) => ({ ...prev, title: file.name }));
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setFormError('Vui lòng chọn file tài liệu');
      return;
    }
    if (!uploadFormData.title.trim()) {
      setFormError('Vui lòng nhập tên tài liệu');
      return;
    }
    if (!uploadFormData.topicId) {
      setFormError('Vui lòng chọn topic');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      await uploadTeacherDashboardDocument({
        title: uploadFormData.title.trim(),
        description: uploadFormData.description.trim() || undefined,
        topic_ids: [uploadFormData.topicId],
        file: selectedFile,
      });
      await fetchDashboard(false);
      setIsUploadModalOpen(false);
      setShowSuccess(true);
      window.setTimeout(() => setShowSuccess(false), 3000);
    } catch {
      setFormError('Không thể tải lên tài liệu. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={() => fetchDashboard(true)} />;
  if (!data) return <EmptyState />;

  const approvalPct = clampPct(data.insights.question_approval_rate_pct);
  const totalDifficultyQuestions = Math.max(
    1,
    data.question_difficulty.easy + data.question_difficulty.medium + data.question_difficulty.hard,
  );
  const easyPct = clampPct((data.question_difficulty.easy / totalDifficultyQuestions) * 100);
  const hardPct = clampPct((data.question_difficulty.hard / totalDifficultyQuestions) * 100);
  const topApproved = recentApprovedQuestions[0];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      {showSuccess && (
        <div className="fixed top-10 right-10 z-[200] animate-in slide-in-from-right-10 duration-500">
          <div className="bg-emerald-500 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-emerald-400/20">
            <span className="material-symbols-outlined text-2xl">check_circle</span>
            <div>
              <p className="text-xs font-black uppercase tracking-widest leading-none">Thành công!</p>
              <p className="text-[10px] font-medium opacity-90 mt-1">Tài liệu đã được tải lên và sẵn sàng xử lý.</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-2">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            Chào buổi sáng, {user?.full_name || user?.username || 'Giáo viên'}
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Hệ thống AI đã sẵn sàng xử lý các tài liệu và yêu cầu mới của thầy/cô.
          </p>
        </div>
        <Link to="/teacher/ai-generator" className="w-full md:w-auto">
          <button className="w-full bg-[#b20112] text-white px-10 py-4 rounded-[1.5rem] font-black flex items-center justify-center gap-3 shadow-2xl shadow-red-900/20 hover:bg-[#d62828] hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-sm">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_awesome
            </span>
            Tạo câu hỏi bằng AI
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((s, idx) => (
          <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
            <div className={`w-14 h-14 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <span className="material-symbols-outlined text-3xl">{s.icon}</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">{s.label}</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{s.value}</h3>
            {s.growth ? (
              <p className="text-[10px] font-black text-emerald-500 mt-3 flex items-center gap-1 uppercase tracking-tighter">
                <span className="material-symbols-outlined text-xs">trending_up</span> {s.growth}
              </p>
            ) : (
              <p className="text-[10px] font-black text-slate-300 mt-3 uppercase tracking-tighter">{s.sub}</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Mới tạo</h3>
            <button className="text-[10px] font-black text-[#b20112] uppercase tracking-widest hover:underline decoration-2 underline-offset-4">
              Xem tất cả
            </button>
          </div>

          <div className="space-y-4">
            {recentAiCards.length === 0 ? (
              <EmptyState title="Chưa có yêu cầu AI" message="Hãy tạo yêu cầu AI đầu tiên từ tài liệu của bạn." />
            ) : (
              recentAiCards.map((q, idx) => (
                <div key={idx} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 hover:border-[#b20112] hover:shadow-lg transition-all cursor-pointer group">
                  <div className={`w-14 h-14 ${q.bg} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-black/5 group-hover:rotate-6 transition-transform`}>
                    <span className="material-symbols-outlined text-2xl">{q.icon}</span>
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900 leading-tight mb-1">{q.title}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{q.info}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-3">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Phê duyệt gần đây</h4>
            {recentApprovedQuestions.length === 0 ? (
              <p className="text-xs font-bold text-slate-400">Chưa có câu hỏi được duyệt gần đây.</p>
            ) : (
              recentApprovedQuestions.map((item) => (
                <div key={item.question_id} className="border border-slate-100 rounded-xl p-3">
                  <p className="text-xs font-black text-slate-800 line-clamp-2">{item.content}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-wide">
                    {item.subject_name || 'N/A'} | {toTimeAgo(item.updated_at)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-8 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Tài liệu tải lên</h3>
            <div className="flex gap-3">
              <button className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-[#b20112] transition-colors">
                <span className="material-symbols-outlined text-xl">filter_list</span>
              </button>
              <button
                onClick={handleOpenUpload}
                className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-[#b20112] transition-colors"
              >
                <span className="material-symbols-outlined text-xl">cloud_upload</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto no-scrollbar flex-1">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                  <th className="pb-6">Tên tài liệu</th>
                  <th className="pb-6">Ngày tải</th>
                  <th className="pb-6">Trạng thái</th>
                  <th className="pb-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50/50">
                {recentMaterials.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8">
                      <EmptyState title="Chưa có tài liệu" message="Tài liệu mới của bạn sẽ hiển thị tại đây." />
                    </td>
                  </tr>
                ) : (
                  recentMaterials.map((m) => (
                    <tr key={m.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-6">
                        <div className="flex items-center gap-4">
                          <span className="material-symbols-outlined text-slate-300 group-hover:text-[#b20112] transition-colors">description</span>
                          <span className="font-bold text-slate-700">{m.name}</span>
                        </div>
                      </td>
                      <td className="py-6 text-slate-400 text-[11px] font-bold uppercase tracking-tighter">{m.date}</td>
                      <td className="py-6">
                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight ${m.statusColor}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="py-6 text-right">
                        <button className="p-2 rounded-xl text-slate-300 hover:text-slate-900 hover:bg-white transition-all">
                          <span className="material-symbols-outlined">more_horiz</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Link to="/teacher/resources" className="w-full mt-8 pt-8 border-t border-slate-50 text-center">
            <button className="text-[10px] font-black text-slate-400 hover:text-[#b20112] transition-all uppercase tracking-[0.3em]">
              Xem tất cả tài liệu
            </button>
          </Link>
        </div>
      </div>

      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isSubmitting && setIsUploadModalOpen(false)} />
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 sm:p-12">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
                    Upload <span className="text-[#b20112]">Nhanh</span>
                  </h2>
                  <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest">
                    Tải tài liệu mới lên kho lưu trữ trực tiếp từ Dashboard
                  </p>
                </div>
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  disabled={isSubmitting}
                  className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 transition-all"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-8">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all cursor-pointer ${
                    selectedFile ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100 hover:border-[#b20112] hover:bg-red-50/10'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.docx,.txt"
                  />
                  {selectedFile ? (
                    <div className="flex flex-col items-center">
                      <span className="material-symbols-outlined text-4xl text-emerald-500 mb-2">check_circle</span>
                      <p className="text-xs font-black text-emerald-700 truncate max-w-xs">{selectedFile.name}</p>
                      <p className="text-[10px] text-emerald-500 font-bold uppercase mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div>
                      <span className="material-symbols-outlined text-4xl text-slate-200 mb-2">cloud_upload</span>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Kéo thả hoặc click để chọn file</p>
                      <p className="text-[9px] text-slate-300 uppercase tracking-widest mt-2">Hỗ trợ PDF, DOCX, TXT (Max 20MB)</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tên tài liệu hiển thị</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Tài liệu môn Toán - Chương 1"
                    value={uploadFormData.title}
                    onChange={(e) => setUploadFormData((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full p-4 rounded-2xl bg-slate-50 border-none text-xs font-bold focus:ring-2 focus:ring-red-500/20"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Môn học</label>
                    <select
                      value={uploadFormData.subjectId ?? ''}
                      onChange={(e) => {
                        const nextSubjectId = Number(e.target.value);
                        const nextSubject = uploadSubjects.find((subject) => subject.subject_id === nextSubjectId) || null;
                        setUploadFormData((prev) => ({
                          ...prev,
                          subjectId: Number.isFinite(nextSubjectId) ? nextSubjectId : null,
                          topicId: nextSubject?.topics[0]?.topic_id ?? null,
                        }));
                      }}
                      className="w-full p-4 rounded-2xl bg-slate-50 border-none text-xs font-bold focus:ring-2 focus:ring-red-500/20 cursor-pointer"
                    >
                      {!uploadSubjects.length && <option value="">Không có môn học</option>}
                      {uploadSubjects.map((subject) => (
                        <option key={subject.subject_id} value={subject.subject_id}>
                          {subject.subject_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Chủ đề (Topic)</label>
                    <select
                      value={uploadFormData.topicId ?? ''}
                      onChange={(e) => setUploadFormData((prev) => ({ ...prev, topicId: Number(e.target.value) }))}
                      className="w-full p-4 rounded-2xl bg-slate-50 border-none text-xs font-bold focus:ring-2 focus:ring-red-500/20 cursor-pointer"
                    >
                      {!currentTopics.length && <option value="">Không có topic</option>}
                      {currentTopics.map((topic) => (
                        <option key={topic.topic_id} value={topic.topic_id}>
                          {topic.topic_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Mô tả (tùy chọn)</label>
                  <textarea
                    rows={3}
                    placeholder="Nhập mô tả ngắn cho tài liệu"
                    value={uploadFormData.description}
                    onChange={(e) => setUploadFormData((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full p-4 rounded-2xl bg-slate-50 border-none text-xs font-bold focus:ring-2 focus:ring-red-500/20 resize-none"
                  />
                </div>

                {formError && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                    <span className="material-symbols-outlined text-sm">error</span> {formError}
                  </div>
                )}

                <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    disabled={isSubmitting}
                    className="px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !uploadSubjects.length}
                    className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-black transition-all disabled:opacity-50 flex items-center gap-3"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="material-symbols-outlined animate-spin">sync</span> Đang tải...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">check_circle</span> Tải lên ngay
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#b20112] rounded-[3.5rem] p-12 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between shadow-2xl shadow-red-900/20 border border-white/10">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <span className="material-symbols-outlined text-[300px]" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
        </div>
        <div className="relative z-10 space-y-6 max-w-2xl text-center lg:text-left">
          <span className="bg-white/20 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] backdrop-blur-md border border-white/20">AI Insights</span>
          <h2 className="text-4xl font-black text-white leading-[1.1] tracking-tighter">Tối ưu hóa nội dung giảng dạy</h2>
          <p className="text-white/70 font-medium leading-relaxed">
            {topApproved
              ? `Câu hỏi được duyệt gần nhất thuộc môn ${topApproved.subject_name || 'N/A'} (${topApproved.topic_name || 'N/A'}). Bạn có thể tiếp tục tạo thêm bộ câu hỏi cùng bối cảnh này.`
              : 'Hãy tạo bộ câu hỏi AI mới từ tài liệu để hệ thống xây dựng thống kê và gợi ý chi tiết hơn cho lớp học.'}
          </p>
          <div className="flex flex-wrap gap-4 pt-4 justify-center lg:justify-start">
            <Link to="/teacher/ai-generator">
              <button className="bg-white text-[#b20112] px-10 py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-red-50 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest">
                Tạo ngay
              </button>
            </Link>
            <button className="text-white/60 font-black text-sm hover:text-white transition-colors uppercase tracking-widest">
              Để sau
            </button>
          </div>
        </div>

        <div className="relative mt-12 lg:mt-0 w-80 h-56 bg-white/10 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/20 shadow-inner group">
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Hiệu suất phê duyệt</p>
              <span className="text-white font-black text-2xl tracking-tighter">{approvalPct}%</span>
            </div>
            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]" style={{ width: `${approvalPct}%` }} />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Dễ</p>
                <p className="text-white font-black">{easyPct}%</p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Khó</p>
                <p className="text-white font-black">{hardPct}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
