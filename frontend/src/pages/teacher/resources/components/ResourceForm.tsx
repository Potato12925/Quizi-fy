import { formatResourceFileSize } from '../utils/resourcePreview';
import type { ResourceFormProps } from '../types';

const getClassLabel = (classCode?: string | null, className?: string | null) =>
  classCode || className || 'Lop chua xac dinh';

const getSubjectLabel = (
  classCode?: string | null,
  className?: string | null,
  subjectCode?: string | null,
  subjectName?: string | null,
) =>
  [
    [subjectCode, subjectName].filter(Boolean).join(' / '),
    [classCode, className].filter(Boolean).join(' / '),
  ]
    .filter(Boolean)
    .join(' - ') || 'Mon hoc chua xac dinh';

export default function ResourceForm({
  fileInputRef,
  classOptions,
  formData,
  formError,
  isModalTopicsLoading,
  modalTopicError,
  modalTopics,
  selectedFile,
  subjects,
  onDescriptionChange,
  onClassChange,
  onClassSubjectChange,
  onFileChange,
  onOpenFilePicker,
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
            : 'Chon file PDF, DOCX, TXT (max 20MB)'}
        </p>
      </div>

      <input
        type="text"
        value={formData.title}
        onChange={(event) => onTitleChange(event.target.value)}
        placeholder="Ten tai lieu"
        className="w-full p-4 text-xs font-bold border-none rounded-2xl bg-slate-50"
      />

      <select
        value={formData.classId}
        onChange={(event) => onClassChange(event.target.value)}
        className="w-full p-4 text-xs font-bold border-none rounded-2xl bg-slate-50"
      >
        <option value="">Chon lop</option>
        {classOptions.map((classOption) => (
          <option
            key={classOption.class_id ?? classOption.class_subject_id ?? classOption.subject_id}
            value={String(classOption.class_id ?? '')}
          >
            {getClassLabel(classOption.class_code, classOption.class_name)}
          </option>
        ))}
      </select>

      <select
        value={formData.classSubjectId}
        onChange={(event) => onClassSubjectChange(event.target.value)}
        disabled={!formData.classId}
        className="w-full p-4 text-xs font-bold border-none rounded-2xl bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="">Chon mon hoc</option>
        {subjects.map((subject) => (
          <option
            key={subject.class_subject_id ?? `${subject.class_id}-${subject.subject_id}`}
            value={String(subject.class_subject_id ?? '')}
          >
            {getSubjectLabel(subject.class_code, subject.class_name, subject.subject_code, subject.subject_name)}
          </option>
        ))}
      </select>

      <div className="w-full p-4 border rounded-2xl bg-slate-50 border-slate-100 min-h-28">
        {!formData.classId ? (
          <p className="text-xs font-bold text-slate-400">Vui long chon lop truoc</p>
        ) : !formData.classSubjectId ? (
          <p className="text-xs font-bold text-slate-400">Vui long chon mon hoc truoc</p>
        ) : modalTopics.length === 0 ? (
          <p className="text-xs font-bold text-slate-400">Khong co topic</p>
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
                      disabled={!formData.classSubjectId || isModalTopicsLoading}
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

      {!formData.classId && (
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Chon lop de hien thi mon hoc
        </p>
      )}
      {formData.classId && !formData.classSubjectId && (
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Chon mon hoc de hien thi topic
        </p>
      )}
      {isModalTopicsLoading && (
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Dang tai topic...
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
        placeholder="Mo ta"
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
