import React, { useEffect, useMemo, useState } from 'react';

import ErrorState from '@/components/common/ErrorState';
import LoadingState from '@/components/common/LoadingState';
import {
  addTopicToDocument,
  getTeacherSubjectsDocumentsTopics,
  removeTopicFromDocument,
  type TeacherDocumentTopicItem,
  type TeacherSubjectDocumentTopicItem,
  type TeacherTopicItem,
  updateTeacherTopicName,
} from '@/api/teacherTopicManagementApi';

export default function TeacherSubjectsPage() {
  const [subjects, setSubjects] = useState<TeacherSubjectDocumentTopicItem[]>([]);
  const [activeSubjectId, setActiveSubjectId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedDocument, setSelectedDocument] = useState<TeacherDocumentTopicItem | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<TeacherTopicItem | null>(null);
  const [formTopicName, setFormTopicName] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<{ document: TeacherDocumentTopicItem; topic: TeacherTopicItem } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getTeacherSubjectsDocumentsTopics();
      setSubjects(data);
      setActiveSubjectId((prev) => {
        if (!data.length) {
          return null;
        }
        if (prev && data.some((subject) => subject.subject_id === prev)) {
          return prev;
        }
        return data[0].subject_id;
      });
    } catch {
      setError('Khong the tai du lieu mon hoc va tai lieu. Vui long thu lai.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeSubject = useMemo(
    () => subjects.find((subject) => subject.subject_id === activeSubjectId) || null,
    [subjects, activeSubjectId],
  );

  const totalTopics = useMemo(
    () => (activeSubject ? activeSubject.documents.reduce((sum, document) => sum + document.topics.length, 0) : 0),
    [activeSubject],
  );

  const handleOpenAddTopic = (document: TeacherDocumentTopicItem) => {
    setModalMode('create');
    setSelectedDocument(document);
    setSelectedTopic(null);
    setFormTopicName('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditTopic = (document: TeacherDocumentTopicItem, topic: TeacherTopicItem) => {
    setModalMode('edit');
    setSelectedDocument(document);
    setSelectedTopic(topic);
    setFormTopicName(topic.topic_name);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formTopicName.trim()) {
      setFormError('Vui long nhap ten topic.');
      return;
    }

    if (!selectedDocument) {
      setFormError('Khong tim thay tai lieu duoc chon.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      if (modalMode === 'create') {
        await addTopicToDocument(selectedDocument.document_id, { topic_name: formTopicName });
      } else if (selectedTopic) {
        await updateTeacherTopicName(selectedTopic.topic_id, { topic_name: formTopicName });
      }

      setIsModalOpen(false);
      await fetchData();
    } catch {
      setFormError('Khong the luu topic. Vui long thu lai.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);
    try {
      await removeTopicFromDocument(deleteTarget.document.document_id, deleteTarget.topic.topic_id);
      setDeleteTarget(null);
      await fetchData();
    } catch {
      setFormError('Khong the xoa topic khoi tai lieu.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Dang tai du lieu teacher subjects..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  if (!subjects.length) {
    return (
      <div className="pb-20 space-y-8">
        <h1 className="text-5xl italic font-black leading-none tracking-tighter uppercase text-slate-900">
          Quan ly <br />
          <span className="text-[#b20112]">topic theo tai lieu</span>
        </h1>
        <div className="border-4 border-dashed border-slate-100 rounded-[3rem] p-16 flex flex-col items-center text-center">
          <span className="mb-6 text-6xl material-symbols-outlined text-slate-100">menu_book</span>
          <p className="text-sm font-black tracking-widest uppercase text-slate-400">Chua co tai lieu nao de quan ly topic</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 space-y-12 duration-700 animate-in fade-in slide-in-from-bottom-8">
      <div className="flex flex-col items-start justify-between gap-6 pt-2 md:flex-row md:items-end">
        <div>
          <h1 className="text-5xl italic font-black leading-none tracking-tighter uppercase text-slate-900">
            Quan ly <br />
            <span className="text-[#b20112]">topic theo tai lieu</span>
          </h1>
          <p className="mt-4 font-medium text-slate-500">Theo doi cac tai lieu cua tung mon hoc va gan topic truc tiep theo document.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Mon hoc co tai lieu</h3>
          <div className="space-y-2">
            {subjects.map((subject) => (
              <button
                key={subject.subject_id}
                onClick={() => setActiveSubjectId(subject.subject_id)}
                className={`w-full p-6 rounded-3xl border-2 transition-all text-left flex justify-between items-center group ${
                  activeSubjectId === subject.subject_id
                    ? 'border-[#b20112] bg-red-50/20 shadow-lg shadow-red-900/5'
                    : 'border-slate-50 bg-white hover:border-slate-200'
                }`}
              >
                <div>
                  <p className={`text-sm font-black transition-colors ${activeSubjectId === subject.subject_id ? 'text-[#b20112]' : 'text-slate-600'}`}>
                    {subject.subject_name}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">{subject.documents.length} tai lieu</p>
                </div>
                <span
                  className={`material-symbols-outlined text-xl transition-all ${
                    activeSubjectId === subject.subject_id ? 'text-[#b20112] translate-x-1' : 'text-slate-200 opacity-0 group-hover:opacity-100'
                  }`}
                >
                  chevron_right
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6 lg:col-span-8">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Danh sach tai lieu va topic cua {activeSubject?.subject_name || 'mon hoc'}
            </h3>
            <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
              {totalTopics} topic
            </span>
          </div>

          {!activeSubject || !activeSubject.documents.length ? (
            <div className="border-4 border-dashed border-slate-100 rounded-[3rem] p-20 flex flex-col items-center text-center">
              <span className="mb-6 text-6xl material-symbols-outlined text-slate-100">description</span>
              <p className="text-sm font-black tracking-widest uppercase text-slate-400">Mon hoc nay chua co tai lieu</p>
            </div>
          ) : (
            <div className="space-y-5">
              {activeSubject.documents.map((document, index) => (
                <div key={document.document_id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-3">
                      <span className="w-8 h-8 rounded-lg bg-red-50 text-[#b20112] flex items-center justify-center text-xs font-black">{index + 1}</span>
                      <div>
                        <h4 className="text-lg font-black leading-snug tracking-tight text-slate-800">{document.title}</h4>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                          Document ID: {document.document_id}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenAddTopic(document)}
                      className="bg-[#b20112] text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-900/20 hover:bg-black transition-all disabled:opacity-50"
                      disabled={isSubmitting || isDeleting}
                    >
                      Them topic
                    </button>
                  </div>

                  {!document.topics.length ? (
                    <p className="mt-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Tai lieu nay chua co topic nao.</p>
                  ) : (
                    <div className="mt-6 flex flex-wrap gap-3">
                      {document.topics.map((topic) => (
                        <div key={`${document.document_id}-${topic.topic_id}`} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-xs font-bold text-slate-700">{topic.topic_name}</span>
                          <button
                            onClick={() => handleOpenEditTopic(document, topic)}
                            className="text-slate-400 hover:text-[#b20112] transition-colors"
                            title="Sua topic"
                          >
                            <span className="material-symbols-outlined text-base">edit</span>
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ document, topic })}
                            className="text-slate-400 hover:text-red-600 transition-colors"
                            title="Xoa topic khoi tai lieu"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl italic font-black tracking-tighter uppercase text-slate-900">
                    {modalMode === 'create' ? 'Them moi' : 'Chinh sua'} <span className="text-[#b20112]">topic</span>
                  </h2>
                  <p className="text-slate-400 text-[10px] font-black uppercase mt-1 tracking-widest">
                    Tai lieu: {selectedDocument?.title || 'N/A'}
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex items-center justify-center w-12 h-12 transition-all cursor-pointer rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100"
                  disabled={isSubmitting}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Ten topic</label>
                  <input
                    type="text"
                    placeholder="Vi du: Chuong 1: Gioi thieu"
                    value={formTopicName}
                    onChange={(event) => setFormTopicName(event.target.value)}
                    className="w-full p-4 text-xs font-bold border-none rounded-2xl bg-slate-50 focus:ring-2 focus:ring-red-500/20"
                    disabled={isSubmitting}
                  />
                </div>

                {formError && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                    <span className="text-sm material-symbols-outlined">error</span> {formError}
                  </div>
                )}

                <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
                    disabled={isSubmitting}
                  >
                    Huy bo
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-black transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Dang luu...' : 'Xac nhan luu'}
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
            <h3 className="mb-2 text-xl font-black text-slate-900">Xac nhan xoa topic khoi tai lieu</h3>
            <p className="mb-6 text-xs leading-relaxed text-slate-500">
              Ban chac chan muon xoa topic <strong>{deleteTarget.topic.topic_name}</strong> khoi tai lieu nay?
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-6 py-3 text-xs font-bold transition-all border cursor-pointer rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                disabled={isDeleting}
              >
                Huy bo
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-6 py-3 rounded-xl bg-[#b20112] text-white text-xs font-black hover:bg-red-700 transition-all disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? 'Dang xoa...' : 'Xac nhan xoa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
