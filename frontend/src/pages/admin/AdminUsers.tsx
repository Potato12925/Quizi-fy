import React, { useEffect, useState } from 'react';
import { getUsers, getClasses, createUser, updateUser, deleteUser, type AdminUser, type AdminClass } from '@/api/adminApi';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<'students' | 'teachers'>('students');
  const [students, setStudents] = useState<AdminUser[]>([]);
  const [teachers, setTeachers] = useState<AdminUser[]>([]);
  const [classes, setClasses] = useState<AdminClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'student',
    code: '', // Mã học sinh
    classId: '', // Lớp học sinh
    subjectsString: '', // Môn học giáo viên
    status: 'Hoạt động',
    dept: '' // Tổ chuyên môn
  });
  
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userData = await getUsers();
      const classData = await getClasses();
      setStudents(userData.students);
      setTeachers(userData.teachers);
      setClasses(classData);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách tài khoản.');
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
      email: '',
      role: activeTab === 'students' ? 'student' : 'teacher',
      code: '',
      classId: classes.length > 0 ? classes[0].id : '',
      subjectsString: '',
      status: 'Hoạt động',
      dept: 'Tổ Toán - Tin'
    });
    setFormError('');
    setModalMode('create');
    setIsModalOpen(true);
  };

  const openEditModal = (user: AdminUser) => {
    setCurrentUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role === 'student' ? 'student' : 'teacher',
      code: user.code || '',
      classId: user.classId || (classes.length > 0 ? classes[0].id : ''),
      subjectsString: user.subjects ? user.subjects.join(', ') : '',
      status: user.status,
      dept: user.dept || 'Tổ Toán - Tin'
    });
    setFormError('');
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!formData.name.trim()) return setFormError('Họ tên không được để trống.');
    if (!formData.email.trim()) return setFormError('Email không được để trống.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return setFormError('Email không hợp lệ.');
    
    if (formData.role === 'student') {
      if (!formData.code.trim()) return setFormError('Mã học sinh không được để trống.');
      if (!formData.classId) return setFormError('Vui lòng chọn lớp học.');
    }

    setIsSubmitting(true);
    try {
      const selectedClass = classes.find(c => c.id === formData.classId);
      
      const payload: Omit<AdminUser, 'id'> = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        status: formData.status,
        code: formData.role === 'student' ? formData.code.trim() : undefined,
        classId: formData.role === 'student' ? formData.classId : undefined,
        className: formData.role === 'student' && selectedClass ? selectedClass.name : undefined,
        dept: formData.role === 'teacher' ? formData.dept : undefined,
        subjects: formData.role === 'teacher' ? formData.subjectsString.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      };

      if (modalMode === 'create') {
        const newUser = await createUser(payload);
        if (payload.role === 'student') {
          setStudents(prev => [newUser, ...prev]);
        } else {
          setTeachers(prev => [newUser, ...prev]);
        }
      } else if (modalMode === 'edit' && currentUser) {
        const updated = await updateUser(currentUser.id, payload);
        
        if (currentUser.role === formData.role) {
          if (formData.role === 'student') {
            setStudents(prev => prev.map(u => u.id === currentUser.id ? { ...u, ...updated } : u));
          } else {
            setTeachers(prev => prev.map(u => u.id === currentUser.id ? { ...u, ...updated } : u));
          }
        } else {
          // Role changed
          if (currentUser.role === 'student') {
            setStudents(prev => prev.filter(u => u.id !== currentUser.id));
            setTeachers(prev => [updated, ...prev]);
          } else {
            setTeachers(prev => prev.filter(u => u.id !== currentUser.id));
            setStudents(prev => [updated, ...prev]);
          }
        }
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Lỗi khi lưu dữ liệu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: AdminUser) => {
    const nextStatus = user.status === 'Hoạt động' ? 'Đã khóa' : 'Hoạt động';
    try {
      await updateUser(user.id, { status: nextStatus });
      if (user.role === 'student') {
        setStudents(prev => prev.map(u => u.id === user.id ? { ...u, status: nextStatus } : u));
      } else {
        setTeachers(prev => prev.map(u => u.id === user.id ? { ...u, status: nextStatus } : u));
      }
    } catch (err) {
      alert('Không thể cập nhật trạng thái người dùng.');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUser(deleteTarget.id);
      if (deleteTarget.role === 'student') {
        setStudents(prev => prev.filter(u => u.id !== deleteTarget.id));
      } else {
        setTeachers(prev => prev.filter(u => u.id !== deleteTarget.id));
      }
      setDeleteTarget(null);
    } catch (err) {
      alert('Lỗi khi xóa người dùng.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingState message="Đang tải danh sách tài khoản..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <ErrorState title="Lỗi tải tài khoản" message={error} onRetry={fetchData} />
      </div>
    );
  }

  const currentRows = activeTab === 'students' ? students : teachers;

  // Filter lists based on search query
  const filteredRows = currentRows.filter(row => 
    row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    row.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (row.code && row.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (row.className && row.className.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (row.subjects && row.subjects.some(sub => sub.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 pt-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Quản lý người dùng</p>
          <h1 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter uppercase italic leading-[0.9]">
            Tài khoản <br />
            <span className="text-[#b20112]">Học sinh và giáo viên</span>
          </h1>
          <p className="text-slate-500 mt-4 max-w-2xl font-medium italic">
            Hệ thống quản lý tài khoản cho trường trung học phổ thông. Đồng bộ trực tiếp với database users & class mappings.
          </p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-[#b20112] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-900/20 hover:bg-[#d62828] transition-all flex items-center gap-3 cursor-pointer"
        >
          <span className="material-symbols-outlined text-xl">person_add</span>
          Thêm người dùng
        </button>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: 'Học sinh', value: students.length.toString(), icon: 'school' },
          { label: 'Giáo viên', value: teachers.length.toString(), icon: 'groups' },
          { label: 'Tài khoản khóa', value: [...students, ...teachers].filter(u => u.status === 'Đã khóa').length.toString(), icon: 'lock' },
        ].map((item, index) => (
          <div
            key={item.label}
            className={`rounded-[2.5rem] p-7 border shadow-sm relative overflow-hidden ${
              index === 0 ? 'bg-white border-slate-100 text-slate-800' : 
              index === 1 ? 'bg-[#b20112] text-white border-transparent' : 
              'bg-slate-900 text-white border-transparent'
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

      <section className="w-full">
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden w-full">
          <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex p-2 bg-slate-100 rounded-3xl w-fit gap-2">
              <button
                onClick={() => { setActiveTab('students'); setSearchQuery(''); }}
                className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'students' ? 'bg-white text-[#b20112] shadow-xl shadow-red-900/5' : 'text-slate-400'}`}
              >
                Học sinh
              </button>
              <button
                onClick={() => { setActiveTab('teachers'); setSearchQuery(''); }}
                className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'teachers' ? 'bg-white text-[#b20112] shadow-xl shadow-red-900/5' : 'text-slate-400'}`}
              >
                Giáo viên
              </button>
            </div>

            <div className="relative w-full md:w-72">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
              <input
                type="text"
                placeholder={activeTab === 'students' ? 'Tìm tên, email, lớp, mã HS...' : 'Tìm tên, email, tổ chuyên môn...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-100 bg-white text-xs font-bold outline-none focus:ring-2 focus:ring-red-100 transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            {filteredRows.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-medium italic">Không tìm thấy tài khoản nào.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Người dùng</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Thông tin bổ sung</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Trạng thái</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredRows.map((row) => (
                    <tr key={row.id + row.email} className="hover:bg-slate-50/40 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-[#b20112] flex items-center justify-center font-black text-sm ring-2 ring-white shadow-sm overflow-hidden">
                            {row.img ? (
                              <img src={row.img} alt={row.name} className="w-full h-full object-cover" />
                            ) : (
                              row.initial || row.name.split(' ').slice(-2).map(item => item[0]).join('')
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900">{row.name}</p>
                            <p className="text-[11px] text-slate-400 font-semibold">{row.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        {activeTab === 'students' ? (
                          <>
                            <p className="text-xs font-black text-slate-700">Mã HS: {row.code || 'HSxxxxx'}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#b20112]">{row.className || 'Chưa phân lớp'}</p>
                          </>
                        ) : (
                          <div>
                            <p className="text-xs font-black text-slate-700">{row.dept || 'Tổ chuyên môn'}</p>
                            <div className="flex flex-wrap gap-1.5 mt-1 max-w-[200px]">
                              {row.subjects && row.subjects.length > 0 ? (
                                row.subjects.map((subject) => (
                                  <span key={subject} className="text-[8px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md uppercase tracking-tighter">
                                    {subject}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[8px] font-black bg-red-50 text-red-400 px-2 py-0.5 rounded-md uppercase tracking-tighter">Chưa phân môn</span>
                              )}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-6 text-center">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          row.status === 'Hoạt động' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-[#b20112]'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => openEditModal(row)}
                            className="p-3 rounded-xl bg-slate-50 hover:bg-slate-900 hover:text-white transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button 
                            onClick={() => handleToggleStatus(row)}
                            className="p-3 rounded-xl bg-slate-50 hover:bg-[#b20112] hover:text-white transition-all cursor-pointer"
                            title={row.status === 'Hoạt động' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                          >
                            <span className="material-symbols-outlined text-lg">{row.status === 'Hoạt động' ? 'block' : 'lock_open'}</span>
                          </button>
                          <button 
                            onClick={() => setDeleteTarget(row)}
                            className="p-3 rounded-xl bg-slate-50 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>

      {/* FLOAT BUTTON FOR ADD */}
      <button 
        onClick={openCreateModal}
        className="fixed bottom-10 right-10 w-16 h-16 bg-[#b20112] text-white rounded-[2rem] shadow-2xl shadow-red-900/40 flex items-center justify-center hover:scale-110 hover:rotate-12 active:scale-95 transition-all z-40 cursor-pointer"
      >
        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
      </button>

      {/* CRUD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center px-4 animate-in fade-in duration-300">
          <div className="w-full max-w-2xl rounded-[2.5rem] bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Thông tin tài khoản</p>
                <h3 className="mt-2 text-3xl font-black text-slate-900 tracking-tight">
                  {modalMode === 'create' ? 'Tạo tài khoản mới' : 'Chỉnh sửa tài khoản'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Họ và tên</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-red-100"
                      placeholder="VD: Nguyễn Văn A"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Địa chỉ Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-red-100"
                      placeholder="VD: hocsinh@gmail.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Vai trò</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-red-100 bg-white"
                      disabled={modalMode === 'edit'}
                    >
                      <option value="student">Học sinh</option>
                      <option value="teacher">Giáo viên</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Trạng thái</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-red-100 bg-white"
                    >
                      <option value="Hoạt động">Hoạt động</option>
                      <option value="Đã khóa">Khóa tài khoản</option>
                    </select>
                  </div>
                </div>

                {formData.role === 'student' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-50 pt-4 animate-in slide-in-from-top-2 duration-300">
                    <div>
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Mã học sinh</label>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-red-100"
                        placeholder="VD: HS1001"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Xếp vào lớp</label>
                      <select
                        value={formData.classId}
                        onChange={(e) => setFormData(prev => ({ ...prev, classId: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-red-100 bg-white"
                      >
                        <option value="">-- Chọn lớp học --</option>
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-50 pt-4 animate-in slide-in-from-top-2 duration-300">
                    <div>
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Tổ chuyên môn</label>
                      <select
                        value={formData.dept}
                        onChange={(e) => setFormData(prev => ({ ...prev, dept: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-red-100 bg-white"
                      >
                        <option value="Tổ Toán - Tin">Tổ Toán - Tin</option>
                        <option value="Tổ Ngữ Văn">Tổ Ngữ Văn</option>
                        <option value="Tổ Vật lý - Hóa học">Tổ Vật lý - Hóa học</option>
                        <option value="Tổ Lịch sử - Địa lý">Tổ Lịch sử - Địa lý</option>
                        <option value="Tổ Ngoại Ngữ">Tổ Ngoại Ngữ</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Môn phụ trách (Ngăn cách bằng dấu phẩy)</label>
                      <input
                        type="text"
                        value={formData.subjectsString}
                        onChange={(e) => setFormData(prev => ({ ...prev, subjectsString: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-red-100"
                        placeholder="VD: Toán học 10, Vật lý 10"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="px-8 py-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/40">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-white transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl bg-[#b20112] text-white text-sm font-black uppercase tracking-widest shadow-lg shadow-red-900/20 disabled:bg-slate-400 cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                  Lưu tài khoản
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
            <h3 className="text-xl font-black text-slate-900 mb-2">Xác nhận xóa tài khoản</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Bạn có chắc chắn muốn xóa tài khoản của <strong>{deleteTarget.name}</strong> ({deleteTarget.email})? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-5 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDeleteUser}
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