import React, { useEffect, useMemo, useState } from 'react';
import {
  createAdminUser,
  listAdminClasses,
  listAdminUsers,
  softDeleteAdminUser,
  updateAdminUser,
  updateAdminUserStatus,
  type AdminClassOption,
  type AdminUserRecord,
} from '@/api/adminApi';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingState from '@/components/common/LoadingState';

interface UserFormState {
  fullName: string;
  username: string;
  roleCode: 'student' | 'teacher';
  classId: string;
  isActive: boolean;
}

const DEFAULT_FORM: UserFormState = {
  fullName: '',
  username: '',
  roleCode: 'student',
  classId: '',
  isActive: true,
};

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<'students' | 'teachers'>('students');
  const [allUsers, setAllUsers] = useState<AdminUserRecord[]>([]);
  const [classes, setClasses] = useState<AdminClassOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentUser, setCurrentUser] = useState<AdminUserRecord | null>(null);
  const [formData, setFormData] = useState<UserFormState>(DEFAULT_FORM);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserRecord | null>(null);

  const fetchInitialData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [usersResult, classResult] = await Promise.all([
        listAdminUsers({ role_code: 'all', status: 'all', page: 1, limit: 100 }),
        listAdminClasses(),
      ]);
      setAllUsers(usersResult.items);
      setClasses(classResult);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách tài khoản.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const openCreateModal = () => {
    setCurrentUser(null);
    setModalMode('create');
    setFormData({ ...DEFAULT_FORM, roleCode: activeTab === 'students' ? 'student' : 'teacher' });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (user: AdminUserRecord) => {
    setCurrentUser(user);
    setModalMode('edit');
    setFormData({
      fullName: user.full_name,
      username: user.username,
      roleCode: user.roles.includes('teacher') ? 'teacher' : 'student',
      classId: '',
      isActive: user.is_active,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.fullName.trim()) {
      setFormError('Họ và tên không được để trống.');
      return;
    }
    if (!formData.username.trim()) {
      setFormError('Tên đăng nhập không được để trống.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === 'create') {
        await createAdminUser({
          full_name: formData.fullName.trim(),
          username: formData.username.trim(),
          role_code: formData.roleCode,
          ...(formData.roleCode === 'student' && formData.classId ? { class_id: Number(formData.classId) } : {}),
        });
      } else if (currentUser) {
        await updateAdminUser(currentUser.user_id, {
          full_name: formData.fullName.trim(),
          username: formData.username.trim(),
          is_active: formData.isActive,
        });
      }
      setIsModalOpen(false);
      await fetchInitialData();
    } catch (err: any) {
      setFormError(err.message || 'Lỗi khi lưu dữ liệu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: AdminUserRecord) => {
    try {
      await updateAdminUserStatus(user.user_id, !user.is_active);
      setAllUsers((prev) =>
        prev.map((item) =>
          item.user_id === user.user_id ? { ...item, is_active: !item.is_active } : item
        )
      );
    } catch {
      alert('Không thể cập nhật trạng thái tài khoản.');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    try {
      await softDeleteAdminUser(deleteTarget.user_id);
      setDeleteTarget(null);
      setAllUsers((prev) => prev.filter((item) => item.user_id !== deleteTarget.user_id));
    } catch {
      alert('Lỗi khi xóa người dùng.');
    }
  };

  const studentsCount = useMemo(() => allUsers.filter((u) => u.roles.includes('student')).length, [allUsers]);
  const teachersCount = useMemo(() => allUsers.filter((u) => u.roles.includes('teacher')).length, [allUsers]);
  const lockedCount = useMemo(() => allUsers.filter((u) => !u.is_active).length, [allUsers]);

  const users = useMemo(() => {
    const roleCode = activeTab === 'students' ? 'student' : 'teacher';
    const q = searchQuery.trim().toLowerCase();

    return allUsers.filter((user) => {
      const hasRole = user.roles.includes(roleCode);
      if (!hasRole) return false;
      if (!q) return true;

      return (
        user.full_name.toLowerCase().includes(q) ||
        user.username.toLowerCase().includes(q)
      );
    });
  }, [allUsers, activeTab, searchQuery]);

  if (isLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><LoadingState message="Đang tải danh sách tài khoản..." /></div>;
  }

  if (error) {
    return <div className="min-h-[60vh] flex items-center justify-center"><ErrorState title="Lỗi tải tài khoản" message={error} onRetry={fetchInitialData} /></div>;
  }

  return (
    <div className="pb-20 space-y-10">
      <div className="flex flex-col items-start justify-between gap-6 pt-2 lg:flex-row lg:items-end">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Quản lý người dùng</p>
          <h1 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter uppercase italic leading-[0.9]">
            Tài khoản <br />
            <span className="text-[#b20112]">Học sinh và giáo viên</span>
          </h1>
        </div>
        <button onClick={openCreateModal} className="bg-[#b20112] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
          <span className="text-xl material-symbols-outlined">person_add</span>
          Thêm người dùng
        </button>
      </div>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="rounded-[2.5rem] p-7 border bg-white border-slate-100"><p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Học sinh</p><h3 className="mt-4 text-4xl font-black tracking-tighter">{studentsCount}</h3></div>
        <div className="rounded-[2.5rem] p-7 border bg-[#b20112] text-white border-transparent"><p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60">Giáo viên</p><h3 className="mt-4 text-4xl font-black tracking-tighter">{teachersCount}</h3></div>
        <div className="rounded-[2.5rem] p-7 border bg-slate-900 text-white border-transparent"><p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60">Tài khoản khóa</p><h3 className="mt-4 text-4xl font-black tracking-tighter">{lockedCount}</h3></div>
      </section>

      <section className="bg-white rounded-[3rem] shadow-sm overflow-hidden w-full">
        <div className="flex flex-col justify-between gap-4 p-8 border-b border-slate-50 bg-slate-50/30 md:flex-row md:items-center">
          <div className="flex gap-2 p-2 bg-slate-100 rounded-3xl w-fit">
            <button onClick={() => setActiveTab('students')} className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest ${activeTab === 'students' ? 'bg-white text-[#b20112]' : 'text-slate-400'}`}>Học sinh</button>
            <button onClick={() => setActiveTab('teachers')} className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest ${activeTab === 'teachers' ? 'bg-white text-[#b20112]' : 'text-slate-400'}`}>Giáo viên</button>
          </div>
          <input
            type="text"
            placeholder="Tìm tên đăng nhập hoặc họ tên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 text-xs font-bold bg-white border outline-none md:w-72 rounded-xl border-slate-100"
          />
        </div>

        {users.length === 0 ? (
          <div className="p-8"><EmptyState title="Không có tài khoản" message="Chưa có dữ liệu phù hợp bộ lọc hiện tại." actionLabel="Thêm người dùng" onAction={openCreateModal} /></div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Người dùng</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Vai trò</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Trạng thái</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Mật khẩu lần đầu</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((row) => (
                  <tr key={row.user_id}>
                    <td className="px-8 py-6">
                      <p className="text-sm font-black text-slate-900">{row.full_name}</p>
                      <p className="text-[11px] text-slate-400 font-semibold">{row.username}</p>
                    </td>
                    <td className="px-6 py-6 text-xs font-black uppercase text-slate-600">{row.roles.join(', ')}</td>
                    <td className="px-6 py-6">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${row.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-[#b20112]'}`}>
                        {row.is_active ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-xs font-bold">
                      {row.must_change_password ? <span className="text-[#b20112]">Cần đổi</span> : <span className="text-emerald-600">Đã đổi</span>}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditModal(row)} className="p-3 transition-all rounded-xl bg-slate-50 hover:bg-slate-900 hover:text-white" title="Chỉnh sửa">
                          <span className="text-lg material-symbols-outlined">edit</span>
                        </button>
                        <button onClick={() => handleToggleStatus(row)} className="p-3 rounded-xl bg-slate-50 hover:bg-[#b20112] hover:text-white transition-all" title={row.is_active ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}>
                          <span className="text-lg material-symbols-outlined">{row.is_active ? 'block' : 'lock_open'}</span>
                        </button>
                        <button onClick={() => setDeleteTarget(row)} className="p-3 text-red-600 transition-all rounded-xl bg-slate-50 hover:bg-red-500 hover:text-white" title="Xóa tài khoản">
                          <span className="text-lg material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[2.5rem] bg-white shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between gap-4 p-8 border-b border-slate-100 bg-slate-50/50">
              <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-900">{modalMode === 'create' ? 'Tạo tài khoản mới' : 'Chỉnh sửa tài khoản'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-500">X</button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="p-8 space-y-4">
                {formError && <div className="p-4 bg-red-50 text-[#b20112] border border-red-100 rounded-xl text-xs font-bold">{formError}</div>}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                    className="w-full px-4 py-3 border rounded-xl border-slate-200"
                    placeholder="Họ và tên"
                  />
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                    className="w-full px-4 py-3 border rounded-xl border-slate-200"
                    placeholder="Username"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <select
                    value={formData.roleCode}
                    onChange={(e) => setFormData((prev) => ({ ...prev, roleCode: e.target.value as 'student' | 'teacher' }))}
                    className="w-full px-4 py-3 bg-white border rounded-xl border-slate-200"
                    disabled={modalMode === 'edit'}
                  >
                    <option value="student">Học sinh</option>
                    <option value="teacher">Giáo viên</option>
                  </select>
                  {modalMode === 'edit' && (
                    <select
                      value={formData.isActive ? 'active' : 'inactive'}
                      onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.value === 'active' }))}
                      className="w-full px-4 py-3 bg-white border rounded-xl border-slate-200"
                    >
                      <option value="active">Hoạt động</option>
                      <option value="inactive">Đã khóa</option>
                    </select>
                  )}
                </div>

                {modalMode === 'create' && formData.roleCode === 'student' && (
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, classId: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border rounded-xl border-slate-200"
                  >
                    <option value="">-- Chọn lớp học (tùy chọn) --</option>
                    {classes.map((c) => (
                      <option key={c.class_id} value={String(c.class_id)}>{c.class_name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 px-8 py-6 border-t border-slate-100 bg-slate-50/40">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-3 text-sm font-bold border rounded-xl border-slate-200 text-slate-600">Hủy</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-3 rounded-xl bg-[#b20112] text-white text-sm font-black uppercase tracking-widest disabled:bg-slate-400">
                  {isSubmitting ? 'Đang xử lý...' : 'Lưu tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] bg-white shadow-2xl p-6 text-center">
            <h3 className="mb-2 text-xl font-black text-slate-900">Xác nhận xóa tài khoản</h3>
            <p className="mb-6 text-sm leading-relaxed text-slate-500">Bạn có chắc chắn muốn xóa tài khoản của <strong>{deleteTarget.full_name}</strong> ({deleteTarget.username})?</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-5 py-3 text-sm font-bold border rounded-xl border-slate-200 text-slate-600">Hủy bỏ</button>
              <button onClick={handleDeleteUser} className="px-5 py-3 rounded-xl bg-[#b20112] text-white text-sm font-black">Đồng ý xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
