import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  downloadClassSummaryExport,
  getClassSummaryReport,
  getDashboardReport,
  type ClassReportExportFormat,
  type ClassSummaryReportData,
  type DashboardReportData,
} from '@/api/reportsApi';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingState from '@/components/common/LoadingState';

type ExportFormat = ClassReportExportFormat;

const STATUS_LABEL_MAP: Record<string, string> = {
  active: 'Hoạt động',
  inactive: 'Ngưng hoạt động',
  draft: 'Nháp',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  pending: 'Đang chờ',
  processing: 'Đang xử lý',
  completed: 'Hoàn tất',
  failed: 'Thất bại',
  cancelled: 'Đã hủy',
  'hoat dong': 'Hoạt động',
  'tam khoa': 'Tạm khóa',
};

const ROLE_LABEL_MAP: Record<string, string> = {
  admin: 'Quản trị viên',
  teacher: 'Giáo viên',
  student: 'Học sinh',
};

const DIFFICULTY_LABEL_MAP: Record<string, string> = {
  easy: 'Dễ',
  medium: 'Trung bình',
  hard: 'Khó',
  recognition: 'Nhận biết',
  comprehension: 'Thông hiểu',
  application: 'Vận dụng',
  advanced: 'Vận dụng cao',
};

const SOURCE_LABEL_MAP: Record<string, string> = {
  ai: 'AI',
  manual: 'Thủ công',
};

const COLUMN_LABEL_MAP: Record<string, string> = {
  question_id: 'Mã câu hỏi',
  teacher_id: 'Mã giáo viên',
  teacher_name: 'Giáo viên',
  subject_id: 'Mã môn',
  subject_name: 'Môn học',
  topic_id: 'Mã chủ đề',
  topic_name: 'Chủ đề',
  document_id: 'Mã tài liệu',
  document_title: 'Tiêu đề tài liệu',
  request_id: 'Mã yêu cầu',
  num_questions: 'Số câu hỏi',
  generated_question_count: 'Số câu đã sinh',
  status: 'Trạng thái',
  difficulty: 'Độ khó',
  source: 'Nguồn',
  created_at: 'Ngày tạo',
  updated_at: 'Ngày cập nhật',
  content: 'Nội dung',
  title: 'Tiêu đề',
  role: 'Vai trò',
  approval_rate_pct: 'Tỷ lệ duyệt (%)',
  question_count: 'Số câu hỏi',
  document_count: 'Số tài liệu',
  ai_request_count: 'Số yêu cầu AI',
  issue_type: 'Loại lỗi',
  entity_type: 'Loại dữ liệu',
  entity_id: 'Mã dữ liệu',
  details: 'Chi tiết',
};

const toDisplayStatus = (value: string | null | undefined): string => {
  if (!value) return '-';
  const normalized = value.toLowerCase().trim();
  return STATUS_LABEL_MAP[normalized] || value;
};

const toDisplayRole = (value: string | null | undefined): string => {
  if (!value) return '-';
  const normalized = value.toLowerCase().trim();
  return ROLE_LABEL_MAP[normalized] || value;
};

const toDisplayDifficulty = (value: string | null | undefined): string => {
  if (!value) return '-';
  const normalized = value.toLowerCase().trim();
  return DIFFICULTY_LABEL_MAP[normalized] || value;
};

const toDisplaySource = (value: string | null | undefined): string => {
  if (!value) return '-';
  const normalized = value.toLowerCase().trim();
  return SOURCE_LABEL_MAP[normalized] || value;
};

