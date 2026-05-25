import React, { useEffect, useState } from 'react';
import { getClasses, getSubjects, getUsers, createClass, updateClass, deleteClass, assignSubjectToClass, assignStudentToClass, removeStudentFromClass, type AdminClass, type AdminSubject, type AdminUser } from '@/api/adminApi';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<AdminClass[]>([]);
  const [subjects, setSubjects] = useState<AdminSubject[]>([]);
  const [students, setStudents] = useState<AdminUser[]>([]);
  const [teachers, setTeachers] = useState<AdminUser[]>([]);
  const [selectedClass, setSelectedClass] = useState<AdminClass | null>(null);
  
  // Right panel detail tab: 'subjects' | 'students'
  const [activeDetailTab, setActiveDetailTab] = useState<'subjects' | 'students'>('subjects');

  // Custom local state for subjects assigned to each class
  const [assignedSubjects, setAssignedSubjects] = useState<Record<string, { code: string; name: string; teacher: string }[]>>({
    'L10A1': [
      { code: 'TOAN10', name: 'Toán học 10', teacher: 'Thầy Nguyễn Văn A' },
      { code: 'VAN10', name: 'Ngữ Văn 10', teacher: 'Cô Trần Thị B' },
    ],
    'L11B2': [
      { code: 'TOAN10', name: 'Toán học 10', teacher: 'Thầy Nguyễn Văn A' },
    ]
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Create/Edit Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [classToEdit, setClassToEdit] = useState<AdminClass | null>(null);
  const [createForm, setCreateForm] = useState({
    classCode: '',
    className: '',
    description: '',
    owner: '', // References teacher's user_id
  });

  // Assign Subject Form state
  const [assignForm, setAssignForm] = useState({
    subjectCode: '',
    teacherId: '',
  });

  // Enroll Student state
  const [selectedStudentToEnroll, setSelectedStudentToEnroll] = useState('');

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<AdminClass | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const classData = await getClasses();
      const subjectData = await getSubjects();
      const userData = await getUsers();
      setClasses(classData);
      setSubjects(subjectData);
      setTeachers(userData.teachers);
      setStudents(userData.students);
      if (classData.length > 0) {
        setSelectedClass(classData[0]);
      }
      if (userData.teachers.length > 0) {
        setCreateForm(prev => ({ ...prev, owner: userData.teachers[0].id }));
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải danh sách lớp học.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setFormDataToDefault();
    setFormError('');
    setModalMode('create');
    setIsCreateModalOpen(true);
  };

  const setFormDataToDefault = () => {
    setCreateForm({
      classCode: '',
      className: '',
      description: '',
      owner: teachers.length > 0 ? teachers[0].id : '',
    });
  };

  const openEditModal = (cls: AdminClass, e: React.MouseEvent) => {
    e.stopPropagation();
    setClassToEdit(cls);
    setCreateForm({
      classCode: cls.code,
      className: cls.name,
      description: '',
      owner: cls.ownerId || (teachers.length > 0 ? teachers[0].id : ''),
    });
    setFormError('');
    setModalMode('edit');
    setIsCreateModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!createForm.classCode.trim()) return setFormError('Mã lớp học không được để trống.');
    if (!createForm.className.trim()) return setFormError('Tên lớp học không được để trống.');
    if (!createForm.owner) return setFormError('Vui lòng chọn giáo viên chủ nhiệm.');

    setIsSubmitting(true);
    try {
      const selectedTeacher = teachers.find(t => t.id === createForm.owner);
      const ownerName = selectedTeacher ? selectedTeacher.name : 'Chưa phân công';

      if (modalMode === 'create') {
        const newClass = await createClass(createForm);
        newClass.ownerId = createForm.owner;
        newClass.ownerName = ownerName;
        
        setClasses(prev => [newClass, ...prev]);
        setSelectedClass(newClass);
      } else if (modalMode === 'edit' && classToEdit) {
        const updated = await updateClass(classToEdit.id, {
          code: createForm.classCode,
          name: createForm.className,
          ownerId: createForm.owner,
          ownerName: ownerName
        });
        setClasses(prev => prev.map(c => c.id === classToEdit.id ? updated : c));
        if (selectedClass && selectedClass.id === classToEdit.id) {
          setSelectedClass(updated);
        }
      }
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Lỗi khi lưu lớp học.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (cls: AdminClass, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus = cls.status === 'Hoạt động' ? 'Tạm khóa' : 'Hoạt động';
    try {
      await updateClass(cls.id, { status: nextStatus, code: cls.code, name: cls.name });
      setClasses(prev => prev.map(c => c.id === cls.id ? { ...c, status: nextStatus } : c));
      if (selectedClass && selectedClass.id === cls.id) {
        setSelectedClass(prev => prev ? { ...prev, status: nextStatus } : null);
      }
    } catch (err) {
      alert('Lỗi cập nhật trạng thái lớp học.');
    }
  };

  const handleDeleteClass = async () => {
    if (!deleteTarget) return;
    try {
      await deleteClass(deleteTarget.id);
      setClasses(prev => prev.filter(c => c.id !== deleteTarget.id));
      if (selectedClass && selectedClass.id === deleteTarget.id) {
        setSelectedClass(classes.find(c => c.id !== deleteTarget.id) || null);
      }
      setDeleteTarget(null);
    } catch (err) {
      alert('Lỗi khi xóa lớp học.');
    }
  };

  const handleAssignSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;
    if (!assignForm.subjectCode) return alert('Vui lòng chọn môn học.');
    if (!assignForm.teacherId) return alert('Vui lòng chọn giáo viên.');

    try {
      const subObj = subjects.find(s => s.code === assignForm.subjectCode);
      const teacherObj = teachers.find(t => t.id === assignForm.teacherId);
      
      if (!subObj || !teacherObj) return alert('Không tìm thấy thông tin môn học hoặc giáo viên.');

      await assignSubjectToClass(selectedClass.id, assignForm.subjectCode, teacherObj.name);
      
      const newAssignment = {
        code: assignForm.subjectCode,
        name: subObj.name,
        teacher: teacherObj.name,
      };

      const classCode = selectedClass.code;
      setAssignedSubjects(prev => ({
        ...prev,
        [classCode]: [...(prev[classCode] || []), newAssignment]
      }));

      alert(`Đã gán thành công môn học ${newAssignment.name} cho giáo viên ${teacherObj.name} ở lớp ${selectedClass.name}`);
      setAssignForm({ subjectCode: '', teacherId: '' });
    } catch (err) {
      alert('Lỗi khi gán môn học vào lớp.');
    }
  };

  // Enroll student into class
  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !selectedStudentToEnroll) return;

    try {
      await assignStudentToClass(selectedClass.id, selectedStudentToEnroll);
      
      // Update student local classId
      setStudents(prev => prev.map(s => s.id === selectedStudentToEnroll ? { ...s, classId: selectedClass.id, className: selectedClass.name } : s));
      
      // Update class student count in classes list
      setClasses(prev => prev.map(c => c.id === selectedClass.id ? { ...c, students: c.students + 1 } : c));
      setSelectedClass(prev => prev ? { ...prev, students: prev.students + 1 } : null);

      setSelectedStudentToEnroll('');
      alert('Đã thêm học sinh vào lớp thành công.');
    } catch (err) {
      alert('Lỗi khi thêm học sinh vào lớp.');
    }
  };

  // Remove student from class
  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedClass) return;
    if (!window.confirm('Bạn có chắc muốn gỡ học sinh này ra khỏi lớp?')) return;

    try {
      await removeStudentFromClass(selectedClass.id, studentId);

      // Reset student classId
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, classId: undefined, className: undefined } : s));
      
      // Decrease class students count
      setClasses(prev => prev.map(c => c.id === selectedClass.id ? { ...c, students: c.students - 1 } : c));
      setSelectedClass(prev => prev ? { ...prev, students: prev.students - 1 } : null);

      alert('Đã gỡ học sinh ra khỏi lớp.');
    } catch (err) {
      alert('Lỗi khi gỡ học sinh khỏi lớp.');
    }
  };

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
        <ErrorState title="Lỗi tải lớp học" message={error} onRetry={fetchData} />
      </div>
    );
  }

  // Filter classes based on query
  const filteredClasses = classes.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get subjects assigned to selected class
  const selectedClassSubjects = selectedClass ? (assignedSubjects[selectedClass.code] || []) : [];

  // Get students in selected class
  const enrolledStudents = selectedClass ? students.filter(s => s.classId === selectedClass.id) : [];

  // Get classless students (students without a class)
  const classlessStudents = students.filter(s => !s.classId);

  return (
    <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 pt-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Quản lý lớp học</p>
          <h1 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter uppercase italic leading-[0.9]">
            Lớp học <br />
            <span className="text-[#b20112]">Chủ nhiệm và môn học</span>
          </h1>
          <p className="text-slate-500 mt-4 max-w-2xl font-medium italic">
            Giao diện cấu hình lớp niên chế học sinh THPT, phân công giáo viên chủ nhiệm và môn giảng dạy.
          </p>
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
          { label: 'Tổng số lớp', value: classes.length.toString(), icon: 'class' },
          { label: 'Lớp đang hoạt động', value: classes.filter(c => c.status === 'Hoạt động').length.toString(), icon: 'check_circle' },
          { label: 'Lớp tạm khóa', value: classes.filter(c => c.status === 'Tạm khóa').length.toString(), icon: 'pause_circle' },
        ].map((item, index) => (
          <div
            key={item.label}
            className={`rounded-[2.5rem] p-7 border shadow-sm relative overflow-hidden ${
              index === 0 ? 'bg-white border-slate-100 text-slate-800' : 
              index === 1 ? 'bg-[#b20112] text-white border-transparent shadow-red-900/20' : 
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

      <section className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.95fr] gap-6">
        {/* LEFT COLUMN: CLASSES TABLE */}
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Danh sách lớp học</h2>
              <p className="text-sm text-slate-500 mt-1">Chọn lớp học để cấu hình chi tiết phân công môn học ở khung bên phải.</p>
            </div>
            <div className="flex gap-3 items-center">
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
          </div>

          <div className="overflow-x-auto">
            {filteredClasses.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-medium italic">Không tìm thấy lớp học nào.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-50 bg-slate-50/50">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Lớp học</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Giáo viên chủ nhiệm</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Sĩ số</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Môn học</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Trạng thái</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredClasses.map((row) => {
                    const isSelected = selectedClass && selectedClass.id === row.id;
                    const classSubsCount = (assignedSubjects[row.code] || []).length;
                    return (
                      <tr 
                        key={row.id + row.code} 
                        className={`hover:bg-slate-50/40 transition-colors cursor-pointer ${isSelected ? 'bg-red-50/30' : ''}`} 
                        onClick={() => setSelectedClass(row)}
                      >
                        <td className="px-8 py-6">
                          <p className="text-sm font-black text-slate-900">{row.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{row.code}</p>
                        </td>
                        <td className="px-6 py-6 text-sm font-semibold text-slate-700">{row.ownerName}</td>
                        <td className="px-6 py-6 text-center text-sm font-black text-slate-900">{row.students} học sinh</td>
                        <td className="px-6 py-6 text-center text-sm font-black text-[#b20112]">{classSubsCount} môn</td>
                        <td className="px-6 py-6">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                            row.status === 'Hoạt động' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-[#b20112]'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                            <button 
                              onClick={(e) => openEditModal(row, e)}
                              className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all cursor-pointer flex items-center justify-center"
                            >
                              <span className="material-symbols-outlined text-xl">edit</span>
                            </button>
                            <button 
                              onClick={(e) => handleToggleStatus(row, e)}
                              className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-[#b20112] hover:text-white transition-all cursor-pointer flex items-center justify-center"
                              title={row.status === 'Hoạt động' ? 'Tạm khóa lớp' : 'Mở khóa lớp'}
                            >
                              <span className="material-symbols-outlined text-xl">{row.status === 'Hoạt động' ? 'block' : 'lock_open'}</span>
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}
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
        </div>

        {/* RIGHT COLUMN: DETAILS AND ASSIGNMENTS PANEL */}
        <aside className="space-y-6">
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-8 flex flex-col min-h-[500px]">
            {selectedClass ? (
              <>
                <div className="mb-6">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chi tiết lớp học</span>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight mt-1">{selectedClass.name}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    GV Chủ nhiệm: <strong className="text-slate-800">{selectedClass.ownerName}</strong>
                  </p>
                </div>

                {/* TABS SELECTOR */}
                <div className="flex bg-slate-100 rounded-2xl p-1 mb-6">
                  <button
                    onClick={() => setActiveDetailTab('subjects')}
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                      activeDetailTab === 'subjects' ? 'bg-[#b20112] text-white shadow-md' : 'text-slate-500'
                    }`}
                  >
                    Môn học
                  </button>
                  <button
                    onClick={() => setActiveDetailTab('students')}
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                      activeDetailTab === 'students' ? 'bg-[#b20112] text-white shadow-md' : 'text-slate-500'
                    }`}
                  >
                    Học sinh ({enrolledStudents.length})
                  </button>
                </div>

                {/* TAB 1: SUBJECTS */}
                {activeDetailTab === 'subjects' ? (
                  <div className="space-y-6 flex-1 flex flex-col justify-between">
                    <div className="space-y-4 overflow-y-auto max-h-[300px]">
                      {selectedClassSubjects.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 font-medium italic border border-dashed border-slate-100 rounded-2xl">
                          Chưa gán môn học nào.
                        </div>
                      ) : (
                        selectedClassSubjects.map((subject) => (
                          <div key={subject.code} className="rounded-2xl bg-slate-50 px-5 py-4 border border-slate-100">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-sm font-black text-slate-900">{subject.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subject.code}</p>
                              </div>
                              <span className="px-3 py-1 rounded-full text-[9px] font-black bg-white border border-slate-100 text-slate-600">
                                {subject.teacher}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Quick Subject Assign form */}
                    <div className="border-t border-slate-50 pt-6 mt-6">
                      <p className="text-[9px] font-black uppercase tracking-widest text-[#b20112] mb-3">Phân công môn giảng dạy</p>
                      <form onSubmit={handleAssignSubject} className="space-y-3">
                        <select 
                          required
                          value={assignForm.subjectCode}
                          onChange={(e) => setAssignForm(prev => ({ ...prev, subjectCode: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs outline-none bg-white"
                        >
                          <option value="">-- Chọn môn học --</option>
                          {subjects.map(s => (
                            <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                          ))}
                        </select>
                        <select 
                          required
                          value={assignForm.teacherId}
                          onChange={(e) => setAssignForm(prev => ({ ...prev, teacherId: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs outline-none bg-white"
                        >
                          <option value="">-- Chọn giáo viên phụ trách --</option>
                          {teachers.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                        <button type="submit" className="w-full py-3 bg-[#b20112] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-700 transition-colors cursor-pointer">
                          Xác nhận gán môn
                        </button>
                      </form>
                    </div>
                  </div>
                ) : (
                  // TAB 2: STUDENTS
                  <div className="space-y-6 flex-1 flex flex-col justify-between">
                    <div className="space-y-3 overflow-y-auto max-h-[300px] flex-1">
                      {enrolledStudents.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 font-medium italic border border-dashed border-slate-100 rounded-2xl">
                          Lớp học hiện chưa có học sinh nào.
                        </div>
                      ) : (
                        enrolledStudents.map((st) => (
                          <div key={st.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-5 py-4 border border-slate-100">
                            <div>
                              <p className="text-sm font-black text-slate-900">{st.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{st.code || 'HSxxxxx'}</p>
                            </div>
                            <button 
                              onClick={() => handleRemoveStudent(st.id)}
                              className="w-8 h-8 rounded-lg bg-white border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-100 transition-all cursor-pointer flex items-center justify-center"
                              title="Gỡ học sinh ra khỏi lớp"
                            >
                              <span className="material-symbols-outlined text-base">close</span>
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Quick Student Enroll form */}
                    <div className="border-t border-slate-50 pt-6 mt-6">
                      <p className="text-[9px] font-black uppercase tracking-widest text-[#b20112] mb-3">Xếp học sinh mới vào lớp</p>
                      <form onSubmit={handleEnrollStudent} className="flex gap-2">
                        <select 
                          required
                          value={selectedStudentToEnroll}
                          onChange={(e) => setSelectedStudentToEnroll(e.target.value)}
                          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-xs outline-none bg-white"
                        >
                          <option value="">-- Chọn học sinh --</option>
                          {classlessStudents.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.code || s.email.split('@')[0]})</option>
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
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 text-slate-400 font-medium italic">
                <span className="material-symbols-outlined text-4xl mb-2">click_to_shrink</span>
                Hãy chọn một lớp học để xem chi tiết.
              </div>
            )}
          </div>
        </aside>
      </section>

      {/* CREATE / EDIT CLASS MODAL */}
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

            <form onSubmit={handleFormSubmit}>
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
                      value={createForm.classCode}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, classCode: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-red-100"
                      placeholder="VD: 10A1"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Tên lớp học</label>
                    <input
                      required
                      value={createForm.className}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, className: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-red-100"
                      placeholder="VD: Lớp 10A1"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Mô tả lớp</label>
                    <textarea
                      value={createForm.description}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                      className="w-full min-h-28 px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-red-100 resize-none"
                      placeholder="Mô tả định hướng khối học, danh sách ban cán sự..."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[2rem] bg-slate-50 border border-slate-100 p-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Giáo viên chủ nhiệm</p>
                    <select
                      value={createForm.owner}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, owner: e.target.value }))}
                      className="mt-4 w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-red-100 bg-white font-bold"
                    >
                      <option value="">-- Chọn giáo viên --</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
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

      {/* DELETE CLASS CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center px-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-[2rem] bg-white shadow-2xl p-6 text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-50 text-[#b20112] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">warning</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Xác nhận xóa lớp học</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Bạn có chắc chắn muốn xóa lớp học <strong>{deleteTarget.name}</strong> ({deleteTarget.code})? Hành động này sẽ gỡ bỏ dữ liệu liên kết học sinh và phân công môn học trong DB.
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