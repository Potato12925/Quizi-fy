import { Link } from 'react-router-dom';
import { formatResourceDate, formatResourceFileSize } from '../utils/resourcePreview';
import type { ResourceCardProps } from '../types';

const getClassSubjectLabel = (
  classCode?: string | null,
  subjectCode?: string | null,
  subjectName?: string | null,
) => [classCode, subjectCode, subjectName].filter(Boolean).join(' - ');

export default function ResourceCard({
  resource,
  onDelete,
  onEdit,
  isLocked = false,
  lockedReason = '',
}: ResourceCardProps) {
  return (
    <div
      className={`bg-white p-8 rounded-[2.5rem] border shadow-sm transition-all ${
        isLocked
          ? 'border-slate-200 opacity-60 grayscale'
          : 'border-slate-100'
      }`}
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h4 className="text-base font-black leading-none tracking-tight text-slate-800">
              {resource.title}
            </h4>

            {isLocked && (
              <span className="bg-slate-200 text-slate-500 px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest">
                Đã khóa
              </span>
            )}
          </div>

          {isLocked && lockedReason && (
            <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
              {lockedReason}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {!!getClassSubjectLabel(
              resource.class_code,
              resource.subject_code,
              resource.subject_name,
            ) && (
              <span className="bg-slate-50 text-slate-400 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">
                {getClassSubjectLabel(
                  resource.class_code,
                  resource.subject_code,
                  resource.subject_name,
                )}
              </span>
            )}

            <span className="bg-slate-50 text-slate-400 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">
              {resource.class_name || resource.subject?.subject_name}
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
            type="button"
            onClick={() => {
              if (isLocked) return;
              onEdit(resource);
            }}
            disabled={isLocked}
            title={isLocked ? lockedReason || 'Tài liệu đã bị khóa' : 'Chỉnh sửa'}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-slate-50 disabled:hover:text-slate-400"
          >
            <span className="text-xl material-symbols-outlined">edit</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (isLocked) return;
              onDelete(resource);
            }}
            disabled={isLocked}
            title={isLocked ? lockedReason || 'Tài liệu đã bị khóa' : 'Xóa'}
            className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-[#b20112] hover:text-white flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-slate-50 disabled:hover:text-slate-400"
          >
            <span className="text-xl material-symbols-outlined">delete</span>
          </button>
        </div>
      </div>

      <div className="mb-4 text-xs text-slate-500">
        {resource.description || 'Không có mô tả'}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {resource.topics.map((topic) => (
          <span
            key={`${resource.document_id}-${topic.topic_id}`}
            className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
              isLocked
                ? 'bg-slate-100 text-slate-400'
                : 'bg-red-50 text-[#b20112]'
            }`}
          >
            {topic.topic_name}
          </span>
        ))}
      </div>

      <div className="flex items-end justify-between pt-6 border-t border-slate-50">
        <div>
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
            Ngày tải lên
          </p>
          <p className="text-xs font-bold text-slate-600">
            {formatResourceDate(resource.created_at)}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-black text-slate-900">
              {resource.question_count || 0}
            </p>
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
              Câu hỏi
            </p>
          </div>

          {isLocked ? (
            <span
              title={lockedReason || 'Tài liệu đã bị khóa'}
              className="bg-slate-200 text-slate-500 px-5 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest cursor-not-allowed"
            >
              Đã khóa
            </span>
          ) : (
            <Link
              to="/teacher/ai-generator"
              state={{ documentId: resource.document_id }}
              className="bg-[#b20112] text-white px-5 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-black transition-all"
            >
              Tạo câu hỏi
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}