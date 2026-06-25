import { useEffect, useMemo } from 'react';
import type { ResourcePreviewProps } from '../types';
import {
  formatResourceFileSize,
  getPreviewKind,
  getPreviewUrl,
} from '../utils/resourcePreview';

const containerClass =
  'bg-slate-50 border border-slate-100 rounded-[2rem] p-5 flex flex-col min-h-[28rem]';

export default function ResourcePreview({
  className = '',
  resource,
  selectedFile,
}: ResourcePreviewProps) {
  const objectUrl = useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : null),
    [selectedFile],
  );

  useEffect(
    () => () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    },
    [objectUrl],
  );

  const previewKind = useMemo(
    () => getPreviewKind(selectedFile, resource),
    [resource, selectedFile],
  );
  const previewUrl = useMemo(
    () => getPreviewUrl(selectedFile, resource, objectUrl),
    [objectUrl, resource, selectedFile],
  );

  const displayName = selectedFile?.name || resource?.title || 'Tài liệu hiện tại';
  const displayType = selectedFile?.type || resource?.file_type || 'Không xác định';
  const displaySize = selectedFile?.size || resource?.file_size || 0;

  const handleOpenNewTab = () => {
    if (!previewUrl) return;
    window.open(previewUrl, '_blank', 'noopener,noreferrer');
  };

  const renderBody = () => {
    if (previewKind === 'pdf' || previewKind === 'txt') {
      return (
        <iframe
          src={previewUrl}
          title={displayName}
          className="w-full min-h-[22rem] flex-1 rounded-[1.5rem] border border-slate-200 bg-white"
        />
      );
    }

    if (previewKind === 'docx') {
      return (
        <div className="flex flex-1 items-center justify-center rounded-[1.5rem] border border-slate-200 bg-white p-8 text-center">
          <div className="max-w-sm space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <span className="material-symbols-outlined text-3xl">description</span>
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">
              DOCX không hỗ trợ preview trực tiếp
            </h3>
            <p className="text-sm font-bold leading-relaxed text-slate-500">
              Trình duyệt không preview DOCX ổn định. Hãy mở tài liệu ở tab mới để xem nội dung đầy đủ.
            </p>
          </div>
        </div>
      );
    }

    if (previewKind === 'unsupported') {
      return (
        <div className="flex flex-1 items-center justify-center rounded-[1.5rem] border border-slate-200 bg-white p-8 text-center">
          <div className="max-w-sm space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <span className="material-symbols-outlined text-3xl">hide_image</span>
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">
              Không hỗ trợ preview
            </h3>
            <p className="text-sm font-bold leading-relaxed text-slate-500">
              Loại file này chưa được hỗ trợ xem trực tiếp trong modal.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-1 items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200 bg-white p-8 text-center">
        <div className="max-w-sm space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <span className="material-symbols-outlined text-3xl">inventory_2</span>
          </div>
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">
            Chưa có file để preview
          </h3>
          <p className="text-sm font-bold leading-relaxed text-slate-500">
            Chọn file mới hoặc dùng file hiện tại của tài liệu để xem trước nội dung.
          </p>
        </div>
      </div>
    );
  };

  return (
    <aside className={`${containerClass} ${className}`.trim()}>
      <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
            Preview tài liệu
          </p>
          <h3 className="text-lg font-black tracking-tight text-slate-900">{displayName}</h3>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
              {displayType}
            </span>
            {displaySize > 0 && (
              <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                {formatResourceFileSize(displaySize)}
              </span>
            )}
            {selectedFile && (
              <span className="rounded-full bg-red-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#b20112]">
                File mới
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={handleOpenNewTab}
          disabled={!previewUrl}
          className="bg-white px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-600 border border-slate-200 hover:border-[#b20112] hover:text-[#b20112] transition-all disabled:cursor-not-allowed disabled:opacity-50"
        >
          Mở tab mới
        </button>
      </div>

      <div className="flex-1 pt-5">{renderBody()}</div>
    </aside>
  );
}
