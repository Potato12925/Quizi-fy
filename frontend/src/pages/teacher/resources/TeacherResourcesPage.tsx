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
  classId: '',
  classSubjectId: '',
  topicIds: [],
  description: '',
};

const normalizeTeacherSubject = (subject: TeacherSubjectItem): TeacherSubjectItem => ({
  subject_id: subject.subject_id,
  subject_name: subject.subject_name,
  subject_code: subject.subject_code ?? null,
  class_subject_id: subject.class_subject_id,
  class_id: subject.class_id ?? null,
  class_code: subject.class_code ?? null,
  class_name: subject.class_name ?? null,
  assigned_teacher_id: subject.assigned_teacher_id ?? null,
});

const dedupeTopics = (topics: TeacherTopicItem[]) => {
  const seen = new Set<number>();
  return topics.filter((topic) => {
    if (seen.has(topic.topic_id)) return false;
    seen.add(topic.topic_id);
    return true;
  });
};

const getDocumentTopicClassSubjectIds = (resource: TeacherDocument) =>
  Array.from(
    new Set(
      resource.topics
        .map((topic) => topic.class_subject_id ?? resource.class_subject_id ?? null)
        .filter((value): value is number => typeof value === 'number'),
    ),
  );

const getDocumentTopicClassIds = (resource: TeacherDocument) =>
  Array.from(
    new Set(
      resource.topics
        .map((topic) => topic.class_id ?? resource.class_id ?? null)
        .filter((value): value is number => typeof value === 'number'),
    ),
  );

