import React, { useState, useEffect } from 'react';
import { getQuestionBank, getTopicsBySubject, createTopic, updateTopic, deleteTopic, type DbTopic, type BankSubject } from '@/api/teacherApi';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';

export default function TeacherSubjectsPage() {
  const [subjects, setSubjects] = useState<BankSubject[]>([]);
  const [activeSubject, setActiveSubject] = useState<string>('');
  const [topics, setTopics] = useState<DbTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTopicsLoading, setIsTopicsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedTopic, setSelectedTopic] = useState<DbTopic | null>(null);
  const [formData, setFormData] = useState({ topic_name: '', description: '' });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DbTopic | null>(null);

  // Fetch initial subjects
  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const bankData = await getQuestionBank();
      setSubjects(bankData.subjects);
      if (bankData.subjects.length > 0) {
        setActiveSubject(bankData.subjects[0].id);
      }
    } catch {
      setError('Không thể tải danh sách môn học');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch topics when active subject changes
  const fetchTopics = async () => {
    if (!activeSubject) return;
    setIsTopicsLoading(true);
    try {
      const topicsData = await getTopicsBySubject(activeSubject);
      setTopics(topicsData);
    } catch {
      console.error('Lỗi khi tải danh sách chương');
    } finally {
      setIsTopicsLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [activeSubject]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedTopic(null);
    setFormData({ topic_name: '', description: '' });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (topic: DbTopic) => {
    setModalMode('edit');
    setSelectedTopic(topic);
    setFormData({ topic_name: topic.topic_name, description: topic.description || '' });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.topic_name.trim()) {
      setFormError('Vui lòng nhập tên chương/chủ đề');
      return;
    }
    setIsSubmitting(true);
    setFormError('');
    try {
      if (modalMode === 'create') {
        const newTopic = await createTopic({
          subject_id: parseInt(activeSubject),
          topic_name: formData.topic_name,
          description: formData.description
        });
        setTopics(prev => [...prev, newTopic]);
      } else if (selectedTopic) {
        const updated = await updateTopic(selectedTopic.topic_id, {
          topic_name: formData.topic_name,
          description: formData.description
        });
        setTopics(prev => prev.map(t => t.topic_id === selectedTopic.topic_id ? updated : t));
      }
      setIsModalOpen(false);
    } catch {
      setFormError('Lỗi khi lưu thông tin. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTopic = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTopic(deleteTarget.topic_id);
      setTopics(prev => prev.filter(t => t.topic_id !== deleteTarget.topic_id));
      setDeleteTarget(null);
    } catch {
      alert('Lỗi khi xóa chương học.');
    }
  };

  if (isLoading) return <LoadingState message="Đang tải danh sách môn học..." />;
  if (error) return <ErrorState message={error} onRetry={fetchInitialData} />;

  const activeSubjectName = subjects.find(s => s.id === activeSubject)?.name || 'Môn học';

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-2">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Quản lý <br/><span className="text-[#b20112]">Chương học</span></h1>
          <p className="text-slate-500 mt-4 font-medium">Thiết lập cấu trúc chương/topic cho từng môn học phụ trách.</p>
        </div>
        <div>
           <button 
             onClick={handleOpenCreate}
             className="bg-[#b20112] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-900/20 hover:bg-black transition-all flex items-center gap-3 cursor-pointer"
           >
              <span className="material-symbols-outlined text-xl">add_circle</span> Thêm chương mới
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Sidebar: Subject List */}
        <div className="lg:col-span-4 space-y-6">
           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Môn học giảng dạy</h3>
           <div className="space-y-2">
              {subjects.map(s => (
                <button 
                  key={s.id}
                  onClick={() => setActiveSubject(s.id)}
                  className={`w-full p-6 rounded-3xl border-2 transition-all text-left flex justify-between items-center group ${activeSubject === s.id ? 'border-[#b20112] bg-red-50/20 shadow-lg shadow-red-900/5' : 'border-slate-50 bg-white hover:border-slate-200'}`}
                >
                   <div>
                      <p className={`text-sm font-black transition-colors ${activeSubject === s.id ? 'text-[#b20112]' : 'text-slate-600'}`}>{s.name}</p>
                   </div>
                   <span className={`material-symbols-outlined text-xl transition-all ${activeSubject === s.id ? 'text-[#b20112] translate-x-1' : 'text-slate-200 opacity-0 group-hover:opacity-100'}`}>chevron_right</span>
                </button>
              ))}
           </div>
        </div>

        {/* Main Area: Topic List */}
        <div className="lg:col-span-8 space-y-6">
           <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Danh sách chương học của {activeSubjectName}</h3>
              <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">{topics.length} chương</span>
           </div>

           {isTopicsLoading ? (
             <div className="p-20 text-center"><LoadingState message="Đang tải danh sách chương..." /></div>
           ) : topics.length === 0 ? (
             <div className="border-4 border-dashed border-slate-100 rounded-[3rem] p-20 flex flex-col items-center text-center">
                <span className="material-symbols-outlined text-6xl text-slate-100 mb-6">menu_book</span>
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Chưa có chương học nào được tạo</p>
                <button onClick={handleOpenCreate} className="mt-4 text-xs font-black text-[#b20112] hover:underline uppercase tracking-widest">Thêm ngay chương đầu tiên</button>
             </div>
           ) : (
             <div className="space-y-4">
                {topics.map((topic, index) => (
                  <div key={topic.topic_id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-red-900/5 transition-all group">
                     <div className="flex justify-between items-start">
                        <div className="space-y-2 flex-grow pr-4">
                           <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-lg bg-red-50 text-[#b20112] flex items-center justify-center text-xs font-black">
                                 {index + 1}
                              </span>
                              <h4 className="text-lg font-black text-slate-800 tracking-tight leading-snug">{topic.topic_name}</h4>
                           </div>
                           <p className="text-xs text-slate-500 font-medium leading-relaxed pl-11">{topic.description || 'Chưa có mô tả chi tiết cho chương này.'}</p>
                        </div>
                        
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button 
                             onClick={() => handleOpenEdit(topic)}
                             className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-[#b20112] hover:text-white transition-all flex items-center justify-center cursor-pointer"
                             title="Sửa chương"
                           >
                              <span className="material-symbols-outlined text-xl">edit</span>
                           </button>
                           <button 
                             onClick={() => setDeleteTarget(topic)}
                             className="w-10 h-10 rounded-xl bg-slate-50 text-red-300 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center cursor-pointer"
                             title="Xóa chương"
                           >
                              <span className="material-symbols-outlined text-xl">delete</span>
                           </button>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
           )}
        </div>
      </div>

      {/* Create / Edit Topic Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
           <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-10">
                 <div className="flex justify-between items-center mb-8">
                    <div>
                       <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
                          {modalMode === 'create' ? 'Thêm mới' : 'Chỉnh sửa'} <span className="text-[#b20112]">Chương học</span>
                       </h2>
                       <p className="text-slate-400 text-[10px] font-black uppercase mt-1 tracking-widest">
                          Môn học: {activeSubjectName}
                       </p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 transition-all cursor-pointer">
                       <span className="material-symbols-outlined">close</span>
                    </button>
                 </div>

                 <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tên chương / Chủ đề học tập</label>
                       <input 
                         type="text" 
                         placeholder="Ví dụ: Chương 1: Giới thiệu giao thức HTTP"
                         value={formData.topic_name}
                         onChange={e => setFormData({ ...formData, topic_name: e.target.value })}
                         className="w-full p-4 rounded-2xl bg-slate-50 border-none text-xs font-bold focus:ring-2 focus:ring-red-500/20"
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Mô tả chi tiết chương học</label>
                       <textarea 
                         rows={4}
                         placeholder="Nhập nội dung tóm tắt chính của chương học này..."
                         value={formData.description}
                         onChange={e => setFormData({ ...formData, description: e.target.value })}
                         className="w-full p-4 rounded-2xl bg-slate-50 border-none text-xs font-bold focus:ring-2 focus:ring-red-500/20 resize-none"
                       />
                    </div>

                    {formError && (
                      <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                         <span className="material-symbols-outlined text-sm">error</span> {formError}
                      </div>
                    )}

                    <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                       <button 
                         type="button"
                         onClick={() => setIsModalOpen(false)}
                         className="px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all cursor-pointer"
                       >
                          Hủy bỏ
                       </button>
                       <button 
                         type="submit"
                         disabled={isSubmitting}
                         className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-black transition-all disabled:opacity-50 flex items-center gap-3 cursor-pointer"
                       >
                          {isSubmitting ? 'Đang lưu...' : 'Xác nhận lưu'}
                       </button>
                    </div>
                 </form>
              </div>
           </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
           <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 text-center animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-red-50 text-[#b20112] rounded-full flex items-center justify-center mx-auto mb-4">
                 <span className="material-symbols-outlined text-3xl">warning</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Xác nhận xóa chương học</h3>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                 Bạn có chắc chắn muốn xóa **{deleteTarget.topic_name}**? Các tài liệu và câu hỏi liên quan đến chương này trong ngân hàng sẽ không còn được liên kết đúng chương.
              </p>
              <div className="flex gap-3 justify-center">
                 <button 
                   onClick={() => setDeleteTarget(null)}
                   className="px-6 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                 >
                    Hủy bỏ
                 </button>
                 <button 
                   onClick={handleDeleteTopic}
                   className="px-6 py-3 rounded-xl bg-[#b20112] text-white text-xs font-black hover:bg-red-700 transition-all cursor-pointer"
                 >
                    Xác nhận xóa
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
