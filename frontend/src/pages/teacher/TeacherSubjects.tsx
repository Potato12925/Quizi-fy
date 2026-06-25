import React, { useEffect, useMemo, useState } from 'react';

import ErrorState from '@/components/common/ErrorState';
import LoadingState from '@/components/common/LoadingState';
import {
  createTopicForTeacherSubject,
  getTeacherSubjectsWithTopics,
  softDeleteTeacherSubjectTopic,
  type SubjectWithTopicsViewModel,
  type TeacherTopicItem,
  updateTeacherSubjectTopic,
} from '@/api/teacherTopicManagementApi';

const formatSubjectAssignment = (subject: SubjectWithTopicsViewModel) => {
  const subjectLabel = subject.subject_code || subject.subject_name;
  const classLabel = subject.class_code || subject.class_name;

  if (subjectLabel && classLabel) {
    return `${subjectLabel} - ${classLabel}`;
  }

  return subject.subject_name;
};

const formatSubjectAssignmentDetail = (subject: SubjectWithTopicsViewModel) =>
  [subject.subject_name, subject.class_name].filter(Boolean).join(' | ');

export default function TeacherSubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectWithTopicsViewModel[]>([]);
  const [activeClassSubjectId, setActiveClassSubjectId] = useState<number | null>(null);
  const [selectedClassId, setSelectedClassId] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [topicName, setTopicName] = useState('');
  const [topicDescription, setTopicDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<TeacherTopicItem | null>(null);
  const [editTopicName, setEditTopicName] = useState('');
  const [editTopicDescription, setEditTopicDescription] = useState('');
  const [editError, setEditError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<TeacherTopicItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getTeacherSubjectsWithTopics();
      setSubjects(data);
      setActiveClassSubjectId((prev) => {
        if (!data.length) {
          return null;
        }
        if (prev && data.some((subject) => subject.class_subject_id === prev)) {
          return prev;
        }
        return data[0].class_subject_id;
      });
    } catch {
      setError('Không thể tải danh sách môn học và chủ đề. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const classOptions = useMemo(() => {
    const classMap = new Map<number, { class_id: number; class_code?: string | null; class_name?: string | null }>();

    for (const subject of subjects) {
      if (!subject.class_id || classMap.has(subject.class_id)) {
        continue;
      }

      classMap.set(subject.class_id, {
        class_id: subject.class_id,
        class_code: subject.class_code,
        class_name: subject.class_name,
      });
    }

    return Array.from(classMap.values());
  }, [subjects]);

  const visibleSubjects = useMemo(() => {
    if (selectedClassId === 'all') {
      return subjects;
    }

    return subjects.filter((subject) => String(subject.class_id) === selectedClassId);
  }, [selectedClassId, subjects]);

  useEffect(() => {
    if (!visibleSubjects.length) {
      setActiveClassSubjectId(null);
      return;
    }

    if (activeClassSubjectId && visibleSubjects.some((subject) => subject.class_subject_id === activeClassSubjectId)) {
      return;
    }

    setActiveClassSubjectId(visibleSubjects[0].class_subject_id);
  }, [activeClassSubjectId, visibleSubjects]);

  const activeSubject = useMemo(
    () => visibleSubjects.find((subject) => subject.class_subject_id === activeClassSubjectId) || null,
    [visibleSubjects, activeClassSubjectId],
  );

  const totalTopics = useMemo(
    () => visibleSubjects.reduce((sum, subject) => sum + subject.topics.length, 0),
    [visibleSubjects],
  );

  const handleCreateTopic = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = topicName.trim();

    if (!trimmedName) {
      setFormError('Vui lòng nhập tên chủ đề.');
      return;
    }
    if (!activeSubject) {
      setFormError('Vui lòng chọn môn học trước khi tạo chủ đề.');
      return;
    }
    if (!activeSubject.class_subject_id) {
      setFormError('Không xác định được lớp-môn cho môn này. Vui lòng liên hệ admin để kiểm tra phân công.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      await createTopicForTeacherSubject(activeSubject.class_subject_id, {
        topic_name: trimmedName,
        description: topicDescription.trim() || undefined,
      });
      setTopicName('');
      setTopicDescription('');
      await fetchData();
    } catch {
      setFormError('Không thể tạo chủ đề. Tên chủ đề có thể bị trùng hoặc bạn không có quyền.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (topic: TeacherTopicItem) => {
    setEditingTopic(topic);
    setEditTopicName(topic.topic_name);
    setEditTopicDescription(topic.description || '');
    setEditError('');
    setIsEditModalOpen(true);
  };

  const handleUpdateTopic = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingTopic) {
      return;
    }
    const trimmedName = editTopicName.trim();
    if (!trimmedName) {
      setEditError('Vui lòng nhập tên chủ đề.');
      return;
    }

    setIsSubmitting(true);
    setEditError('');
    try {
      await updateTeacherSubjectTopic(editingTopic.topic_id, {
        topic_name: trimmedName,
        description: editTopicDescription.trim() || undefined,
      });
      setIsEditModalOpen(false);
      setEditingTopic(null);
      await fetchData();
    } catch {
      setEditError('Không thể cập nhật chủ đề. Tên chủ đề có thể bị trùng hoặc bạn không có quyền.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTopic = async () => {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);
    try {
      await softDeleteTeacherSubjectTopic(deleteTarget.topic_id);
      setDeleteTarget(null);
      await fetchData();
    } catch {
      setFormError('Không thể xóa chủ đề. Vui lòng thử lại.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Đang tải dữ liệu môn học và chủ đề..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  if (!subjects.length) {
    return (
      <div className="pb-20 space-y-8">
        <h1 className="text-5xl italic font-black leading-none tracking-tighter uppercase text-slate-900">
          Quản lý <br />
          <span className="text-[#b20112]">chủ đề theo môn học</span>
        </h1>
        <div className="border-4 border-dashed border-slate-100 rounded-[3rem] p-16 flex flex-col items-center text-center">
          <span className="mb-6 text-6xl material-symbols-outlined text-slate-100">menu_book</span>
          <p className="text-sm font-black tracking-widest uppercase text-slate-400">Bạn chưa được phân công môn học nào</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 space-y-12 duration-700 animate-in fade-in slide-in-from-bottom-8">
      <div className="flex flex-col items-start justify-between gap-6 pt-2 md:flex-row md:items-end">
        <div>
          <h1 className="text-5xl italic font-black leading-none tracking-tighter uppercase text-slate-900">
            Quản lý <br />
            <span className="text-[#b20112]">chủ đề theo môn học</span>
          </h1>
          <p className="mt-4 font-medium text-slate-500">Tạo chủ đề cho từng môn học bạn đang phụ trách</p>
        </div>
        <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
          {totalTopics} chủ đề
        </span>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Môn học của bạn</h3>
            <select
              value={selectedClassId}
              onChange={(event) => setSelectedClassId(event.target.value)}
              className="px-4 py-3 rounded-2xl bg-slate-50 border-none text-[10px] font-black uppercase tracking-widest text-slate-500"
            >
              <option value="all">Tất cả lớp</option>
              {classOptions.map((item) => (
                <option key={item.class_id} value={String(item.class_id)}>
                  {item.class_code || item.class_name || `Lớp ${item.class_id}`}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            {!visibleSubjects.length ? (
              <div className="border-2 border-dashed border-slate-100 rounded-3xl p-8 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Không có môn học nào trong lớp đã chọn
                </p>
              </div>
            ) : (
              visibleSubjects.map((subject) => {
                const isActive = activeClassSubjectId === subject.class_subject_id;
                const detailText = formatSubjectAssignmentDetail(subject);

                return (
                  <button
                    key={subject.class_subject_id ?? subject.subject_id}
                    onClick={() => setActiveClassSubjectId(subject.class_subject_id)}
                    className={`w-full p-6 rounded-3xl border-2 transition-all text-left flex justify-between items-center group ${
                      isActive
                        ? 'border-[#b20112] bg-red-50/20 shadow-lg shadow-red-900/5'
                        : 'border-slate-50 bg-white hover:border-slate-200'
                    }`}
                  >
                    <div>
                      <p className={`text-sm font-black transition-colors ${isActive ? 'text-[#b20112]' : 'text-slate-600'}`}>
                        {formatSubjectAssignment(subject)}
                      </p>
                      {detailText && (
                        <p className="mt-1 text-[10px] font-bold text-slate-400">{detailText}</p>
                      )}
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">{subject.topics.length} chủ đề</p>
                    </div>
                    <span
                      className={`material-symbols-outlined text-xl transition-all ${
                        isActive ? 'text-[#b20112] translate-x-1' : 'text-slate-200 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      chevron_right
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-6 lg:col-span-8">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Chủ đề của {activeSubject ? formatSubjectAssignment(activeSubject) : 'môn học'}
          </h3>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <form onSubmit={handleCreateTopic} className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tạo chủ đề mới</label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  placeholder="Ví dụ: Chương 1: Giới thiệu"
                  value={topicName}
                  onChange={(event) => setTopicName(event.target.value)}
                  className="flex-1 p-4 text-xs font-bold border-none rounded-2xl bg-slate-50 focus:ring-2 focus:ring-red-500/20"
                  disabled={isSubmitting || !activeSubject}
                />
                <textarea
                  placeholder="Mô tả chủ đề (tùy chọn)"
                  value={topicDescription}
                  onChange={(event) => setTopicDescription(event.target.value)}
                  className="w-full p-4 text-xs font-bold border-none rounded-2xl bg-slate-50 focus:ring-2 focus:ring-red-500/20 min-h-20"
                  disabled={isSubmitting || !activeSubject}
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !activeSubject}
                  className="bg-[#b20112] text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-900/20 hover:bg-black transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang tạo...' : 'Thêm chủ đề'}
                </button>
              </div>
              {formError && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                  <span className="text-sm material-symbols-outlined">error</span> {formError}
                </div>
              )}
            </form>
          </div>

          {!activeSubject || !activeSubject.topics.length ? (
            <div className="border-4 border-dashed border-slate-100 rounded-[3rem] p-20 flex flex-col items-center text-center">
              <span className="mb-6 text-6xl material-symbols-outlined text-slate-100">topic</span>
              <p className="text-sm font-black tracking-widest uppercase text-slate-400">Môn học này chưa có chủ đề nào</p>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="flex flex-wrap gap-3">
                {activeSubject.topics.map((topic) => (
                  <div key={topic.topic_id} className="flex items-center gap-2 px-3 py-2 border rounded-xl bg-slate-50 border-slate-100">
                    <div>
                      <p className="text-xs font-bold text-slate-700">{topic.topic_name}</p>
                      {topic.description && <p className="text-[10px] font-medium text-slate-400 mt-1">{topic.description}</p>}
                    </div>
                    <button onClick={() => openEditModal(topic)} className="text-slate-400 hover:text-[#b20112] transition-colors" title="Cập nhật chủ đề">
                      <span className="text-base material-symbols-outlined">edit</span>
                    </button>
                    <button onClick={() => setDeleteTarget(topic)} className="transition-colors text-slate-400 hover:text-red-600" title="Xóa mềm chủ đề">
                      <span className="text-base material-symbols-outlined">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {isEditModalOpen && editingTopic && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl italic font-black tracking-tighter uppercase text-slate-900">
                    Cập nhật <span className="text-[#b20112]">chủ đề</span>
                  </h2>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex items-center justify-center w-12 h-12 transition-all cursor-pointer rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100"
                  disabled={isSubmitting}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleUpdateTopic} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tên chủ đề</label>
                  <input
                    type="text"
                    value={editTopicName}
                    onChange={(event) => setEditTopicName(event.target.value)}
                    className="w-full p-4 text-xs font-bold border-none rounded-2xl bg-slate-50 focus:ring-2 focus:ring-red-500/20"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Mô tả chủ đề</label>
                  <textarea
                    value={editTopicDescription}
                    onChange={(event) => setEditTopicDescription(event.target.value)}
                    className="w-full p-4 text-xs font-bold border-none rounded-2xl bg-slate-50 focus:ring-2 focus:ring-red-500/20 min-h-24"
                    disabled={isSubmitting}
                  />
                </div>

                {editError && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                    <span className="text-sm material-symbols-outlined">error</span> {editError}
                  </div>
                )}

                <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
                    disabled={isSubmitting}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-black transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Đang lưu...' : 'Xác nhận lưu'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-50 text-[#b20112] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl material-symbols-outlined">warning</span>
            </div>
            <h3 className="mb-2 text-xl font-black text-slate-900">Xác nhận xóa mềm chủ đề</h3>
            <p className="mb-6 text-xs leading-relaxed text-slate-500">
              Bạn chắc chắn muốn xóa chủ đề <strong>{deleteTarget.topic_name}</strong>?
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-6 py-3 text-xs font-bold transition-all border cursor-pointer rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                disabled={isDeleting}
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDeleteTopic}
                className="px-6 py-3 rounded-xl bg-[#b20112] text-white text-xs font-black hover:bg-red-700 transition-all disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
