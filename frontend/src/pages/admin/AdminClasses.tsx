import React, { useEffect, useMemo, useState } from 'react';
import {
  assignStudentToAdminClass,
  assignSubjectToAdminClass,
  createAdminClass,
  deleteAdminClass,
  getAdminClassDetail,
  getAdminClasses,
  getAdminClassStudents,
  getAdminClassSubjects,
  getAdminStudentOptions,
  getAdminSubjectOptions,
  getAdminTeacherOptions,
  removeStudentFromAdminClass,
  removeSubjectFromAdminClassByClassSubjectId,
  type AdminClassRecord,
  type AdminClassStudentRecord,
  type AdminClassSubjectRecord,
  type AdminClassTeacherOption,
  type AdminClassStudentOption,
  type AdminSubjectOption,
  type PaginationMeta,
  updateAdminClass,
} from '@/api/adminClassesApi';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingState from '@/components/common/LoadingState';

type DetailTab = 'subjects' | 'students';

const toStatusLabel = (status: 'active' | 'inactive') => (status === 'active' ? 'Hoạt động' : 'Tạm khóa');

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<AdminClassRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedClass, setSelectedClass] = useState<AdminClassRecord | null>(null);

  const [teacherOptions, setTeacherOptions] = useState<AdminClassTeacherOption[]>([]);
  const [studentOptions, setStudentOptions] = useState<AdminClassStudentOption[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<AdminSubjectOption[]>([]);

  const [classSubjects, setClassSubjects] = useState<AdminClassSubjectRecord[]>([]);
  const [classStudents, setClassStudents] = useState<AdminClassStudentRecord[]>([]);
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTab>('subjects');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'class_name' | 'student_count'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [teacherFilterId, setTeacherFilterId] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageLimit = 10;

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [classToEdit, setClassToEdit] = useState<AdminClassRecord | null>(null);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classForm, setClassForm] = useState({
    classCode: '',
    className: '',
    description: '',
    ownerId: '',
  });

  const [assignSubjectForm, setAssignSubjectForm] = useState({
    subjectId: '',
    teacherId: '',
  });
  const [selectedStudentToEnroll, setSelectedStudentToEnroll] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminClassRecord | null>(null);

  const fetchBootstrapData = async () => {
    const [teachers, students, subjects] = await Promise.all([
      getAdminTeacherOptions(),
      getAdminStudentOptions(),
      getAdminSubjectOptions(),
    ]);
    setTeacherOptions(teachers);
    setStudentOptions(students);
    setSubjectOptions(subjects);
  };

  const fetchClasses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAdminClasses({
        page: currentPage,
        limit: pageLimit,
        search: appliedSearch || undefined,
        status: statusFilter,
        sort_by: sortBy,
        sort_order: sortOrder,
        teacher_id: teacherFilterId === 'all' ? undefined : Number(teacherFilterId),
      });
      setClasses(result.items);
      setPagination(result.meta);
      if (result.items.length === 0) {
        setSelectedClassId(null);
        setSelectedClass(null);
        return;
      }
      if (!selectedClassId || !result.items.some((item) => item.class_id === selectedClassId)) {
        setSelectedClassId(result.items[0].class_id);
      }
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi tải danh sách lớp học.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSelectedClassDetail = async (classId: number) => {
    setIsDetailLoading(true);
    setDetailError(null);
    try {
      const [detail, subjects, students] = await Promise.all([
        getAdminClassDetail(classId),
        getAdminClassSubjects(classId),
        getAdminClassStudents(classId),
      ]);
      setSelectedClass(detail);
      setClassSubjects(subjects);
      setClassStudents(students);
    } catch (err: any) {
      setDetailError(err?.message || 'Không thể tải chi tiết lớp học.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await fetchBootstrapData();
      } catch {
        // Ignore bootstrap option errors here; list load will still show error if needed.
      }
    };
    bootstrap();
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [currentPage, statusFilter, sortBy, sortOrder, appliedSearch, teacherFilterId]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCurrentPage(1);
      setAppliedSearch(searchQuery.trim());
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    if (!selectedClassId) {
      setSelectedClass(null);
      setClassSubjects([]);
      setClassStudents([]);
      return;
    }
    fetchSelectedClassDetail(selectedClassId);
  }, [selectedClassId]);

  const openCreateModal = () => {
    setClassToEdit(null);
    setModalMode('create');
    setClassForm({
      classCode: '',
      className: '',
      description: '',
      ownerId: teacherOptions.length > 0 ? String(teacherOptions[0].user_id) : '',
    });
    setFormError('');
    setIsCreateModalOpen(true);
  };

  const openEditModal = (classItem: AdminClassRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    setClassToEdit(classItem);
    setModalMode('edit');
    setClassForm({
      classCode: classItem.class_code,
      className: classItem.class_name,
      description: classItem.description || '',
      ownerId: String(classItem.teacher_id),
    });
    setFormError('');
    setIsCreateModalOpen(true);
  };

  const handleSubmitClassForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!classForm.classCode.trim()) {
      setFormError('Mã lớp học không được để trống.');
      return;
    }
    if (!classForm.className.trim()) {
      setFormError('Tên lớp học không được để trống.');
      return;
    }
    if (!classForm.ownerId) {
      setFormError('Vui lòng chọn giáo viên chủ nhiệm.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === 'create') {
        const created = await createAdminClass({
          class_code: classForm.classCode.trim(),
          class_name: classForm.className.trim(),
          description: classForm.description.trim() || undefined,
          teacher_id: Number(classForm.ownerId),
        });
        setIsCreateModalOpen(false);
        setCurrentPage(1);
        await fetchClasses();
        setSelectedClassId(created.class_id);
      } else if (classToEdit) {
        await updateAdminClass(classToEdit.class_id, {
          class_code: classForm.classCode.trim(),
          class_name: classForm.className.trim(),
          description: classForm.description.trim() || undefined,
          teacher_id: Number(classForm.ownerId),
        });
        setIsCreateModalOpen(false);
        await fetchClasses();
        setSelectedClassId(classToEdit.class_id);
      }
    } catch (err: any) {
      setFormError(err?.message || 'Lỗi khi lưu lớp học.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (classItem: AdminClassRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus: 'active' | 'inactive' = classItem.status === 'active' ? 'inactive' : 'active';
    try {
      await updateAdminClass(classItem.class_id, { status: nextStatus });
      await fetchClasses();
      if (selectedClassId === classItem.class_id) {
        await fetchSelectedClassDetail(classItem.class_id);
      }
      alert('Đã cập nhật trạng thái lớp học.');
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi cập nhật trạng thái lớp học.');
    }
  };

  const handleDeleteClass = async () => {
    if (!deleteTarget) return;
    try {
      const result = await deleteAdminClass(deleteTarget.class_id);
      setDeleteTarget(null);
      await fetchClasses();
      if (result.deleted) {
        alert('Đã xóa mềm lớp học thành công.');
      } else {
        alert('Lớp đã phát sinh dữ liệu, hệ thống chuyển sang trạng thái tạm khóa.');
      }
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi xóa lớp học.');
    }
  };

  const handleAssignSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) return;
    if (!assignSubjectForm.subjectId || !assignSubjectForm.teacherId) {
      alert('Vui lòng chọn môn học và giáo viên.');
      return;
    }
    try {
      await assignSubjectToAdminClass(selectedClassId, {
        subject_id: Number(assignSubjectForm.subjectId),
        assigned_teacher_id: Number(assignSubjectForm.teacherId),
      });
      setAssignSubjectForm({ subjectId: '', teacherId: '' });
      await fetchSelectedClassDetail(selectedClassId);
      await fetchClasses();
      alert('Đã gán môn học cho lớp.');
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi gán môn học vào lớp.');
    }
  };

  const handleRemoveSubject = async (classSubjectId: number, subjectName: string | null) => {
    if (!selectedClassId) return;
    const label = subjectName || `#${classSubjectId}`;
    if (!window.confirm(`Bạn có chắc muốn gỡ môn học ${label} ra khỏi lớp?`)) return;
    try {
      await removeSubjectFromAdminClassByClassSubjectId(selectedClassId, classSubjectId);
      await fetchSelectedClassDetail(selectedClassId);
      await fetchClasses();
      alert('Đã gỡ môn học khỏi lớp.');
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi gỡ môn học khỏi lớp.');
    }
  };

  const handleAssignStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !selectedStudentToEnroll) return;
    try {
      await assignStudentToAdminClass(selectedClassId, { student_id: Number(selectedStudentToEnroll) });
      setSelectedStudentToEnroll('');
      await fetchSelectedClassDetail(selectedClassId);
      await fetchClasses();
      alert('Đã thêm học sinh vào lớp thành công.');
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi thêm học sinh vào lớp.');
    }
  };

  const handleRemoveStudent = async (studentId: number, studentName: string | null) => {
    if (!selectedClassId) return;
    if (!window.confirm(`Bạn có chắc muốn gỡ học sinh ${studentName || `#${studentId}`} ra khỏi lớp?`)) return;
    try {
      await removeStudentFromAdminClass(selectedClassId, studentId);
      await fetchSelectedClassDetail(selectedClassId);
      await fetchClasses();
      alert('Đã gỡ học sinh khỏi lớp.');
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi gỡ học sinh khỏi lớp.');
    }
  };

  const availableStudents = useMemo(() => {
    const enrolled = new Set(classStudents.map((item) => item.student_id));
    return studentOptions.filter((item) => item.is_active && !enrolled.has(item.user_id));
  }, [classStudents, studentOptions]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingState message="Đang tải danh sách lớp học..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <ErrorState title="Lỗi tải lớp học" message={error} onRetry={fetchClasses} />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 pt-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Quản lý lớp học</p>
          <h1 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter uppercase italic leading-[0.9]">
            Lớp học <br />
            <span className="text-[#b20112]">Chủ nhiệm và môn học</span>
          </h1>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-[#b20112] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-900/20 hover:bg-[#d62828] transition-all flex items-center gap-3 cursor-pointer"
        >
          <span className="material-symbols-outlined text-xl">add_box</span>
          Tạo lớp mới
        </button>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: 'Tổng số lớp', value: String(pagination?.total || classes.length), icon: 'class' },
          { label: 'Lớp hoạt động', value: String(classes.filter((item) => item.status === 'active').length), icon: 'check_circle' },
          { label: 'Lớp tạm khóa', value: String(classes.filter((item) => item.status === 'inactive').length), icon: 'pause_circle' },
        ].map((item, index) => (
          <div
            key={item.label}
            className={`rounded-[2.5rem] p-7 border shadow-sm relative overflow-hidden ${
              index === 0 ? 'bg-white border-slate-100 text-slate-800' : index === 1 ? 'bg-[#b20112] text-white border-transparent' : 'bg-slate-900 text-white border-transparent'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={`text-[10px] font-black uppercase tracking-[0.25em] ${index === 0 ? 'text-slate-400' : 'text-white/60'}`}>{item.label}</p>
                <h3 className="mt-4 text-4xl font-black tracking-tighter">{item.value}</h3>
              </div>
              <span className={`w-14 h-14 rounded-2xl flex items-center justify-center ${index === 0 ? 'bg-slate-50 text-[#b20112]' : 'bg-white/15 text-white'}`}>
                <span className="material-symbols-outlined text-3xl">{item.icon}</span>
              </span>
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.95fr] gap-6">
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Danh sách lớp học</h2>
              <div className="relative w-full md:w-72">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                <input
                  type="text"
                  placeholder="Tìm mã lớp, tên lớp..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-100 bg-white text-xs font-bold outline-none focus:ring-2 focus:ring-red-100 transition-all"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setCurrentPage(1);
                  setStatusFilter(e.target.value as 'all' | 'active' | 'inactive');
                }}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Tạm khóa</option>
              </select>
              <select
                value={teacherFilterId}
                onChange={(e) => {
                  setCurrentPage(1);
                  setTeacherFilterId(e.target.value);
                }}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              >
                <option value="all">Tất cả giáo viên</option>
                {teacherOptions.filter((item) => item.is_active).map((teacher) => (
                  <option key={teacher.user_id} value={teacher.user_id}>
                    {teacher.full_name}
                  </option>
                ))}
              </select>              <select
                value={sortBy}
                onChange={(e) => {
                  setCurrentPage(1);
                  setSortBy(e.target.value as 'created_at' | 'class_name' | 'student_count');
                }}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              >
                <option value="created_at">Sắp xếp theo thời gian tạo</option>
                <option value="class_name">Sắp xếp theo tên lớp</option>
                <option value="student_count">Sắp xếp theo số học sinh</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => {
                  setCurrentPage(1);
                  setSortOrder(e.target.value as 'asc' | 'desc');
                }}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              >
                <option value="desc">Giảm dần</option>
                <option value="asc">Tăng dần</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            {classes.length === 0 ? (
              <div className="p-8">
                <EmptyState title="Không có lớp học" message="Chưa có dữ liệu lớp học phù hợp với bộ lọc hiện tại." />
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-50 bg-slate-50/50">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Lớp học</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Giáo viên chủ nhiệm</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Học sinh</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Giáo viên</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Môn học</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Trạng thái</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {classes.map((row) => {
                    const isSelected = selectedClassId === row.class_id;
                    return (
                      <tr
                        key={row.class_id}
                        className={`hover:bg-slate-50/40 transition-colors cursor-pointer ${isSelected ? 'bg-red-50/30' : ''}`}
                        onClick={() => setSelectedClassId(row.class_id)}
                      >
                        <td className="px-8 py-6">
                          <p className="text-sm font-black text-slate-900">{row.class_name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{row.class_code} | ID: {row.class_id}</p>
                          <p className="text-[11px] text-slate-500 mt-1">{row.description || 'Không có mô t?'}</p>
                          <p className="text-[10px] text-slate-400 mt-1">Tạo: {row.created_at ? new Date(row.created_at).toLocaleDateString('vi-VN') : '-'}</p>
                        </td>
                        <td className="px-6 py-6 text-sm font-semibold text-slate-700">{row.teacher_name}</td>
                        <td className="px-6 py-6 text-center text-sm font-black text-slate-900">{row.student_count}</td>
                        <td className="px-6 py-6 text-center text-sm font-black text-slate-900">{row.teacher_count}</td>
                        <td className="px-6 py-6 text-center text-sm font-black text-[#b20112]">{row.subject_count}</td>
                        <td className="px-6 py-6">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${row.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-[#b20112]'}`}>
                            {toStatusLabel(row.status)}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => openEditModal(row, e)}
                              className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all cursor-pointer flex items-center justify-center"
                            >
                              <span className="material-symbols-outlined text-xl">edit</span>
                            </button>
                            <button
                              onClick={(e) => handleToggleStatus(row, e)}
                              className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-[#b20112] hover:text-white transition-all cursor-pointer flex items-center justify-center"
                            >
                              <span className="material-symbols-outlined text-xl">{row.status === 'active' ? 'block' : 'lock_open'}</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(row);
                              }}
                              className="w-10 h-10 rounded-xl bg-slate-50 text-red-300 hover:bg-red-500 hover:text-white transition-all cursor-pointer flex items-center justify-center"
                            >
                              <span className="material-symbols-outlined text-xl">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          <div className="px-8 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Trang {pagination?.page || currentPage} / {pagination?.total_pages || 1} - Tổng {pagination?.total || classes.length}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={(pagination?.page || currentPage) <= 1}
                className="px-3 py-2 text-xs font-black border rounded-lg border-slate-200 disabled:opacity-50"
              >
                Trước
              </button>
              <button
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={(pagination?.page || currentPage) >= (pagination?.total_pages || 1)}
                className="px-3 py-2 text-xs font-black border rounded-lg border-slate-200 disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-8 flex flex-col min-h-[500px]">
            {!selectedClassId ? (
              <div className="flex-1 flex items-center justify-center">
                <EmptyState title="Chưa chọn lớp học" message="Hãy chọn một lớp học để xem chi tiết phân công." />
              </div>
            ) : isDetailLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <LoadingState message="Đang tải chi tiết lớp học..." />
              </div>
            ) : detailError ? (
              <div className="flex-1 flex items-center justify-center">
                <ErrorState title="Lỗi tải chi tiết lớp" message={detailError} onRetry={() => fetchSelectedClassDetail(selectedClassId)} />
              </div>
            ) : !selectedClass ? (
              <div className="flex-1 flex items-center justify-center">
                <EmptyState title="Không có dữ liệu lớp" message="Lớp học đã chọn không còn khả dụng." />
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chi tiết lớp học</span>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight mt-1">{selectedClass.class_name}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">GV Chủ nhiệm: <strong className="text-slate-800">{selectedClass.teacher_name}</strong></p>
                </div>

                <div className="flex bg-slate-100 rounded-2xl p-1 mb-6">
                  <button
                    onClick={() => setActiveDetailTab('subjects')}
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${activeDetailTab === 'subjects' ? 'bg-[#b20112] text-white shadow-md' : 'text-slate-500'}`}
                  >
                    Môn học ({classSubjects.length})
                  </button>
                  <button
                    onClick={() => setActiveDetailTab('students')}
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${activeDetailTab === 'students' ? 'bg-[#b20112] text-white shadow-md' : 'text-slate-500'}`}
                  >
                    Học sinh ({classStudents.length})
                  </button>
                </div>

                {activeDetailTab === 'subjects' ? (
                  <div className="space-y-6 flex-1 flex flex-col justify-between">
                    <div className="space-y-4 overflow-y-auto max-h-[300px]">
                      {classSubjects.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 font-medium italic border border-dashed border-slate-100 rounded-2xl">Chưa gán môn học nào.</div>
                      ) : (
                        classSubjects.map((subject) => (
                          <div key={subject.class_subject_id} className="rounded-2xl bg-slate-50 px-5 py-4 border border-slate-100">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="text-sm font-black text-slate-900">{subject.subject_name || 'Unknown Subject'}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subject.subject_code || '-'}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded-full text-[9px] font-black bg-white border border-slate-100 text-slate-600">
                                  {subject.assigned_teacher_name || 'Chưa gán'}
                                </span>
                                <button
                                  onClick={() => handleRemoveSubject(subject.class_subject_id, subject.subject_name)}
                                  className="w-8 h-8 rounded-lg bg-white border border-slate-100 text-slate-400 hover:text-[#b20112] hover:border-red-100 transition-all cursor-pointer flex items-center justify-center"
                                >
                                  <span className="material-symbols-outlined text-base">close</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="border-t border-slate-50 pt-6 mt-6">
                      <p className="text-[9px] font-black uppercase tracking-widest text-[#b20112] mb-3">Phân công môn giảng dạy</p>
                      <form onSubmit={handleAssignSubject} className="space-y-3">
                        <select
                          required
                          value={assignSubjectForm.subjectId}
                          onChange={(e) => setAssignSubjectForm((prev) => ({ ...prev, subjectId: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs outline-none bg-white"
                        >
                          <option value="">-- Chọn môn học --</option>
                          {subjectOptions.filter((item) => item.status === 'active').map((subject) => (
                            <option key={subject.subject_id} value={subject.subject_id}>
                              {subject.subject_name} ({subject.subject_code})
                            </option>
                          ))}
                        </select>
                        <select
                          required
                          value={assignSubjectForm.teacherId}
                          onChange={(e) => setAssignSubjectForm((prev) => ({ ...prev, teacherId: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs outline-none bg-white"
                        >
                          <option value="">-- Chọn giáo viên phụ trách --</option>
                          {teacherOptions.filter((item) => item.is_active).map((teacher) => (
                            <option key={teacher.user_id} value={teacher.user_id}>
                              {teacher.full_name}
                            </option>
                          ))}
                        </select>
                        <button type="submit" className="w-full py-3 bg-[#b20112] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-700 transition-colors cursor-pointer">
                          Xác nhận gán môn
                        </button>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 flex-1 flex flex-col justify-between">
                    <div className="space-y-3 overflow-y-auto max-h-[300px] flex-1">
                      {classStudents.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 font-medium italic border border-dashed border-slate-100 rounded-2xl">Lớp học hiện chưa có học sinh nào.</div>
                      ) : (
                        classStudents.map((student) => (
                          <div key={student.class_student_id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-5 py-4 border border-slate-100">
                            <div>
                              <p className="text-sm font-black text-slate-900">{student.full_name || 'Unknown Student'}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{student.username || '-'}</p>
                            </div>
                            <button
                              onClick={() => handleRemoveStudent(student.student_id, student.full_name)}
                              className="w-8 h-8 rounded-lg bg-white border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-100 transition-all cursor-pointer flex items-center justify-center"
                            >
                              <span className="material-symbols-outlined text-base">close</span>
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="border-t border-slate-50 pt-6 mt-6">
                      <p className="text-[9px] font-black uppercase tracking-widest text-[#b20112] mb-3">Xếp học sinh mới vào lớp</p>
                      <form onSubmit={handleAssignStudent} className="flex gap-2">
                        <select
                          required
                          value={selectedStudentToEnroll}
                          onChange={(e) => setSelectedStudentToEnroll(e.target.value)}
                          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-xs outline-none bg-white"
                        >
                          <option value="">-- Chọn học sinh --</option>
                          {availableStudents.map((student) => (
                            <option key={student.user_id} value={student.user_id}>
                              {student.full_name} ({student.username})
                            </option>
                          ))}
                        </select>
                        <button type="submit" className="px-5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-colors cursor-pointer">
                          Thêm
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </aside>
      </section>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center px-4 animate-in fade-in duration-300">
          <div className="w-full max-w-2xl rounded-[2.5rem] bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Thông tin lớp học</p>
                <h3 className="mt-2 text-3xl font-black text-slate-900 tracking-tight">
                  {modalMode === 'create' ? 'Tạo lớp học mới' : 'Chỉnh sửa thông tin lớp'}
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitClassForm}>
              <div className="p-8 grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6">
                <div className="space-y-4">
                  {formError && (
                    <div className="p-4 bg-red-50 text-[#b20112] border border-red-100 rounded-xl text-xs font-bold">
                      {formError}
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Mã lớp</label>
                    <input
                      required
                      value={classForm.classCode}
                      onChange={(e) => setClassForm((prev) => ({ ...prev, classCode: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-red-100"
                      placeholder="VD: 10A1"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Tên lớp học</label>
                    <input
                      required
                      value={classForm.className}
                      onChange={(e) => setClassForm((prev) => ({ ...prev, className: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-red-100"
                      placeholder="VD: Lớp 10A1"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Mô tả lớp</label>
                    <textarea
                      value={classForm.description}
                      onChange={(e) => setClassForm((prev) => ({ ...prev, description: e.target.value }))}
                      className="w-full min-h-28 px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-red-100 resize-none"
                      placeholder="Mô tả lớp học..."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[2rem] bg-slate-50 border border-slate-100 p-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Giáo viên chủ nhiệm</p>
                    <select
                      value={classForm.ownerId}
                      onChange={(e) => setClassForm((prev) => ({ ...prev, ownerId: e.target.value }))}
                      className="mt-4 w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-red-100 bg-white font-bold"
                    >
                      <option value="">-- Chọn giáo viên --</option>
                      {teacherOptions.filter((item) => item.is_active).map((teacher) => (
                        <option key={teacher.user_id} value={teacher.user_id}>
                          {teacher.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/40">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-white transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl bg-[#b20112] text-white text-sm font-black uppercase tracking-widest shadow-lg shadow-red-900/20 disabled:bg-slate-400 cursor-pointer"
                >
                  {isSubmitting ? 'Đang xử lý...' : 'Lưu lớp học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center px-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-[2rem] bg-white shadow-2xl p-6 text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-50 text-[#b20112] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">warning</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Xác nhận xóa lớp học</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Bạn có chắc chắn muốn xóa lớp học <strong>{deleteTarget.class_name}</strong> ({deleteTarget.class_code})?
              Nếu lớp đã phát sinh dữ liệu học sinh/giáo viên/môn học thì hệ thống sẽ tự chuyển sang trạng thái tạm khóa.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-5 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDeleteClass}
                className="px-5 py-3 rounded-xl bg-[#b20112] text-white text-sm font-black hover:bg-red-700 transition-all cursor-pointer"
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