export default function TeacherResourcesPage() {
  const [resources, setResources] = useState<TeacherDocument[]>([]);
  const [subjects, setSubjects] = useState<TeacherSubjectItem[]>([]);
  const [topicsByClassSubject, setTopicsByClassSubject] = useState<Record<number, TeacherTopicItem[]>>(
    {},
  );

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [filterClassSubject, setFilterClassSubject] = useState('all');
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

      const nextSubjects = subjectWithTopics.map(normalizeTeacherSubject);
      const nextTopicsByClassSubject: Record<number, TeacherTopicItem[]> = {};

      for (const subject of subjectWithTopics) {
        if (!subject.class_subject_id) continue;
        nextTopicsByClassSubject[subject.class_subject_id] = dedupeTopics(subject.topics);
      }

      setResources(docRes.items);
      setSubjects(nextSubjects);
      setTopicsByClassSubject(nextTopicsByClassSubject);
    } catch {
      setError('Khong the tai du lieu');
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

  const classOptions = useMemo(() => {
    const seen = new Set<number>();
    return subjects.filter((subject) => {
      const classId = subject.class_id;
      if (!classId || seen.has(classId)) return false;
      seen.add(classId);
      return true;
    });
  }, [subjects]);

  const visibleSubjectOptions = useMemo(() => {
    if (filterClass === 'all') return subjects;
    return subjects.filter((subject) => String(subject.class_id) === filterClass);
  }, [filterClass, subjects]);

  const visibleFilterTopics = useMemo(() => {
    if (filterClassSubject !== 'all') {
      return topicsByClassSubject[Number(filterClassSubject)] || [];
    }

    return dedupeTopics(
      visibleSubjectOptions.flatMap((subject) =>
        subject.class_subject_id ? topicsByClassSubject[subject.class_subject_id] || [] : [],
      ),
    );
  }, [filterClassSubject, topicsByClassSubject, visibleSubjectOptions]);

  const modalSubjectOptions = useMemo(() => {
    if (!formData.classId) return [];
    return subjects.filter((subject) => String(subject.class_id) === formData.classId);
  }, [formData.classId, subjects]);

  const filteredResources = useMemo(
    () =>
      resources.filter((resource) => {
        if (
          searchQuery
          && !resource.title.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          return false;
        }

        if (
          filterClass !== 'all'
          && !getDocumentTopicClassIds(resource).some((classId) => String(classId) === filterClass)
        ) {
          return false;
        }

        if (
          filterClassSubject !== 'all'
          && !getDocumentTopicClassSubjectIds(resource).some(
            (classSubjectId) => String(classSubjectId) === filterClassSubject,
          )
        ) {
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
    [filterClass, filterClassSubject, filterTopic, resources, searchQuery],
  );

  const closeModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setSelectedResource(null);
    setSelectedFile(null);
    setFormError('');
    setModalTopicError('');
    setModalTopics([]);
    setFormData(initialFormState);
  };

  const loadTopicsForModalClassSubject = async (classSubjectId: number) => {
    setIsModalTopicsLoading(true);
    setModalTopicError('');
    try {
      const cached = topicsByClassSubject[classSubjectId];
      setModalTopics(cached || []);
    } catch {
      setModalTopics([]);
      setModalTopicError('Khong the tai danh sach topic cho mon hoc da chon');
    } finally {
      setIsModalTopicsLoading(false);
    }
  };

  const handleModalClassChange = (classIdValue: string) => {
    setFormData((prev) => ({
      ...prev,
      classId: classIdValue,
      classSubjectId: '',
      topicIds: [],
    }));
    setModalTopicError('');
    setModalTopics([]);
  };

  const handleModalClassSubjectChange = async (classSubjectIdValue: string) => {
    setFormData((prev) => ({
      ...prev,
      classSubjectId: classSubjectIdValue,
      topicIds: [],
    }));
    setModalTopicError('');
    if (!classSubjectIdValue) {
      setModalTopics([]);
      return;
    }
    await loadTopicsForModalClassSubject(Number(classSubjectIdValue));
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
    const documentClassSubjectIds = getDocumentTopicClassSubjectIds(resource);
    if (documentClassSubjectIds.length > 1) {
      setModalMode('edit');
      setSelectedResource(resource);
      setFormData(initialFormState);
      setSelectedFile(null);
      setModalTopics([]);
      setModalTopicError('');
      setFormError('Tai lieu nay dang gan voi nhieu lop-mon. Vui long chuan hoa topic truoc khi chinh sua.');
      setIsModalOpen(true);
      return;
    }

    const firstTopic = resource.topics[0];
    const classSubjectId =
      firstTopic?.class_subject_id ?? resource.class_subject_id ?? null;
    const classId = firstTopic?.class_id ?? resource.class_id ?? null;

    setModalMode('edit');
    setSelectedResource(resource);
    setFormData({
      title: resource.title,
      classId: classId ? String(classId) : '',
      classSubjectId: classSubjectId ? String(classSubjectId) : '',
      topicIds: resource.topics.map((topic) => topic.topic_id),
      description: resource.description || '',
    });
    setSelectedFile(null);
    setModalTopicError('');
    setFormError('');
    setIsModalOpen(true);

    if (classSubjectId) {
      await loadTopicsForModalClassSubject(classSubjectId);
      return;
    }

    setModalTopics([]);
    setFormError('Khong the xac dinh lop-mon cua tai lieu nay.');
  };

  const handleDelete = async (resource: TeacherDocument) => {
    const warning =
      resource.question_count || resource.ai_request_count
        ? `Tai lieu "${resource.title}" da duoc su dung tao du lieu AI. Ban van muon an/xoa mem?`
        : `Ban co chac chan muon xoa tai lieu "${resource.title}" khong?`;
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
      setFormError('Chi ho tro PDF, DOCX, TXT');
      return;
    }
    if (file.size <= 0) {
      setFormError('File trong');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFormError('Dung luong toi da 20MB');
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
      setFormError('Vui long nhap ten tai lieu');
      return;
    }
    if (!formData.classId) {
      setFormError('Vui long chon lop');
      return;
    }
    if (!formData.classSubjectId) {
      setFormError('Vui long chon mon hoc');
      return;
    }
    if (formData.topicIds.length === 0) {
      setFormError('Vui long chon it nhat 1 topic');
      return;
    }

    const allowedTopicIds = new Set(
      (topicsByClassSubject[Number(formData.classSubjectId)] || []).map((topic) => topic.topic_id),
    );
    if (formData.topicIds.some((topicId) => !allowedTopicIds.has(topicId))) {
      setFormError('Topic da chon khong thuoc lop-mon hien tai');
      return;
    }

    if (modalMode === 'upload' && !selectedFile) {
      setFormError('Vui long chon file');
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
      setSelectedResource(null);
      setSelectedFile(null);
      setFormError('');
      setModalTopicError('');
      setModalTopics([]);
      setFormData(initialFormState);
    } catch {
      setFormError('Da xay ra loi. Vui long thu lai.');
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
            Tai lieu <br />
            <span className="text-[#b20112]">Hoc tap</span>
          </h1>
          <p className="mt-4 italic font-medium text-slate-500">
            "Kho nguyen lieu de khoi tao tri thuc AI."
          </p>
        </div>
        <button
          onClick={handleOpenUpload}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-black transition-all flex items-center gap-3"
        >
          <span className="text-xl material-symbols-outlined">upload_file</span>
          Tai tai lieu moi
        </button>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <input
          type="text"
          placeholder="Tim kiem tai lieu..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="w-full px-4 py-3 text-xs font-bold transition-all border-none md:flex-1 rounded-xl bg-slate-50 focus:ring-2 focus:ring-red-500/20"
        />
        <select
          value={filterClass}
          onChange={(event) => {
            setFilterClass(event.target.value);
            setFilterClassSubject('all');
            setFilterTopic('all');
          }}
          className="px-6 py-3 rounded-xl bg-slate-50 border-none text-[10px] font-black uppercase tracking-widest text-slate-500"
        >
          <option value="all">Tat ca lop</option>
          {classOptions.map((classOption) => (
            <option
              key={classOption.class_id ?? classOption.class_subject_id ?? classOption.subject_id}
              value={String(classOption.class_id ?? '')}
            >
              {classOption.class_code || classOption.class_name || `Lop ${classOption.class_id}`}
            </option>
          ))}
        </select>
        <select
          value={filterClassSubject}
          onChange={(event) => {
            setFilterClassSubject(event.target.value);
            setFilterTopic('all');
          }}
          className="px-6 py-3 rounded-xl bg-slate-50 border-none text-[10px] font-black uppercase tracking-widest text-slate-500"
        >
          <option value="all">Tat ca mon hoc</option>
          {visibleSubjectOptions.map((subject) => (
            <option
              key={subject.class_subject_id ?? `${subject.class_id}-${subject.subject_id}`}
              value={String(subject.class_subject_id ?? '')}
            >
              {[subject.class_code, subject.subject_code, subject.subject_name]
                .filter(Boolean)
                .join(' - ')}
            </option>
          ))}
        </select>
        <select
          value={filterTopic}
          onChange={(event) => setFilterTopic(event.target.value)}
          className="px-6 py-3 rounded-xl bg-slate-50 border-none text-[10px] font-black uppercase tracking-widest text-slate-500"
        >
          <option value="all">Tat ca topic</option>
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
              Khong tim thay tai lieu phu hop
            </p>
          </div>
        )}
      </div>

      <ResourceFormModal
        fileInputRef={fileInputRef}
        classOptions={classOptions}
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
        subjects={modalSubjectOptions}
        onClose={closeModal}
        onDescriptionChange={(value) =>
          setFormData((prev) => ({ ...prev, description: value }))
        }
        onClassChange={handleModalClassChange}
        onClassSubjectChange={handleModalClassSubjectChange}
        onFileChange={handleFileChange}
        onOpenFilePicker={() => fileInputRef.current?.click()}
        onSubmit={handleSubmit}
        onTitleChange={(value) => setFormData((prev) => ({ ...prev, title: value }))}
        onTopicToggle={handleTopicToggle}
      />
    </div>
  );
}
