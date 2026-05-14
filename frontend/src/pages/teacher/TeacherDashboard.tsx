import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getTeacherDashboardStats, uploadResource } from '@/api/teacherApi';
import type { TeacherDashboardStats, UploadResourcePayload } from '@/api/teacherApi';

import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import EmptyState from '@/components/common/EmptyState';

export default function TeacherDashboard() {
  const [data, setData] = useState<TeacherDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Success Notification
  const [showSuccess, setShowSuccess] = useState(false);

  // Quick Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadFormData, setUploadFormData] = useState({
    title: '',
    subjectId: 1,
    topicId: 1,
    description: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenUpload = () => {
    setUploadFormData({ title: '', subjectId: 1, topicId: 1, description: '' });
    setSelectedFile(null);
    setFormError('');
    setIsUploadModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Constraints check
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      const maxSizeBytes = 20 * 1024 * 1024; // 20MB

      if (!allowedTypes.includes(file.type) && !file.name.endsWith('.txt')) {
        setFormError('Chỉ hỗ trợ định dạng file PDF, DOCX hoặc TXT');
        setSelectedFile(null);
        return;
      }

      if (file.size > maxSizeBytes) {
        setFormError('Dung lượng file vượt quá giới hạn 20MB');
        setSelectedFile(null);
        return;
      }

      setFormError('');
      setSelectedFile(file);
      if (!uploadFormData.title) {
        setUploadFormData({ ...uploadFormData, title: file.name });
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setFormError('Vui lòng chọn file tài liệu');
      return;
    }
    if (!uploadFormData.title) {
      setFormError('Vui lòng nhập tên tài liệu');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const payload: UploadResourcePayload = {
        title: uploadFormData.title,
        subject_id: uploadFormData.subjectId,
        topic_id: uploadFormData.topicId,
        description: uploadFormData.description,
        file: selectedFile,
      };
      await uploadResource(payload);
      
      // Refresh data to show new material
      const stats = await getTeacherDashboardStats();
      setData(stats);
      
      setIsUploadModalOpen(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      setFormError('Không thể tải lên tài liệu. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const stats = await getTeacherDashboardStats();
        setData(stats);
      } catch {
        setError('Không thể tải dữ liệu');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <EmptyState />;

  const { stats, recentQuizzes, materials } = data;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      {/* Success Notification Toast */}
      {showSuccess && (
        <div className="fixed top-10 right-10 z-[200] animate-in slide-in-from-right-10 duration-500">
           <div className="bg-emerald-500 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-emerald-400/20">
              <span className="material-symbols-outlined text-2xl">check_circle</span>
              <div>
                 <p className="text-xs font-black uppercase tracking-widest leading-none">Thành công!</p>
                 <p className="text-[10px] font-medium opacity-90 mt-1">Tài liệu đã được tải lên và sẵn sàng xử lý.</p>
              </div>
           </div>
        </div>
      )}

      {/* Hero Section - Refined */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-2">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Chào buổi sáng, Thầy Minh</h1>
          <p className="text-slate-500 mt-2 font-medium">Hệ thống AI đã sẵn sàng xử lý các tài liệu mới nhất của thầy.</p>
        </div>
        <Link to="/teacher/ai-generator" className="w-full md:w-auto">
          <button className="w-full bg-[#b20112] text-white px-10 py-4 rounded-[1.5rem] font-black flex items-center justify-center gap-3 shadow-2xl shadow-red-900/20 hover:bg-[#d62828] hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-sm">
            <span className="material-symbols-outlined text-2xl" style={{fontVariationSettings: "'FILL' 1"}}>auto_awesome</span>
            Tạo câu hỏi bằng AI
          </button>
        </Link>
      </div>

      {/* Stats Cards - Bento Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, idx) => (
          <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
            <div className={`w-14 h-14 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <span className="material-symbols-outlined text-3xl">{s.icon}</span>
            </div>
            <p className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">{s.label}</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{s.value}</h3>
            {s.growth ? (
              <p className="text-[10px] font-black text-emerald-500 mt-3 flex items-center gap-1 uppercase tracking-tighter">
                <span className="material-symbols-outlined text-xs">trending_up</span> {s.growth}
              </p>
            ) : (
              <p className="text-[10px] font-black text-slate-300 mt-3 uppercase tracking-tighter">{s.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* Middle Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Quizzes */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Mới tạo</h3>
            <button className="text-[10px] font-black text-[#b20112] uppercase tracking-widest hover:underline decoration-2 underline-offset-4">Xem tất cả</button>
          </div>
          <div className="space-y-4">
            {recentQuizzes.map((q, idx) => (
              <div key={idx} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 hover:border-[#b20112] hover:shadow-lg transition-all cursor-pointer group">
                <div className={`w-14 h-14 ${q.bg} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-black/5 group-hover:rotate-6 transition-transform`}>
                  <span className="material-symbols-outlined text-2xl" style={{fontVariationSettings: q.icon === 'auto_awesome' ? "'FILL' 1" : ""}}>{q.icon}</span>
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900 leading-tight mb-1">{q.title}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{q.info}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Materials Table */}
        <div className="lg:col-span-8 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Tài liệu tải lên</h3>
            <div className="flex gap-3">
               <button className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-[#b20112] transition-colors"><span className="material-symbols-outlined text-xl">filter_list</span></button>
               <button 
                 onClick={handleOpenUpload}
                 className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-[#b20112] transition-colors"
               >
                  <span className="material-symbols-outlined text-xl">cloud_upload</span>
               </button>
            </div>
          </div>
          <div className="overflow-x-auto no-scrollbar flex-1">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                  <th className="pb-6">Tên tài liệu</th>
                  <th className="pb-6">Ngày tải</th>
                  <th className="pb-6">Trạng thái</th>
                  <th className="pb-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50/50">
                {materials.map((m, idx) => (
                  <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-6">
                      <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-slate-300 group-hover:text-[#b20112] transition-colors">description</span>
                        <span className="font-bold text-slate-700">{m.name}</span>
                      </div>
                    </td>
                    <td className="py-6 text-slate-400 text-[11px] font-bold uppercase tracking-tighter">{m.date}</td>
                    <td className="py-6">
                      <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight ${m.statusColor}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="py-6 text-right">
                      <button className="p-2 rounded-xl text-slate-300 hover:text-slate-900 hover:bg-white transition-all">
                        <span className="material-symbols-outlined">more_horiz</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Link to="/teacher/resources" className="w-full mt-8 pt-8 border-t border-slate-50 text-center">
            <button className="text-[10px] font-black text-slate-400 hover:text-[#b20112] transition-all uppercase tracking-[0.3em]">
              Xem tất cả tài liệu
            </button>
          </Link>
        </div>
      </div>

      {/* Quick Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isSubmitting && setIsUploadModalOpen(false)}></div>
           <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-10 sm:p-12">
                 <div className="flex justify-between items-center mb-10">
                    <div>
                       <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
                          Upload <span className="text-[#b20112]">Nhanh</span>
                       </h2>
                       <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest">
                          Tải tài liệu mới lên kho lưu trữ trực tiếp từ Dashboard
                       </p>
                    </div>
                    <button 
                      onClick={() => setIsUploadModalOpen(false)}
                      disabled={isSubmitting}
                      className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 transition-all"
                    >
                       <span className="material-symbols-outlined">close</span>
                    </button>
                 </div>

                 <form onSubmit={handleUploadSubmit} className="space-y-8">
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
                         accept=".pdf,.docx,.txt"
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
                            <p className="text-[9px] text-slate-300 uppercase tracking-widest mt-2">Hỗ trợ PDF, DOCX, TXT (Max 20MB)</p>
                         </div>
                       )}
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tên tài liệu hiển thị</label>
                       <input 
                         type="text"
                         placeholder="Ví dụ: Giáo trình Mạng máy tính - Chương 1"
                         value={uploadFormData.title}
                         onChange={e => setUploadFormData({ ...uploadFormData, title: e.target.value })}
                         className="w-full p-4 rounded-2xl bg-slate-50 border-none text-xs font-bold focus:ring-2 focus:ring-red-500/20"
                       />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Môn học</label>
                          <select 
                            value={uploadFormData.subjectId}
                            onChange={e => setUploadFormData({ ...uploadFormData, subjectId: parseInt(e.target.value) })}
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
                            value={uploadFormData.topicId}
                            onChange={e => setUploadFormData({ ...uploadFormData, topicId: parseInt(e.target.value) })}
                            className="w-full p-4 rounded-2xl bg-slate-50 border-none text-xs font-bold focus:ring-2 focus:ring-red-500/20 cursor-pointer"
                          >
                             <option value={1}>Chương 1: Tổng quan</option>
                             <option value={2}>Chương 2: Tầng ứng dụng</option>
                             <option value={3}>Chương 3: Tầng vận chuyển</option>
                          </select>
                       </div>
                    </div>

                    {formError && (
                      <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                         <span className="material-symbols-outlined text-sm">error</span> {formError}
                      </div>
                    )}

                    <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                       <button 
                         type="button"
                         onClick={() => setIsUploadModalOpen(false)}
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
                              <span className="material-symbols-outlined animate-spin">sync</span> Đang tải...
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined">check_circle</span> Tải lên ngay
                            </>
                          )}
                       </button>
                    </div>
                 </form>
              </div>
           </div>
        </div>
      )}

      {/* AI Intelligence Banner */}
      <div className="bg-[#b20112] rounded-[3.5rem] p-12 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between shadow-2xl shadow-red-900/20 border border-white/10">
        <div className="absolute top-0 right-0 p-12 opacity-10">
           <span className="material-symbols-outlined text-[300px]" style={{fontVariationSettings: "'FILL' 1"}}>psychology</span>
        </div>
        <div className="relative z-10 space-y-6 max-w-2xl text-center lg:text-left">
          <span className="bg-white/20 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] backdrop-blur-md border border-white/20">AI Insights</span>
          <h2 className="text-4xl font-black text-white leading-[1.1] tracking-tighter">Tối ưu hoá nội dung giảng dạy</h2>
          <p className="text-white/70 font-medium leading-relaxed">
            Dựa trên kết quả làm bài của lớp 'Cấu trúc dữ liệu', AI nhận thấy sinh viên đang gặp khó khăn ở chương 'Cây nhị phân'. Bạn có muốn tạo thêm một bộ câu hỏi ôn tập chuyên sâu không?
          </p>
          <div className="flex flex-wrap gap-4 pt-4 justify-center lg:justify-start">
            <button className="bg-white text-[#b20112] px-10 py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-red-50 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest">Tạo ngay</button>
            <button className="text-white/60 font-black text-sm hover:text-white transition-colors uppercase tracking-widest">Bỏ qua</button>
          </div>
        </div>
        
        <div className="relative mt-12 lg:mt-0 w-80 h-56 bg-white/10 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/20 shadow-inner group">
           <div className="space-y-4">
              <div className="flex justify-between items-end">
                 <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Hiệu suất lớp</p>
                 <span className="text-white font-black text-2xl tracking-tighter">72%</span>
              </div>
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                 <div className="w-[72%] h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"></div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                 <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Dễ</p>
                    <p className="text-white font-black">45%</p>
                 </div>
                 <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Khó</p>
                    <p className="text-white font-black">28%</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
