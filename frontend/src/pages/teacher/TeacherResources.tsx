import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getResources, uploadResource, updateResource, deleteResource } from '@/api/teacherApi';
import type { TeacherResource, UploadResourcePayload } from '@/api/teacherApi';

import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';

export default function TeacherResourcesPage() {
  const [resources, setResources] = useState<TeacherResource[]>([]);
  const [filteredResources, setFilteredResources] = useState<TeacherResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'upload' | 'edit'>('upload');
  const [selectedResource, setSelectedResource] = useState<TeacherResource | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    subjectId: 1,
    topicId: 1,
    description: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await getResources();
      setResources(data);
      setFilteredResources(data);
    } catch {
      setError('Không thể tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter logic
  useEffect(() => {
    let result = resources;
    
    if (searchQuery) {
      result = result.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    
    if (filterSubject !== 'all') {
      result = result.filter(r => r.subject === filterSubject);
    }

    if (filterType !== 'all') {
      result = result.filter(r => r.name.toLowerCase().endsWith(filterType.toLowerCase()));
    }

    setFilteredResources(result);
  }, [searchQuery, filterSubject, filterType, resources]);

  const handleOpenUpload = () => {
    setModalMode('upload');
    setFormData({ title: '', subjectId: 1, topicId: 1, description: '' });
    setSelectedFile(null);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (res: TeacherResource) => {
    setModalMode('edit');
    setSelectedResource(res);
    setFormData({
      title: res.name,
      subjectId: res.subjectId || 1,
      topicId: res.topicId || 1,
      description: res.description || '',
    });
    setSelectedFile(null);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (res: TeacherResource) => {
    const hasQuestions = res.usage > 0;
    const message = hasQuestions 
      ? `Tài liệu "${res.name}" đã được dùng để tạo ${res.usage} câu hỏi AI. Nếu bạn xóa/ẩn, các câu hỏi đã tạo sẽ KHÔNG bị mất nhưng bạn sẽ không thể tạo thêm câu hỏi từ tài liệu này. Bạn vẫn muốn tiếp tục?`
      : `Bạn có chắc chắn muốn xóa tài liệu "${res.name}" không?`;

    if (!window.confirm(message)) return;

    try {
      const result = await deleteResource(res.id);
      if (result.success) {
        setResources(prev => prev.filter(r => r.id !== res.id));
      }
    } catch (err) {
      alert('Không thể xóa tài liệu. Vui lòng thử lại.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'upload' && !selectedFile) {
      setFormError('Vui lòng chọn file tài liệu');
      return;
    }
    if (!formData.title) {
      setFormError('Vui lòng nhập tên tài liệu');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (modalMode === 'upload') {
        const payload: UploadResourcePayload = {
          title: formData.title,
          subject_id: formData.subjectId,
          topic_id: formData.topicId,
          description: formData.description,
          file: selectedFile!,
        };
        const newRes = await uploadResource(payload);
        setResources(prev => [newRes, ...prev]);
      } else if (selectedResource) {
        const payload: Partial<UploadResourcePayload> = {
          title: formData.title,
          subject_id: formData.subjectId,
          topic_id: formData.topicId,
          description: formData.description,
        };
        const result = await updateResource(selectedResource.id, payload);
        if (result.success) {
          setResources(prev => prev.map(r => r.id === selectedResource.id ? { ...r, name: formData.title, description: formData.description } : r));
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError('Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.title) {
        setFormData({ ...formData, title: file.name });
      }
    }
  };

  if (isLoading && resources.length === 0) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const uniqueSubjects = Array.from(new Set(resources.map(r => r.subject)));

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-2">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Tài liệu <br/><span className="text-[#b20112]">Học tập</span></h1>
          <p className="text-slate-500 mt-4 font-medium italic">"Kho nguyên liệu để khởi tạo tri thức AI."</p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={handleOpenUpload}
             className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-black transition-all flex items-center gap-3"
           >
              <span className="material-symbols-outlined text-xl">upload_file</span> Tải tài liệu mới
           </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-wrap gap-4 items-center justify-between">
         <div className="flex flex-wrap gap-4 flex-1">
            <div className="relative flex-1 min-w-[240px]">
               <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
               <input 
                 type="text" 
                 placeholder="Tìm kiếm tài liệu..." 
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
                 className="w-full pl-12 pr-6 py-3 rounded-xl bg-slate-50 border-none text-xs font-bold focus:ring-2 focus:ring-red-500/20 transition-all" 
               />
            </div>
            <select 
              value={filterSubject}
              onChange={e => setFilterSubject(e.target.value)}
              className="px-6 py-3 rounded-xl bg-slate-50 border-none text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer focus:ring-2 focus:ring-red-500/20"
            >
               <option value="all">Tất cả môn học</option>
               {uniqueSubjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select 
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="px-6 py-3 rounded-xl bg-slate-50 border-none text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer focus:ring-2 focus:ring-red-500/20"
            >
               <option value="all">Loại file</option>
               <option value="pdf">PDF</option>
               <option value="docx">Word (DOCX)</option>
               <option value="pptx">PowerPoint</option>
            </select>
         </div>
      </div>

      {/* Resource Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {filteredResources.length > 0 ? (
           filteredResources.map(res => (
             <div key={res.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-red-900/5 transition-all group relative overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                   <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${
                         res.name.toLowerCase().endsWith('.pdf') ? 'bg-red-50 text-red-500' : 
                         res.name.toLowerCase().endsWith('.pptx') ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'
                      }`}>
                         <span className="material-symbols-outlined">
                            {res.name.toLowerCase().endsWith('.pdf') ? 'picture_as_pdf' : 
                             res.name.toLowerCase().endsWith('.pptx') ? 'slideshow' : 'description'}
                         </span>
                      </div>
                      <div>
                         <h4 className="text-base font-black text-slate-800 tracking-tight leading-none mb-2">{res.name}</h4>
                         <div className="flex gap-2">
                            <span className="bg-slate-50 text-slate-400 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">{res.subject}</span>
                            <span className="bg-slate-50 text-slate-400 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">{res.size}</span>
                         </div>
                      </div>
                   </div>
                   
                   <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenEdit(res)}
                        className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center"
                      >
                         <span className="material-symbols-outlined text-xl">edit</span>
                      </button>
                      <button 
                        onClick={() => handleDelete(res)}
                        className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-[#b20112] hover:text-white transition-all flex items-center justify-center"
                      >
                         <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
                   </div>
                </div>

                <div className="flex justify-between items-end border-t border-slate-50 pt-6 mt-6">
                   <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Ngày tải lên</p>
                      <p className="text-xs font-bold text-slate-600">{res.date}</p>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="text-right pr-4 border-r border-slate-100">
                         <p className="text-sm font-black text-slate-900">{res.usage}</p>
                         <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none">Câu hỏi AI</p>
                      </div>
                      <Link 
                        to="/teacher/ai-generator" 
                        state={{ documentId: res.id }}
                        className="bg-[#b20112] text-white px-5 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-red-900/10 hover:bg-black transition-all flex items-center gap-2"
                      >
                         <span className="material-symbols-outlined text-base">auto_awesome</span> Tạo câu hỏi
                      </Link>
                   </div>
                </div>
             </div>
           ))
         ) : (
           <div className="col-span-full border-4 border-dashed border-slate-100 rounded-[3rem] p-20 flex flex-col items-center text-center">
              <span className="material-symbols-outlined text-6xl text-slate-100 mb-6">inventory_2</span>
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Không tìm thấy tài liệu phù hợp</p>
           </div>
         )}
      </div>

      {/* Upload/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isSubmitting && setIsModalOpen(false)}></div>
           <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-10 sm:p-12">
                 <div className="flex justify-between items-center mb-10">
                    <div>
                       <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
                          {modalMode === 'upload' ? 'Upload' : 'Chỉnh sửa'} <span className="text-[#b20112]">Tài liệu</span>
                       </h2>
                       <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest">
                          {modalMode === 'upload' ? 'Thêm tài liệu mới vào kho lưu trữ của bạn' : 'Cập nhật thông tin tài liệu'}
                       </p>
                    </div>
                    <button 
                      onClick={() => setIsModalOpen(false)}
                      disabled={isSubmitting}
                      className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 transition-all"
                    >
                       <span className="material-symbols-outlined">close</span>
                    </button>
                 </div>

                 <form onSubmit={handleSubmit} className="space-y-8">
                    {modalMode === 'upload' && (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all cursor-pointer ${
                          selectedFile ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100 hover:border-[#b20112] hover:bg-red-50/10'
                        }`}
                      >
                         <input 
                           type="file" 
                           ref={fileInputRef}
                           onChange={handleFileChange}
                           className="hidden" 
                           accept=".pdf,.docx,.pptx"
                         />
                         {selectedFile ? (
                           <div className="flex flex-col items-center">
                              <span className="material-symbols-outlined text-4xl text-emerald-500 mb-2">check_circle</span>
                              <p className="text-xs font-black text-emerald-700 truncate max-w-xs">{selectedFile.name}</p>
                              <p className="text-[10px] text-emerald-500 font-bold uppercase mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                           </div>
                         ) : (
                           <div>
                              <span className="material-symbols-outlined text-4xl text-slate-200 mb-2">cloud_upload</span>
                              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Kéo thả hoặc click để chọn file</p>
                              <p className="text-[9px] text-slate-300 uppercase tracking-widest mt-2">Hỗ trợ PDF, DOCX, PPTX (Max 50MB)</p>
                           </div>
                         )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2 col-span-full">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tên tài liệu hiển thị</label>
                          <input 
                            type="text"
                            placeholder="Ví dụ: Giáo trình Mạng máy tính - Chương 1"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full p-4 rounded-2xl bg-slate-50 border-none text-xs font-bold focus:ring-2 focus:ring-red-500/20"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Môn học</label>
                          <select 
                            value={formData.subjectId}
                            onChange={e => setFormData({ ...formData, subjectId: parseInt(e.target.value) })}
                            className="w-full p-4 rounded-2xl bg-slate-50 border-none text-xs font-bold focus:ring-2 focus:ring-red-500/20 cursor-pointer"
                          >
                             <option value={1}>Mạng máy tính</option>
                             <option value={2}>Cấu trúc dữ liệu</option>
                             <option value={3}>Hệ điều hành</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Chủ đề (Topic)</label>
                          <select 
                            value={formData.topicId}
                            onChange={e => setFormData({ ...formData, topicId: parseInt(e.target.value) })}
                            className="w-full p-4 rounded-2xl bg-slate-50 border-none text-xs font-bold focus:ring-2 focus:ring-red-500/20 cursor-pointer"
                          >
                             <option value={1}>Chương 1: Tổng quan</option>
                             <option value={2}>Chương 2: Tầng ứng dụng</option>
                             <option value={3}>Chương 3: Tầng vận chuyển</option>
                          </select>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Mô tả thêm (Tùy chọn)</label>
                       <textarea 
                         rows={3}
                         placeholder="Nhập mô tả ngắn gọn về nội dung tài liệu..."
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

                    {modalMode === 'edit' && selectedResource && selectedResource.usage > 0 && (
                      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-widest flex items-center gap-3">
                         <span className="material-symbols-outlined text-sm">warning</span> 
                         Tài liệu này đã tạo câu hỏi AI. Việc đổi tên/mô tả sẽ được cập nhật đồng bộ.
                      </div>
                    )}

                    <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                       <button 
                         type="button"
                         onClick={() => setIsModalOpen(false)}
                         disabled={isSubmitting}
                         className="px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
                       >
                          Hủy bỏ
                       </button>
                       <button 
                         type="submit"
                         disabled={isSubmitting}
                         className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-black transition-all disabled:opacity-50 flex items-center gap-3"
                       >
                          {isSubmitting ? (
                            <>
                              <span className="material-symbols-outlined animate-spin">sync</span> Đang xử lý...
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined">check_circle</span> 
                              {modalMode === 'upload' ? 'Tải lên ngay' : 'Cập nhật tài liệu'}
                            </>
                          )}
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
