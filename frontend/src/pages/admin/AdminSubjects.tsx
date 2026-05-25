import React, { useEffect, useState } from 'react';
import { getSubjects, createSubject, updateSubject, deleteSubject, type AdminSubject } from '@/api/adminApi';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<AdminSubject[]>([]);
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
    description: '',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete target
  const [deleteTarget, setDeleteTarget] = useState<AdminSubject | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const subjectData = await getSubjects();
      setSubjects(subjectData);
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
      description: '',
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
      description: subject.description || '',
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

  const handleToggleStatus = async (subject: AdminSubject) => {
    const nextStatus = subject.status === 'Hoạt động' ? 'Tạm khóa' : 'Hoạt động';
    try {
      await updateSubject(subject.id, {
        status: nextStatus,
        code: subject.code,
        name: subject.name,
        description: subject.description
      });
      setSubjects(prev => prev.map(s => s.id === subject.id ? { ...s, status: nextStatus } : s));
    } catch (err) {
      alert('Lỗi khi cập nhật trạng thái môn học.');
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
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 pt-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Quản lý đào tạo</p>
          <h1 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter uppercase italic leading-[0.9]">
            Danh mục <br />
            <span className="text-[#b20112]">Môn học THPT</span>
          </h1>
          <p className="text-slate-500 mt-4 max-w-2xl font-medium italic">
            Cấu hình danh mục các môn học chính thức theo chuẩn trường THPT. Quản lý mã môn, mô tả học vụ và trạng thái hoạt động.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-[#b20112] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-900/20 hover:bg-[#d62828] transition-all flex items-center gap-3 cursor-pointer"
        >
          <span className="material-symbols-outlined text-xl">library_add</span>
          Thêm môn học mới
        </button>
      </div>

      {/* Stats row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: 'Tổng số môn học', value: subjects.length.toString(), icon: 'menu_book' },
          { label: 'Môn học hoạt động', value: subjects.filter(s => s.status === 'Hoạt động').length.toString(), icon: 'check_circle' },
          { label: 'Môn học tạm khóa', value: subjects.filter(s => s.status === 'Tạm khóa').length.toString(), icon: 'block' },
        ].map((item, index) => (
          <div
            key={item.label}
            className={`rounded-[2.5rem] p-7 border shadow-sm flex items-start justify-between gap-4 relative overflow-hidden ${
              index === 0 ? 'bg-white border-slate-100 text-slate-800' :
              index === 1 ? 'bg-[#b20112] text-white border-transparent' :
              'bg-slate-900 text-white border-transparent'
            }`}
          >
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.25em] ${index === 0 ? 'text-slate-400' : 'text-white/60'}`}>{item.label}</p>
              <h3 className="mt-4 text-4xl font-black tracking-tighter">{item.value}</h3>
            </div>
            <span className={`w-14 h-14 rounded-2xl flex items-center justify-center ${index === 0 ? 'bg-slate-50 text-[#b20112]' : 'bg-white/15 text-white'}`}>
              <span className="material-symbols-outlined text-3xl">{item.icon}</span>
            </span>
          </div>
        ))}
      </section>

      {/* Main Table/Grid */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden w-full">
        {/* Search Toolbar */}
        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Danh mục môn học chính thức</h2>
            <p className="text-sm text-slate-500 mt-1">Danh sách môn học được sử dụng để xây dựng đề thi và phân phối chương trình.</p>
          </div>
          <div className="relative w-full md:w-72">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
            <input
              type="text"
              placeholder="Tìm tên môn học, mã môn học..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-100 bg-white text-xs font-bold outline-none focus:ring-2 focus:ring-red-100 transition-all"
            />
          </div>
        </div>

        {/* Subjects List */}
        {filteredSubjects.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium italic">Không tìm thấy môn học nào phù hợp.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-0 divide-x divide-y divide-slate-100 border-t border-slate-100">
            {filteredSubjects.map((subject) => (
              <div key={subject.id} className="p-8 group hover:bg-slate-50/40 transition-all flex flex-col justify-between min-h-[260px]">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-[#b20112] transition-all">
                      <span className="material-symbols-outlined text-2xl">menu_book</span>
                    </div>
                    
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => openEditModal(subject)}
                        className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center cursor-pointer"
                        title="Chỉnh sửa môn học"
                      >
                        <span className="material-symbols-outlined text-xl">edit</span>
                      </button>
                      <button
                        onClick={() => setDeleteTarget(subject)}
                        className="w-10 h-10 rounded-xl bg-slate-50 text-red-300 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center cursor-pointer"
                        title="Xóa môn học"
                      >
                        <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="text-lg font-black text-slate-800 tracking-tight leading-tight uppercase italic">{subject.name}</h4>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">
                        Mã môn học: <span className="text-[#b20112]">{subject.code}</span>
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed line-clamp-2">
                      {subject.description || 'Chưa có mô tả cho môn học này.'}
                    </p>
                  </div>
                </div>

                {/* Status Toggle Switch */}
                <div className="pt-6 border-t border-slate-50/50 mt-6 flex items-center justify-between">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    subject.status === 'Hoạt động' ? 'text-emerald-500' : 'text-slate-300'
                  }`}>
                    {subject.status}
                  </span>
                  
                  <button
                    onClick={() => handleToggleStatus(subject)}
                    className={`w-12 h-6 rounded-full p-1 transition-all duration-300 cursor-pointer ${
                      subject.status === 'Hoạt động' ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                    title="Bật/Tắt trạng thái hoạt động"
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-all duration-300 ${
                      subject.status === 'Hoạt động' ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
              <div className="p-8 space-y-5">
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
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-red-100 font-bold"
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
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-red-100 font-bold uppercase"
                    placeholder="VD: TOAN10"
                    disabled={modalMode === 'edit'}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Mô tả môn học</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full min-h-24 px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-red-100 resize-none font-medium text-slate-700"
                    placeholder="Nhập mô tả chi tiết chương trình học của môn học này..."
                  />
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
