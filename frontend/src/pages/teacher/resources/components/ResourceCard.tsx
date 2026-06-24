import { Link } from 'react-router-dom';
import { formatResourceDate, formatResourceFileSize } from '../utils/resourcePreview';
import type { ResourceCardProps } from '../types';

export default function ResourceCard({
  resource,
  onDelete,
  onEdit,
}: ResourceCardProps) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h4 className="mb-2 text-base font-black leading-none tracking-tight text-slate-800">
            {resource.title}
          </h4>
          <div className="flex flex-wrap gap-2">
            <span className="bg-slate-50 text-slate-400 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">
              {resource.subject?.subject_name}
            </span>
            <span className="bg-slate-50 text-slate-400 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">
              {formatResourceFileSize(resource.file_size)}
            </span>
            <span className="bg-slate-50 text-slate-400 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">
              {resource.file_type.toUpperCase()}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(resource)}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white"
          >
            <span className="text-xl material-symbols-outlined">edit</span>
          </button>
          <button
            onClick={() => onDelete(resource)}
            className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-[#b20112] hover:text-white flex items-center justify-center"
          >
            <span className="text-xl material-symbols-outlined">delete</span>
          </button>
        </div>
      </div>
      <div className="mb-4 text-xs text-slate-500">{resource.description || 'Không có mô tả'}</div>
      <div className="flex flex-wrap gap-2 mb-4">
        {resource.topics.map((topic) => (
          <span
            key={`${resource.document_id}-${topic.topic_id}`}
            className="bg-red-50 text-[#b20112] px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest"
          >
            {topic.topic_name}
          </span>
        ))}
      </div>
      <div className="flex items-end justify-between pt-6 border-t border-slate-50">
        <div>
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Ngày tải lên</p>
          <p className="text-xs font-bold text-slate-600">{formatResourceDate(resource.created_at)}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-black text-slate-900">{resource.question_count || 0}</p>
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Câu hỏi</p>
          </div>
          <Link
            to="/teacher/ai-generator"
            state={{ documentId: resource.document_id }}
            className="bg-[#b20112] text-white px-5 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-black transition-all"
          >
            Tạo câu hỏi
          </Link>
        </div>
      </div>
    </div>
  );
}
