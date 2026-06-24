import { formatResourceFileSize } from '../utils/resourcePreview';
import type { ResourceFormProps } from '../types';

export default function ResourceForm({
  fileInputRef,
  formData,
  formError,
  isModalTopicsLoading,
  modalTopicError,
  modalTopics,
  selectedFile,
  subjects,
  onDescriptionChange,
  onFileChange,
  onOpenFilePicker,
  onSubjectChange,
  onTitleChange,
  onTopicToggle,
}: ResourceFormProps) {
  return (
    <div className="space-y-6">
      <div
        onClick={onOpenFilePicker}
        className="border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer border-slate-100 hover:border-[#b20112]"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileChange}
          className="hidden"
          accept=".pdf,.docx,.txt"
        />
        <p className="text-xs font-black tracking-widest uppercase text-slate-400">
          {selectedFile
            ? `${selectedFile.name} (${formatResourceFileSize(selectedFile.size)})`
            : 'Chọn file PDF, DOCX, TXT (max 20MB)'}
        </p>
      </div>

      <input
        type="text"
        value={formData.title}
        onChange={(event) => onTitleChange(event.target.value)}
        placeholder="Tên tài liệu"
        className="w-full p-4 text-xs font-bold border-none rounded-2xl bg-slate-50"
      />

      <select
        value={formData.subjectId}
        onChange={(event) => onSubjectChange(event.target.value, true)}
        className="w-full p-4 text-xs font-bold border-none rounded-2xl bg-slate-50"
      >
        <option value="">Chọn môn học</option>
        {subjects.map((subject) => (
          <option key={subject.subject_id} value={String(subject.subject_id)}>
            {subject.subject_name}
          </option>
        ))}
      </select>

      <div className="w-full p-4 border rounded-2xl bg-slate-50 border-slate-100 min-h-28">
        {!formData.subjectId ? (
          <p className="text-xs font-bold text-slate-400">Vui lòng chọn môn học trước</p>
        ) : modalTopics.length === 0 ? (
          <p className="text-xs font-bold text-slate-400">Không có topic</p>
        ) : (
          <div className="pr-1 space-y-2 overflow-y-auto max-h-44">
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
                      checked
                        ? 'border-[#b20112] bg-[#b20112]'
                        : 'border-slate-300 bg-white group-hover:border-[#b20112]/60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      disabled={!formData.subjectId || isModalTopicsLoading}
                      checked={checked}
                      onChange={(event) => onTopicToggle(topic.topic_id, event.target.checked)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <span
                      className={`material-symbols-outlined text-[13px] text-white transition-opacity ${
                        checked ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
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

      {!formData.subjectId && (
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Chọn môn học để hiển thị topic
        </p>
      )}
      {isModalTopicsLoading && (
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Đang tải topic...
        </p>
      )}
      {modalTopicError && (
        <p className="text-[10px] font-black uppercase tracking-widest text-red-500">
          {modalTopicError}
        </p>
      )}

      <textarea
        rows={3}
        value={formData.description}
        onChange={(event) => onDescriptionChange(event.target.value)}
        placeholder="Mô tả"
        className="w-full p-4 text-xs font-bold border-none rounded-2xl bg-slate-50"
      />

      {formError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest">
          {formError}
        </div>
      )}
    </div>
  );
}
