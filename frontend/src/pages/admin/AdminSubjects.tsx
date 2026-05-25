import React, { useEffect, useState } from 'react';
import { getSubjects, getClasses, getUsers, createSubject, updateSubject, deleteSubject, assignSubjectToClass, type AdminSubject, type AdminClass, type AdminUser } from '@/api/adminApi';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<AdminSubject[]>([]);
  const [classes, setClasses] = useState<AdminClass[]>([]);
  const [teachers, setTeachers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentSubject, setCurrentSubject] = useState<AdminSubject | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    teacher: 'Chưa gán',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Assign Teacher Modal
  const [assignTeacherTarget, setAssignTeacherTarget] = useState<AdminSubject | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState('');

  // Quick Assign to Class Modal
  const [assignClassTarget, setAssignClassTarget] = useState<AdminSubject | null>(null);
  const [selectedClassId, setSelectedClassId] = useState('');

  // Delete target
  const [deleteTarget, setDeleteTarget] = useState<AdminSubject | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const subjectData = await getSubjects();
      const classData = await getClasses();
      const userData = await getUsers();
      setSubjects(subjectData);
      setClasses(classData);
      setTeachers(userData.teachers);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải dữ liệu môn học.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setFormData({
      name: '',
      code: '',
      teacher: 'Chưa gán',
    });
    setFormError('');
    setModalMode('create');
    setIsFormModalOpen(true);
  };

  const openEditModal = (subject: AdminSubject) => {
    setCurrentSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      teacher: subject.teacher,
    });
    setFormError('');
    setModalMode('edit');
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) return setFormError('Tên môn học không được để trống.');
    if (!formData.code.trim()) return setFormError('Mã môn học không được để trống.');

    setIsSubmitting(true);
    try {
      if (modalMode === 'create') {
        const newSubject = await createSubject(formData);
        setSubjects(prev => [newSubject, ...prev]);
      } else if (modalMode === 'edit' && currentSubject) {
        const updated = await updateSubject(currentSubject.id, formData);
        setSubjects(prev => prev.map(s => s.id === currentSubject.id ? { ...s, ...updated } : s));
      }
      setIsFormModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Lỗi khi lưu môn học.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAssignTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTeacherTarget || !selectedTeacher) return;

    try {
      await updateSubject(assignTeacherTarget.id, { 
        teacher: selectedTeacher,
        code: assignTeacherTarget.code,
        name: assignTeacherTarget.name
      });
      setSubjects(prev => prev.map(s => s.id === assignTeacherTarget.id ? { ...s, teacher: selectedTeacher } : s));
      alert(`Đã phân công môn học ${assignTeacherTarget.name} cho giáo viên ${selectedTeacher}.`);
      setAssignTeacherTarget(null);
    } catch (err) {
      alert('Lỗi khi phân công giáo viên.');
    }
  };

  const handleQuickAssignClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignClassTarget || !selectedClassId) return;

    const classObj = classes.find(c => c.id === selectedClassId);
    if (!classObj) return;

    try {
      await assignSubjectToClass(classObj.id, assignClassTarget.code, assignClassTarget.teacher);
      
      // Update local count of classes
      setSubjects(prev => prev.map(s => s.id === assignClassTarget.id ? { ...s, classes: s.classes + 1 } : s));

      alert(`Đã gán thành công môn học ${assignClassTarget.name} vào lớp ${classObj.name}.`);
      setAssignClassTarget(null);
    } catch (err) {
      alert('Lỗi khi gán môn học vào lớp.');
    }
  };

  const handleDeleteSubject = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSubject(deleteTarget.id);
      setSubjects(prev => prev.filter(s => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert('Lỗi khi xóa môn học.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingState message="Đang tải danh sách môn học..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <ErrorState title="Lỗi tải môn học" message={error} onRetry={fetchData} />
      </div>
    );
  }

  // Filter subjects based on query
  const filteredSubjects = subjects.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 pt-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Quản lý môn học</p>
          <h1 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter uppercase italic leading-[0.9]">
            Danh mục <br />
            <span className="text-[#b20112]">Môn học</span>
          </h1>
          <p className="text-slate-500 mt-4 max-w-2xl font-medium italic">
            Cấu hình danh mục môn học của trường Trung học phổ thông. Đồng bộ trực tiếp với database subjects.
          </p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-[#b20112] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-900/20 hover:bg-[#d62828] transition-all flex items-center gap-3 cursor-pointer"
        >
          <span className="material-symbols-outlined text-xl">library_add</span>
          Thêm môn học
        </button>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {[
          { label: 'Tổng số môn học', value: subjects.length.toString() },
          { label: 'Môn học hoạt động', value: subjects.filter(s => s.teacher !== 'Chưa gán').length.toString() },
          { label: 'Môn chưa phân công GV', value: subjects.filter(s => s.teacher === 'Chưa gán').length.toString() },
          { label: 'Tổng số lượt gán lớp', value: subjects.reduce((sum, s) => sum + s.classes, 0).toString() },
        ].map((item, index) => (
          <div
            key={item.label}
            className={`rounded-[2.5rem] p-7 border shadow-sm ${
              index === 0 ? 'bg-white border-slate-100 text-slate-800' : 
              index === 1 ? 'bg-[#b20112] text-white border-transparent' : 
              index === 2 ? 'bg-slate-900 text-white border-transparent' : 
              'bg-white border-slate-100 text-slate-800'
            }`}
          >
            <p className={`text-[10px] font-black uppercase tracking-[0.25em] ${index === 0 || index === 3 ? 'text-slate-400' : 'text-white/60'}`}>{item.label}</p>
            <h3 className="mt-4 text-4xl font-black tracking-tighter">{item.value}</h3>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Bảng môn học</h2>
              <p className="text-sm text-slate-500 mt-1">Danh sách môn giảng dạy, giáo viên phụ trách chuyên môn và gán lớp.</p>
            </div>
            <div className="relative w-full md:w-72">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
              <input
                type="text"
                placeholder="Tìm môn học..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-100 bg-white text-xs font-bold outline-none focus:ring-2 focus:ring-red-100 transition-all"
              />
            </div>
          </div>

          {filteredSubjects.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-medium italic">Không tìm thấy môn học nào.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-0">
              {filteredSubjects.map((subject) => (
                <div key={subject.code} className="border-b border-r border-slate-100 p-8 group hover:bg-slate-50/40 transition-colors flex flex-col justify-between min-h-[300px]">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-[#b20112] transition-all">
                        <span className="material-symbols-outlined text-3xl">menu_book</span>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => openEditModal(subject)}
                          className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-xl">edit</span>
                        </button>
                        <button 
                          onClick={() => setDeleteTarget(subject)}
                          className="w-10 h-10 rounded-xl bg-slate-50 text-red-300 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-xl">delete</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-lg font-black text-slate-800 tracking-tight leading-tight uppercase italic line-clamp-2">{subject.name}</h4>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">
                          Mã môn: {subject.code}
                        </p>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-2xl space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tổ trưởng bộ môn</p>
                          <p className={`font-black ${subject.teacher === 'Chưa gán' ? 'text-red-500' : 'text-slate-800'}`}>{subject.teacher}</p>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Số lớp đang học</p>
                          <p className="font-black text-slate-800">{subject.classes} lớp</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 flex gap-3">
                    <button 
                      onClick={() => { setAssignTeacherTarget(subject); setSelectedTeacher(subject.teacher !== 'Chưa gán' ? subject.teacher : ''); }}
                      className="flex-1 py-3 rounded-xl border border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-900 hover:text-white transition-all cursor-pointer"
                    >
                      Chọn giáo viên
                    </button>
                    <button 
                      onClick={() => { setAssignClassTarget(subject); setSelectedClassId(''); }}
                      className="flex-1 py-3 rounded-xl border border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:bg-[#b20112] hover:text-white transition-all cursor-pointer"
                    >
                      Gán vào lớp
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-[#b20112] text-white rounded-[3rem] p-8 shadow-2xl shadow-red-900/20 relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 opacity-15">
              <span className="material-symbols-outlined text-[180px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                school
              </span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60">Học vụ THPT</p>
            <h3 className="mt-4 text-3xl font-black tracking-tighter">Phân công giảng dạy</h3>
            <p className="mt-4 text-sm text-white/75 leading-relaxed">
              Môn học thiết kế theo chương trình chuẩn THPT quốc gia. Giáo viên được phân công môn học sẽ chịu trách nhiệm tải tài liệu giảng dạy, ôn tập và biên soạn ngân hàng đề thi.
            </p>
          </div>

          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-8">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Xem nhanh quy trình</p>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-slate-50 px-5 py-4 border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">1. Tạo môn học</p>
                <p className="mt-1 text-xs text-slate-500">Thêm môn học của khối lớp tương ứng (Toán 10, Lý 10...).</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-5 py-4 border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">2. Chọn giáo viên phụ trách</p>
                <p className="mt-1 text-xs text-slate-500">Chỉ định giáo viên phụ trách chuyên môn chính cho môn học.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CREATE / EDIT SUBJECT FORM MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center px-4 animate-in fade-in duration-300">
          <div className="w-full max-w-lg rounded-[2.5rem] bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Thông tin môn học</p>
                <h3 className="mt-2 text-3xl font-black text-slate-900 tracking-tight">
                  {modalMode === 'create' ? 'Thêm môn học mới' : 'Chỉnh sửa môn học'}
                </h3>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="p-8 space-y-4">
                {formError && (
                  <div className="p-4 bg-red-50 text-[#b20112] border border-red-100 rounded-xl text-xs font-bold">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Tên môn học</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-red-100"
                    placeholder="VD: Toán học 10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Mã môn học</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-red-100"
                    placeholder="VD: TOAN10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Giáo viên phụ trách môn học</label>
                  <select
                    value={formData.teacher}
                    onChange={(e) => setFormData(prev => ({ ...prev, teacher: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-red-100 bg-white"
                  >
                    <option value="Chưa gán">Chưa gán giáo viên</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="px-8 py-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/40">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-5 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-white transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl bg-[#b20112] text-white text-sm font-black uppercase tracking-widest shadow-lg shadow-red-900/20 disabled:bg-slate-400 cursor-pointer"
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu môn học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ASSIGN TEACHER MODAL */}
      {assignTeacherTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center px-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-[2.5rem] bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Phân công giáo viên</p>
                <h3 className="text-xl font-black text-slate-900 tracking-tight mt-1">
                  Môn: {assignTeacherTarget.name}
                </h3>
              </div>
              <button onClick={() => setAssignTeacherTarget(null)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <form onSubmit={handleQuickAssignTeacherSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Chọn giáo viên bộ môn</label>
                  <select
                    required
                    value={selectedTeacher}
                    onChange={(e) => setSelectedTeacher(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-red-100 bg-white"
                  >
                    <option value="">-- Chọn giáo viên --</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/40">
                <button type="button" onClick={() => setAssignTeacherTarget(null)} className="px-4 py-2 border border-slate-200 text-xs font-bold rounded-lg cursor-pointer">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-[#b20112] text-white text-xs font-black uppercase rounded-lg cursor-pointer">Lưu phân công</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ASSIGN SUBJECT TO CLASS MODAL */}
      {assignClassTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center px-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-[2.5rem] bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Gán môn vào lớp học</p>
                <h3 className="text-xl font-black text-slate-900 tracking-tight mt-1">
                  Môn: {assignClassTarget.name}
                </h3>
              </div>
              <button onClick={() => setAssignClassTarget(null)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <form onSubmit={handleQuickAssignClassSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Chọn lớp học áp dụng</label>
                  <select
                    required
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-red-100 bg-white"
                  >
                    <option value="">-- Chọn lớp học --</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/40">
                <button type="button" onClick={() => setAssignClassTarget(null)} className="px-4 py-2 border border-slate-200 text-xs font-bold rounded-lg cursor-pointer">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-[#b20112] text-white text-xs font-black uppercase rounded-lg cursor-pointer">Lưu gán lớp</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center px-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-[2rem] bg-white shadow-2xl p-6 text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-50 text-[#b20112] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">warning</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Xác nhận xóa môn học</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Bạn có chắc chắn muốn xóa môn học <strong>{deleteTarget.name}</strong> ({deleteTarget.code})? Hành động này sẽ gỡ bỏ môn học khỏi danh mục đào tạo của trường.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-5 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteSubject}
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
