import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getTeacherDocuments,
  softDeleteTeacherDocument,
  updateTeacherDocument,
  uploadTeacherDocument,
  type TeacherDocument,
} from '@/api/teacherDocumentApi';
import {
  getTeacherSubjectsWithTopics,
  type TeacherSubjectItem,
  type TeacherTopicItem,
} from '@/api/teacherTopicManagementApi';
import ErrorState from '@/components/common/ErrorState';
import LoadingState from '@/components/common/LoadingState';
import ResourceCard from './components/ResourceCard';
import ResourceFormModal from './components/ResourceFormModal';
import type { ResourceFormState, ResourceModalMode } from './types';

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const initialFormState: ResourceFormState = {
  title: '',
  subjectId: '',
  topicIds: [],
  description: '',
};

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
  const [modalMode, setModalMode] = useState<ResourceModalMode>('upload');
  const [selectedResource, setSelectedResource] = useState<TeacherDocument | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState<ResourceFormState>(initialFormState);
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
      setSubjects(
        subjectWithTopics.map((subject) => ({
          subject_id: subject.subject_id,
          subject_name: subject.subject_name,
        })),
      );

      const nextTopicsBySubject: Record<number, TeacherTopicItem[]> = {};
      for (const subject of subjectWithTopics) {
        nextTopicsBySubject[subject.subject_id] = subject.topics;
      }
      setTopicsBySubject(nextTopicsBySubject);
    } catch {
      setError('Không thể tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchData().catch(() => undefined);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const visibleFilterTopics = useMemo(() => {
    if (filterSubject === 'all') {
      return Object.values(topicsBySubject).flat();
    }
    return topicsBySubject[Number(filterSubject)] || [];
  }, [filterSubject, topicsBySubject]);

  const filteredResources = useMemo(
    () =>
      resources.filter((resource) => {
        if (
          searchQuery
          && !resource.title.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          return false;
        }
        if (filterSubject !== 'all' && String(resource.subject_id) !== filterSubject) {
          return false;
        }
        if (
          filterTopic !== 'all'
          && !resource.topics.some((topic) => String(topic.topic_id) === filterTopic)
        ) {
          return false;
        }
        return true;
      }),
    [filterSubject, filterTopic, resources, searchQuery],
  );

  const closeModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setSelectedFile(null);
    setFormError('');
    setModalTopicError('');
  };

  const loadTopicsForModalSubject = async (subjectId: number) => {
    setIsModalTopicsLoading(true);
    setModalTopicError('');
    try {
      const cached = topicsBySubject[subjectId];
      if (cached) {
        setModalTopics(cached);
        return;
      }
      setModalTopics([]);
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
    setFormData(initialFormState);
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
      return;
    }
    setModalTopics([]);
  };

  const handleDelete = async (resource: TeacherDocument) => {
    const warning =
      resource.question_count || resource.ai_request_count
        ? `Tài liệu "${resource.title}" đã được sử dụng tạo dữ liệu AI. Bạn vẫn muốn ẩn/xóa mềm?`
        : `Bạn có chắc chắn muốn xóa tài liệu "${resource.title}" không?`;
    if (!window.confirm(warning)) return;

    await softDeleteTeacherDocument(resource.document_id);
    setResources((prev) => prev.filter((item) => item.document_id !== resource.document_id));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    const extensionOk =
      lowerName.endsWith('.pdf') || lowerName.endsWith('.docx') || lowerName.endsWith('.txt');

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
    if (!formData.title) {
      setFormData((prev) => ({ ...prev, title: file.name }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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
        setResources((prev) =>
          prev.map((item) => (item.document_id === updated.document_id ? updated : item)),
        );
      }

      setIsModalOpen(false);
      setSelectedFile(null);
    } catch {
      setFormError('Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTopicToggle = (topicId: number, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      topicIds: checked
        ? [...prev.topicIds, topicId]
        : prev.topicIds.filter((id) => id !== topicId),
    }));
  };

  if (isLoading && resources.length === 0) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="pb-20 space-y-12 duration-700 animate-in fade-in slide-in-from-bottom-8">
      <div className="flex flex-col items-start justify-between gap-6 pt-2 md:flex-row md:items-end">
        <div>
          <h1 className="text-5xl italic font-black leading-none tracking-tighter uppercase text-slate-900">
            Tài liệu <br />
            <span className="text-[#b20112]">Học tập</span>
          </h1>
          <p className="mt-4 italic font-medium text-slate-500">
            "Kho nguyên liệu để khởi tạo tri thức AI."
          </p>
        </div>
        <button
          onClick={handleOpenUpload}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-black transition-all flex items-center gap-3"
        >
          <span className="text-xl material-symbols-outlined">upload_file</span>
          Tải tài liệu mới
        </button>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <input
          type="text"
          placeholder="Tìm kiếm tài liệu..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="w-full px-4 py-3 text-xs font-bold transition-all border-none md:flex-1 rounded-xl bg-slate-50 focus:ring-2 focus:ring-red-500/20"
        />
        <select
          value={filterSubject}
          onChange={(event) => {
            setFilterSubject(event.target.value);
            setFilterTopic('all');
          }}
          className="px-6 py-3 rounded-xl bg-slate-50 border-none text-[10px] font-black uppercase tracking-widest text-slate-500"
        >
          <option value="all">Tất cả môn học</option>
          {subjects.map((subject) => (
            <option key={subject.subject_id} value={String(subject.subject_id)}>
              {subject.subject_name}
            </option>
          ))}
        </select>
        <select
          value={filterTopic}
          onChange={(event) => setFilterTopic(event.target.value)}
          className="px-6 py-3 rounded-xl bg-slate-50 border-none text-[10px] font-black uppercase tracking-widest text-slate-500"
        >
          <option value="all">Tất cả topic</option>
          {visibleFilterTopics.map((topic) => (
            <option key={topic.topic_id} value={String(topic.topic_id)}>
              {topic.topic_name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {filteredResources.length > 0 ? (
          filteredResources.map((resource) => (
            <ResourceCard
              key={resource.document_id}
              resource={resource}
              onDelete={handleDelete}
              onEdit={handleOpenEdit}
            />
          ))
        ) : (
          <div className="col-span-full border-4 border-dashed border-slate-100 rounded-[3rem] p-20 flex flex-col items-center text-center">
            <span className="mb-6 text-6xl material-symbols-outlined text-slate-100">
              inventory_2
            </span>
            <p className="text-sm font-black tracking-widest uppercase text-slate-400">
              Không tìm thấy tài liệu phù hợp
            </p>
          </div>
        )}
      </div>

      <ResourceFormModal
        fileInputRef={fileInputRef}
        formData={formData}
        formError={formError}
        isModalOpen={isModalOpen}
        isModalTopicsLoading={isModalTopicsLoading}
        isSubmitting={isSubmitting}
        modalMode={modalMode}
        modalTopicError={modalTopicError}
        modalTopics={modalTopics}
        resource={selectedResource}
        selectedFile={selectedFile}
        subjects={subjects}
        onClose={closeModal}
        onDescriptionChange={(value) =>
          setFormData((prev) => ({ ...prev, description: value }))
        }
        onFileChange={handleFileChange}
        onOpenFilePicker={() => fileInputRef.current?.click()}
        onSubjectChange={handleModalSubjectChange}
        onSubmit={handleSubmit}
        onTitleChange={(value) => setFormData((prev) => ({ ...prev, title: value }))}
        onTopicToggle={handleTopicToggle}
      />
    </div>
  );
}
