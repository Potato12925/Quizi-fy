import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getTeacherDocuments,
  softDeleteTeacherDocument,
  updateTeacherDocument,
  uploadTeacherDocument,
  type TeacherDocument,
} from '@/api/teacherDocumentApi';
import {
  getTeacherSubjectsWithTopics,
  getTeacherTopicsBySubject,
  type TeacherSubjectItem,
  type TeacherTopicItem,
} from '@/api/teacherTopicManagementApi';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const fmtFileSize = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
const fmtDate = (value: string) => new Date(value).toLocaleDateString('vi-VN');

export default function TeacherResourcesPage() {
  const [resources, setResources] = useState<TeacherDocument[]>([]);
  const [subjects, setSubjects] = useState<TeacherSubjectItem[]>([]);
  const [topicsBySubject, setTopicsBySubject] = useState<Record<number, TeacherTopicItem[]>>({});

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterTopic, setFilterTopic] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'upload' | 'edit'>('upload');
  const [selectedResource, setSelectedResource] = useState<TeacherDocument | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    subjectId: '',
    topicIds: [] as number[],
    description: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [modalTopics, setModalTopics] = useState<TeacherTopicItem[]>([]);
  const [isModalTopicsLoading, setIsModalTopicsLoading] = useState(false);
  const [modalTopicError, setModalTopicError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [docRes, subjectWithTopics] = await Promise.all([
        getTeacherDocuments({ page: 1, limit: 100, status: 'active' }),
        getTeacherSubjectsWithTopics(),
      ]);
      setResources(docRes.items);
      const nextSubjects = subjectWithTopics.map((subject) => ({
        subject_id: subject.subject_id,
        subject_name: subject.subject_name,
      }));
      const nextTopicsBySubject: Record<number, TeacherTopicItem[]> = {};
      for (const subject of subjectWithTopics) {
        nextTopicsBySubject[subject.subject_id] = subject.topics;
      }
      setSubjects(nextSubjects);
      setTopicsBySubject(nextTopicsBySubject);
    } catch {
      setError('Không thể tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const visibleFilterTopics = useMemo(() => {
    if (filterSubject === 'all') {
      return Object.values(topicsBySubject).flat();
    }
    return topicsBySubject[Number(filterSubject)] || [];
  }, [filterSubject, topicsBySubject]);

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      if (searchQuery && !resource.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterSubject !== 'all' && String(resource.subject_id) !== filterSubject) return false;
      if (filterTopic !== 'all' && !resource.topics.some((topic) => String(topic.topic_id) === filterTopic)) return false;
      return true;
    });
  }, [resources, searchQuery, filterSubject, filterTopic]);

  useEffect(() => {
    setFilterTopic('all');
  }, [filterSubject]);

  const loadTopicsForModalSubject = async (subjectId: number) => {
    setIsModalTopicsLoading(true);
    setModalTopicError('');
    try {
      const cached = topicsBySubject[subjectId];
      if (cached) {
        setModalTopics(cached);
        return;
      }
      const response = await getTeacherTopicsBySubject(subjectId);
      const topicItems = response.items;
      setModalTopics(topicItems);
      setTopicsBySubject((prev) => ({ ...prev, [subjectId]: topicItems }));
    } catch {
      setModalTopics([]);
      setModalTopicError('Không thể tải danh sách topic cho môn học đã chọn');
    } finally {
      setIsModalTopicsLoading(false);
    }
  };

  const handleModalSubjectChange = async (subjectIdValue: string, resetTopics: boolean) => {
    setFormData((prev) => ({
      ...prev,
      subjectId: subjectIdValue,
      topicIds: resetTopics ? [] : prev.topicIds,
    }));
    setModalTopicError('');
    if (!subjectIdValue) {
      setModalTopics([]);
      return;
    }
    await loadTopicsForModalSubject(Number(subjectIdValue));
  };

  const handleOpenUpload = () => {
    setModalMode('upload');
    setSelectedResource(null);
    setFormData({ title: '', subjectId: '', topicIds: [], description: '' });
    setSelectedFile(null);
    setModalTopics([]);
    setModalTopicError('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (resource: TeacherDocument) => {
    setModalMode('edit');
    setSelectedResource(resource);
    const subjectId = resource.subject_id ? String(resource.subject_id) : '';
    setFormData({
      title: resource.title,
      subjectId,
      topicIds: resource.topics.map((topic) => topic.topic_id),
      description: resource.description || '',
    });
    setSelectedFile(null);
    setModalTopicError('');
    setFormError('');
    setIsModalOpen(true);
    if (subjectId) {
      await loadTopicsForModalSubject(Number(subjectId));
    } else {
      setModalTopics([]);
    }
  };

  const handleDelete = async (resource: TeacherDocument) => {
    const warning = resource.question_count || resource.ai_request_count
      ? `Tài liệu "${resource.title}" đã được sử dụng tạo dữ liệu AI. Bạn vẫn muốn ẩn/xóa mềm?`
      : `Bạn có chắc chắn muốn xóa tài liệu "${resource.title}" không?`;
    if (!window.confirm(warning)) return;

    await softDeleteTeacherDocument(resource.document_id);
    setResources((prev) => prev.filter((item) => item.document_id !== resource.document_id));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extensionOk = file.name.toLowerCase().endsWith('.pdf') || file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.txt');
    if (!ALLOWED_FILE_TYPES.includes(file.type) && !extensionOk) {
      setFormError('Chỉ hỗ trợ PDF, DOCX, TXT');
      return;
    }
    if (file.size <= 0) {
      setFormError('File trống');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFormError('Dung lượng tối đa 20MB');
      return;
    }

    setFormError('');
    setSelectedFile(file);
    if (!formData.title) setFormData((prev) => ({ ...prev, title: file.name }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError('Vui lòng nhập tên tài liệu');
      return;
    }
    if (!formData.subjectId) {
      setFormError('Vui lòng chọn môn học');
      return;
    }
    if (formData.topicIds.length === 0) {
      setFormError('Vui lòng chọn ít nhất 1 topic');
      return;
    }
    if (modalMode === 'upload' && !selectedFile) {
      setFormError('Vui lòng chọn file');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (modalMode === 'upload' && selectedFile) {
        const created = await uploadTeacherDocument({
          title: formData.title,
          topic_ids: formData.topicIds,
          description: formData.description || undefined,
          file: selectedFile,
        });
        setResources((prev) => [created, ...prev]);
      } else if (selectedResource) {
        const updated = await updateTeacherDocument(selectedResource.document_id, {
          title: formData.title,
          topic_ids: formData.topicIds,
          description: formData.description || undefined,
          file: selectedFile || undefined,
        });
        setResources((prev) => prev.map((item) => (item.document_id === updated.document_id ? updated : item)));
      }
      setIsModalOpen(false);
    } catch {
      setFormError('Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && resources.length === 0) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="pb-20 space-y-12 duration-700 animate-in fade-in slide-in-from-bottom-8">
      <div className="flex flex-col items-start justify-between gap-6 pt-2 md:flex-row md:items-end">
        <div>
          <h1 className="text-5xl italic font-black leading-none tracking-tighter uppercase text-slate-900">Tài liệu <br /><span className="text-[#b20112]">Học tập</span></h1>
          <p className="mt-4 italic font-medium text-slate-500">"Kho nguyên liệu để khởi tạo tri thức AI."</p>
        </div>
        <button onClick={handleOpenUpload} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-black transition-all flex items-center gap-3">
          <span className="text-xl material-symbols-outlined">upload_file</span> Tải tài liệu mới
        </button>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <input
          type="text"
          placeholder="Tìm kiếm tài liệu..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full md:flex-1 py-3 px-4 text-xs font-bold transition-all border-none rounded-xl bg-slate-50 focus:ring-2 focus:ring-red-500/20"
        />
        <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="px-6 py-3 rounded-xl bg-slate-50 border-none text-[10px] font-black uppercase tracking-widest text-slate-500">
          <option value="all">Tất cả môn học</option>
          {subjects.map((subject) => <option key={subject.subject_id} value={String(subject.subject_id)}>{subject.subject_name}</option>)}
        </select>
        <select value={filterTopic} onChange={(e) => setFilterTopic(e.target.value)} className="px-6 py-3 rounded-xl bg-slate-50 border-none text-[10px] font-black uppercase tracking-widest text-slate-500">
          <option value="all">Tất cả topic</option>
          {visibleFilterTopics.map((topic) => <option key={topic.topic_id} value={String(topic.topic_id)}>{topic.topic_name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {filteredResources.length > 0 ? filteredResources.map((resource) => (
          <div key={resource.document_id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h4 className="mb-2 text-base font-black leading-none tracking-tight text-slate-800">{resource.title}</h4>
                <div className="flex gap-2 flex-wrap">
                  <span className="bg-slate-50 text-slate-400 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">{resource.subject?.subject_name}</span>
                  <span className="bg-slate-50 text-slate-400 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">{fmtFileSize(resource.file_size)}</span>
                  <span className="bg-slate-50 text-slate-400 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">{resource.file_type.toUpperCase()}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleOpenEdit(resource)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white flex items-center justify-center">
                  <span className="text-xl material-symbols-outlined">edit</span>
                </button>
                <button onClick={() => handleDelete(resource)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-[#b20112] hover:text-white flex items-center justify-center">
                  <span className="text-xl material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
            <div className="text-xs text-slate-500 mb-4">{resource.description || 'Không có mô tả'}</div>
            <div className="mb-4 flex flex-wrap gap-2">
              {resource.topics.map((topic) => (
                <span key={`${resource.document_id}-${topic.topic_id}`} className="bg-red-50 text-[#b20112] px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">
                  {topic.topic_name}
                </span>
              ))}
            </div>
            <div className="flex items-end justify-between pt-6 border-t border-slate-50">
              <div>
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Ngày tải lên</p>
                <p className="text-xs font-bold text-slate-600">{fmtDate(resource.created_at)}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900">{resource.question_count || 0}</p>
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Câu hỏi</p>
                </div>
                <Link to="/teacher/ai-generator" state={{ documentId: resource.document_id }} className="bg-[#b20112] text-white px-5 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-black transition-all">
                  Tạo câu hỏi
                </Link>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full border-4 border-dashed border-slate-100 rounded-[3rem] p-20 flex flex-col items-center text-center">
            <span className="mb-6 text-6xl material-symbols-outlined text-slate-100">inventory_2</span>
            <p className="text-sm font-black tracking-widest uppercase text-slate-400">Không tìm thấy tài liệu phù hợp</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isSubmitting && setIsModalOpen(false)} />
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden">
            <div className="p-10 sm:p-12">
              <h2 className="text-3xl italic font-black tracking-tighter uppercase text-slate-900 mb-8">{modalMode === 'upload' ? 'Upload' : 'Chỉnh sửa'} <span className="text-[#b20112]">Tài liệu</span></h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer border-slate-100 hover:border-[#b20112]">
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.docx,.txt" />
                  <p className="text-xs font-black tracking-widest uppercase text-slate-400">{selectedFile ? `${selectedFile.name} (${fmtFileSize(selectedFile.size)})` : 'Chọn file PDF, DOCX, TXT (max 20MB)'}</p>
                </div>

                <input type="text" value={formData.title} onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))} placeholder="Tên tài liệu" className="w-full p-4 text-xs font-bold border-none rounded-2xl bg-slate-50" />

                <select
                  value={formData.subjectId}
                  onChange={(e) => handleModalSubjectChange(e.target.value, true)}
                  className="w-full p-4 text-xs font-bold border-none rounded-2xl bg-slate-50"
                >
                  <option value="">Chọn môn học</option>
                  {subjects.map((subject) => (
                    <option key={subject.subject_id} value={String(subject.subject_id)}>
                      {subject.subject_name}
                    </option>
                  ))}
                </select>

                <div className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 min-h-28">
                  {!formData.subjectId ? (
                    <p className="text-xs font-bold text-slate-400">Vui lòng chọn môn học trước</p>
                  ) : modalTopics.length === 0 ? (
                    <p className="text-xs font-bold text-slate-400">Không có topic</p>
                  ) : (
                    <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                      {modalTopics.map((topic) => {
                        const checked = formData.topicIds.includes(topic.topic_id);
                        return (
                          <label
                            key={topic.topic_id}
                            className={`group flex items-center gap-3 text-xs font-bold rounded-xl px-3 py-2 border transition-all cursor-pointer ${
                              checked
                                ? 'border-[#b20112]/30 bg-red-50 text-[#7a0c11]'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-[#b20112]/30 hover:bg-red-50/40'
                            }`}
                          >
                            <span
                              className={`relative flex items-center justify-center w-5 h-5 rounded-md border-2 transition-all ${
                                checked ? 'border-[#b20112] bg-[#b20112]' : 'border-slate-300 bg-white group-hover:border-[#b20112]/60'
                              }`}
                            >
                              <input
                                type="checkbox"
                                disabled={!formData.subjectId || isModalTopicsLoading}
                                checked={checked}
                                onChange={(e) => {
                                  const isChecked = e.target.checked;
                                  setFormData((prev) => ({
                                    ...prev,
                                    topicIds: isChecked
                                      ? [...prev.topicIds, topic.topic_id]
                                      : prev.topicIds.filter((id) => id !== topic.topic_id),
                                  }));
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                              <span className={`material-symbols-outlined text-[13px] text-white transition-opacity ${checked ? 'opacity-100' : 'opacity-0'}`}>
                                check
                              </span>
                            </span>
                            <span className="leading-relaxed">{topic.topic_name}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
                {!formData.subjectId && <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chọn môn học để hiển thị topic</p>}
                {isModalTopicsLoading && <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đang tải topic...</p>}
                {modalTopicError && <p className="text-[10px] font-black uppercase tracking-widest text-red-500">{modalTopicError}</p>}

                <textarea rows={3} value={formData.description} onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))} placeholder="Mô tả" className="w-full p-4 text-xs font-bold border-none rounded-2xl bg-slate-50" />

                {formError && <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest">{formError}</div>}

                <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400">Hủy bỏ</button>
                  <button type="submit" disabled={isSubmitting} className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest disabled:opacity-50">
                    {isSubmitting ? 'Đang xử lý...' : modalMode === 'upload' ? 'Tải lên ngay' : 'Cập nhật'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