const toDisplayColumnLabel = (column: string): string => {
  return COLUMN_LABEL_MAP[column] || column.replaceAll('_', ' ');
};

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState<DashboardReportData | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [reportDateFrom, setReportDateFrom] = useState('');
  const [reportDateTo, setReportDateTo] = useState('');
  const [classReportData, setClassReportData] = useState<ClassSummaryReportData | null>(null);
  const [isLoadingClassReport, setIsLoadingClassReport] = useState(false);
  const [classReportError, setClassReportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const fetchDashboard = async () => {
    setIsLoadingDashboard(true);
    setDashboardError(null);
    try {
      const data = await getDashboardReport();
      setDashboard(data);
      if (data.classes_overview.length > 0) {
        setSelectedClassId(data.classes_overview[0].id);
      }
    } catch (error: any) {
      setDashboardError(error?.message || 'Không thể tải bảng điều khiển');
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

    const fetchClassReport = async () => {
    if (!selectedClassId) return;
    setIsLoadingClassReport(true);
    setClassReportError(null);
    try {
      const result = await getClassSummaryReport({
        class_id: selectedClassId,
        date_from: reportDateFrom || undefined,
        date_to: reportDateTo || undefined,
      });
      setClassReportData(result);
    } catch (error: any) {
      setClassReportError(error?.message || 'Không thể tải báo cáo lớp');
    } finally {
      setIsLoadingClassReport(false);
    }
  };

  useEffect(() => {
    if (!isReportModalOpen) return;
    fetchClassReport();
  }, [isReportModalOpen, selectedClassId]);

  const handleOpenReports = () => {
    setIsReportModalOpen(true);
    setClassReportError(null);
  };

  const handleApplyFilters = () => {
    fetchClassReport();
  };

  const handleResetFilters = () => {
    setReportDateFrom('');
    setReportDateTo('');
  };

  const handleExport = async (format: ExportFormat) => {
    if (!selectedClassId) return;
    setIsExporting(true);
    try {
      await downloadClassSummaryExport(selectedClassId, format, {
        date_from: reportDateFrom || undefined,
        date_to: reportDateTo || undefined,
      });
    } catch (error: any) {
      alert(error?.message || 'Không thể xuất báo cáo');
    } finally {
      setIsExporting(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const users = dashboard?.recent_users || [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.role.toLowerCase().includes(q),
    );
  }, [dashboard?.recent_users, searchQuery]);

  const metricCards = useMemo(() => {
    const summary = dashboard?.summary;
    if (!summary) return [];
    return [
      {
        label: 'Giáo viên',
        value: summary.total_teachers.toLocaleString(),
        note: 'Theo quyền hiện tại',
        icon: 'school',
      },
      {
        label: 'Môn học',
        value: summary.total_subjects.toLocaleString(),
        note: 'Danh mục',
        icon: 'menu_book',
      },
      {
        label: 'Chủ đề',
        value: summary.total_topics.toLocaleString(),
        note: 'Độ phủ',
        icon: 'topic',
      },
      {
        label: 'Tài liệu',
        value: summary.total_documents.toLocaleString(),
        note: 'Đã tải lên',
        icon: 'description',
      },
      {
        label: 'Câu hỏi',
        value: summary.total_questions.toLocaleString(),
        note: 'Kho câu hỏi',
        icon: 'quiz',
      },
      {
        label: 'Yêu cầu AI',
        value: summary.total_ai_requests.toLocaleString(),
        note: 'Lượt sinh tự động',
        icon: 'smart_toy',
      },
      {
        label: 'Chờ duyệt',
        value: summary.pending_approvals.toLocaleString(),
        note: 'Cần xem xét',
        icon: 'pending_actions',
      },
    ];
  }, [dashboard?.summary]);

  if (isLoadingDashboard) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingState message="Đang tải bảng điều khiển..." />
      </div>
    );
  }

  if (dashboardError || !dashboard) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <ErrorState
          title="Lỗi tải bảng điều khiển"
          message={dashboardError || 'Không có dữ liệu để hiển thị'}
          onRetry={fetchDashboard}
        />
      </div>
    );
  }

  const renderOverviewContent = () => {
    const summary = dashboard.summary;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Giáo viên', value: summary.total_teachers },
            { label: 'Môn học', value: summary.total_subjects },
            { label: 'Chủ đề', value: summary.total_topics },
            { label: 'Tài liệu', value: summary.total_documents },
            { label: 'Câu hỏi', value: summary.total_questions },
            { label: 'Yêu cầu AI', value: summary.total_ai_requests },
            { label: 'Chờ duyệt', value: summary.pending_approvals },
          ].map((item) => (
            <div key={item.label} className="p-4 border rounded-2xl border-slate-100 bg-slate-50">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{item.value.toLocaleString()}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="p-4 border rounded-2xl border-slate-100">
            <h4 className="mb-3 text-sm font-black tracking-widest uppercase text-slate-500">Trạng thái câu hỏi</h4>
            <div className="space-y-2">
              {dashboard.questions.by_status.map((item) => (
                <div key={item.key} className="flex justify-between text-sm">
                  <span className="font-bold text-slate-600">{toDisplayStatus(item.label)}</span>
                  <span className="font-black text-slate-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 border rounded-2xl border-slate-100">
            <h4 className="mb-3 text-sm font-black tracking-widest uppercase text-slate-500">Độ khó câu hỏi</h4>
            <div className="space-y-2">
              {dashboard.questions.by_difficulty.map((item) => (
                <div key={item.key} className="flex justify-between text-sm">
                  <span className="font-bold text-slate-600">{toDisplayDifficulty(item.label)}</span>
                  <span className="font-black text-slate-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 border rounded-2xl border-slate-100">
            <h4 className="mb-3 text-sm font-black tracking-widest uppercase text-slate-500">Trạng thái yêu cầu AI</h4>
            <div className="space-y-2">
              {dashboard.ai_requests.by_status.map((item) => (
                <div key={item.key} className="flex justify-between text-sm">
                  <span className="font-bold text-slate-600">{toDisplayStatus(item.label)}</span>
                  <span className="font-black text-slate-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border rounded-2xl border-slate-100">
          <h4 className="mb-3 text-sm font-black tracking-widest uppercase text-slate-500">Hoạt động gần đây</h4>
          {dashboard.recent_activity.length === 0 ? (
            <p className="text-sm text-slate-400">Chưa có hoạt động gần đây.</p>
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-64">
              {dashboard.recent_activity.map((item: any, index: number) => (
                <div key={`${item.activity_type}-${item.activity_id}-${index}`} className="px-3 py-2 text-sm rounded-xl bg-slate-50">
                  <span className="font-black text-slate-700">
                    {item.activity_type === 'ai_request' ? 'Yêu cầu AI' : item.activity_type === 'question' ? 'Câu hỏi' : item.activity_type === 'document' ? 'Tài liệu' : item.activity_type}
                  </span>
                  <span className="text-slate-500"> - {item.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderReportTable = () => {
    if (isLoadingClassReport) {
      return <LoadingState message="Đang tải dữ liệu báo cáo lớp..." />;
    }
    if (classReportError) {
      return <ErrorState title="Lỗi tải báo cáo lớp" message={classReportError} onRetry={fetchClassReport} />;
    }
    if (!classReportData) {
      return <EmptyState title="Chưa có dữ liệu" message="Vui lòng chọn lớp để xem báo cáo." />;
    }
    return (
      <div className="space-y-6">
        <div className="p-4 border rounded-xl border-slate-100 bg-slate-50">
          <p className="text-sm font-black text-slate-900">{classReportData.class_info.class_name}</p>
          <p className="text-xs text-slate-500">
            Mã lớp: {classReportData.class_info.class_code} | GVCN: {classReportData.class_info.teacher_name}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Sĩ số: {classReportData.class_info.student_count} | Giáo viên: {classReportData.class_info.teacher_count} | Môn học: {classReportData.class_info.subject_count}
          </p>
        </div>

        <div className="overflow-auto border rounded-xl border-slate-100">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50">
              <tr>
                {['Mã HS', 'Học sinh', 'Lượt nộp', 'Điểm TB', 'Đúng', 'Sai', 'Lần nộp gần nhất'].map((column) => (
                  <th key={column} className="px-4 py-3 font-black tracking-widest uppercase text-slate-500">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(classReportData.learning_results.length === 0 ? [{ student_id: '-', student_name: 'Chưa có dữ liệu', attempt_count: '-', average_score: '-', total_correct: '-', total_wrong: '-', latest_submitted_at: '-' }] : classReportData.learning_results).map((row: any, index: number) => (
                <tr key={`row-${index}`} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-700">{row.student_id ?? '-'}</td>
                  <td className="px-4 py-3 text-slate-700">{row.student_name ?? 'Chưa có dữ liệu'}</td>
                  <td className="px-4 py-3 text-slate-700">{row.attempt_count ?? 0}</td>
                  <td className="px-4 py-3 text-slate-700">{row.average_score ?? 'Chưa có dữ liệu'}</td>
                  <td className="px-4 py-3 text-slate-700">{row.total_correct ?? 0}</td>
                  <td className="px-4 py-3 text-slate-700">{row.total_wrong ?? 0}</td>
                  <td className="px-4 py-3 text-slate-700">{row.latest_submitted_at ?? 'Chưa có dữ liệu'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="pb-20 space-y-10 duration-700 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col items-start justify-between gap-6 pt-2 lg:flex-row lg:items-end">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Bảng điều khiển quản trị</p>
          <h1 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter uppercase italic leading-[0.9]">
            Quản trị <br />
            <span className="text-[#b20112]">Tổng quan</span>
          </h1>
          <p className="max-w-2xl mt-4 italic font-medium text-slate-500">
            Dữ liệu hiển thị theo thời gian thực từ API báo cáo, có phân quyền và hỗ trợ xuất tệp.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleOpenReports}
            className="px-7 py-4 rounded-2xl bg-white border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm hover:text-[#b20112] hover:border-[#b20112] transition-all cursor-pointer"
          >
            Mở báo cáo
          </button>
          <button
            onClick={() => navigate('/admin/users')}
            className="px-7 py-4 rounded-2xl bg-[#b20112] text-white text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-red-900/20 hover:bg-[#d62828] transition-all flex items-center gap-2 cursor-pointer"
          >
            <span className="text-xl material-symbols-outlined">person_add</span>
            Thêm tài khoản
          </button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.slice(0, 4).map((card) => (
          <div key={card.label} className="rounded-[2.5rem] p-7 border shadow-sm overflow-hidden relative bg-white border-slate-100">
            <div className="relative z-10 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">{card.label}</p>
                <h3 className="mt-4 text-4xl font-black tracking-tighter text-slate-900">{card.value}</h3>
              </div>
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-50">
                <span className="material-symbols-outlined text-3xl text-[#b20112]">{card.icon}</span>
              </div>
            </div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{card.note}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {metricCards.slice(4).map((card) => (
          <div key={card.label} className="rounded-[2rem] p-5 border bg-slate-50 border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">{card.label}</p>
            <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-900">{card.value}</h3>
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{card.note}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.85fr] gap-6">
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex flex-col justify-between gap-4 p-8 border-b border-slate-50 md:flex-row md:items-center bg-slate-50/30">
            <div>
              <h2 className="text-xl font-black tracking-tight uppercase text-slate-900">Người dùng gần đây</h2>
              <p className="mt-1 text-sm text-slate-500">Danh sách người dùng gần đây từ hệ thống báo cáo.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-full md:w-72">
                <span className="absolute text-sm -translate-y-1/2 material-symbols-outlined left-4 top-1/2 text-slate-400">search</span>
                <input
                  type="text"
                  placeholder="Tìm theo tên hoặc vai trò..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-3 pl-10 pr-4 text-xs font-bold transition-all bg-white border outline-none rounded-xl border-slate-100 focus:ring-2 focus:ring-red-100"
                />
              </div>
              <button
                onClick={() => navigate('/admin/users')}
                className="px-4 py-3 rounded-xl bg-[#b20112] text-white text-[10px] font-black uppercase tracking-widest cursor-pointer"
              >
                Quản lý
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredUsers.length === 0 ? (
              <div className="p-8 italic font-medium text-center text-slate-400">Không tìm thấy người dùng phù hợp.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-50 bg-slate-50/50">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Người dùng</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Vai trò</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Trạng thái</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredUsers.map((user) => (
                    <tr key={`${user.id}-${user.email}`} className="transition-colors hover:bg-slate-50/40">
                      <td className="px-8 py-6">
                        <p className="text-sm font-black text-slate-900">{user.name}</p>
                        <p className="text-[11px] text-slate-400 font-semibold">{user.email}</p>
                      </td>
                      <td className="px-6 py-6 text-xs font-black uppercase text-slate-700">{toDisplayRole(user.role)}</td>
                      <td className="px-6 py-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${user.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                          {toDisplayStatus(user.status)}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button
                          onClick={() => navigate('/admin/users')}
                          className="p-3 transition-all cursor-pointer rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white"
                        >
                          <span className="text-lg material-symbols-outlined">edit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#b20112] text-white rounded-[3rem] p-8 shadow-2xl shadow-red-900/20 relative overflow-hidden">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60">Gợi ý hệ thống</p>
            <h3 className="mt-4 text-3xl font-black leading-tight tracking-tighter">Mô-đun báo cáo đã sẵn sàng</h3>
            <p className="mt-4 text-sm leading-relaxed text-white/75">
              Bạn có thể mở popup báo cáo để lọc, sắp xếp và xuất dữ liệu thống kê thực tế từ backend.
            </p>
          </div>

          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Tổng quan lớp học</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Danh sách lớp</h3>
              </div>
              <span className="w-12 h-12 rounded-2xl bg-slate-50 text-[#b20112] flex items-center justify-center">
                <span className="material-symbols-outlined">class</span>
              </span>
            </div>
            <div className="space-y-4">
              {dashboard.classes_overview.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between px-5 py-4 rounded-2xl bg-slate-50">
                  <div>
                    <p className="text-sm font-black text-slate-800">{item.name}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">{item.students} học sinh</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{toDisplayStatus(item.status)}</p>
                  </div>
                </div>
              ))}
              {dashboard.classes_overview.length === 0 && <p className="text-sm text-slate-400">Không có lớp học nào.</p>}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-8 border-b border-slate-50 bg-slate-50/30">
            <div>
              <h2 className="text-xl font-black tracking-tight uppercase text-slate-900">Lớp học đang quản lý</h2>
              <p className="mt-1 text-sm text-slate-500">Sĩ số và trạng thái lớp theo dữ liệu thời gian thực.</p>
            </div>
            <button
              onClick={() => navigate('/admin/classes')}
              className="text-[10px] font-black uppercase tracking-widest text-[#b20112] cursor-pointer"
            >
              Xem
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Lớp</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Trạng thái</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Sĩ số</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {dashboard.classes_overview.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-slate-50/40">
                    <td className="px-8 py-5">
                      <p className="text-sm font-black text-slate-900">{item.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.code}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${item.status.toLowerCase().includes('hoat') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-[#b20112]'}`}>
                        {toDisplayStatus(item.status)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm font-black text-center text-slate-900">{item.students}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-8 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Truy cập nhanh</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Điều hướng quản trị</h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-500">
              Chuyển nhanh đến các trang chức năng.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-8">
            {[
              { label: 'Quản lý lớp học', path: '/admin/classes' },
              { label: 'Quản lý môn học', path: '/admin/subjects' },
              { label: 'Quản lý học sinh', path: '/admin/users' },
              { label: 'Quản lý giáo viên', path: '/admin/users' },
            ].map((item) => (
              <div
                key={item.label}
                onClick={() => navigate(item.path)}
                className="rounded-3xl bg-slate-50 p-5 border border-slate-100 hover:border-[#b20112] hover:bg-red-50/10 transition-all cursor-pointer group"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 group-hover:text-[#b20112]">Mở trang</p>
                <p className="mt-3 text-sm font-black text-slate-900 leading-tight group-hover:text-[#b20112]">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {isReportModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-8">
          <div
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
            onClick={() => setIsReportModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-[1200px] max-h-[92vh] overflow-hidden rounded-[2rem] bg-white shadow-2xl border border-slate-100">
            <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Báo cáo</h2>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="transition-all w-11 h-11 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4 bg-white border-b border-slate-100">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <select
                  value={selectedClassId || ''}
                  onChange={(e) => setSelectedClassId(e.target.value ? Number(e.target.value) : null)}
                  className="px-3 py-2 text-xs font-bold bg-white border rounded-lg border-slate-200"
                >
                  <option value="">Chọn lớp học</option>
                  {dashboard.classes_overview.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code} - {item.name}
                    </option>
                  ))}
                </select>
                <input
                  type="datetime-local"
                  value={reportDateFrom}
                  onChange={(e) => setReportDateFrom(e.target.value)}
                  className="px-3 py-2 text-xs font-bold border rounded-lg border-slate-200"
                />
                <input
                  type="datetime-local"
                  value={reportDateTo}
                  onChange={(e) => setReportDateTo(e.target.value)}
                  className="px-3 py-2 text-xs font-bold border rounded-lg border-slate-200"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleApplyFilters}
                  className="px-4 py-2 rounded-lg bg-[#b20112] text-white text-[10px] font-black uppercase tracking-widest"
                >
                  Áp dụng bộ lọc
                </button>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest"
                >
                  Đặt lại
                </button>
                <button
                  onClick={() => handleExport('docx')}
                  disabled={isExporting || !selectedClassId}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                >
                  DOCX
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  disabled={isExporting || !selectedClassId}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                >
                  PDF
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[52vh] overflow-auto">
              {renderReportTable()}
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[12%] right-[-10%] w-[520px] h-[520px] bg-[#b20112]/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-[8%] left-[-10%] w-[420px] h-[420px] bg-red-100/30 rounded-full blur-[120px]" />
      </div>
    </div>
  );
}










