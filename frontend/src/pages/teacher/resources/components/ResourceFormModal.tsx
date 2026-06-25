import ResourceForm from './ResourceForm';
import ResourcePreview from './ResourcePreview';
import type { ResourceFormModalProps } from '../types';

export default function ResourceFormModal({
  fileInputRef,
  classOptions,
  formData,
  formError,
  isModalOpen,
  isModalTopicsLoading,
  isSubmitting,
  modalMode,
  modalTopicError,
  modalTopics,
  resource,
  selectedFile,
  subjects,
  onClose,
  onDescriptionChange,
  onClassChange,
  onClassSubjectChange,
  onFileChange,
  onOpenFilePicker,
  onSubmit,
  onTitleChange,
  onTopicToggle,
}: ResourceFormModalProps) {
  if (!isModalOpen) return null;

  const isEditMode = modalMode === 'edit';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={() => !isSubmitting && onClose()}
      />
      <div
        className={`bg-white w-full ${isEditMode ? 'max-w-6xl' : 'max-w-2xl'} rounded-[3rem] shadow-2xl relative z-10 overflow-hidden`}
      >
        <div className="p-10 sm:p-12">
          <div className="flex items-start justify-between gap-6 mb-8">
            <div>
              <h2 className="text-3xl italic font-black tracking-tighter uppercase text-slate-900">
                {modalMode === 'upload' ? 'Tải lên' : 'Chỉnh sửa'}{' '}
                <span className="text-[#b20112]">Tài liệu</span>
              </h2>
              {isEditMode && (
                <p className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                  Cập nhật thông tin bên trái, xem preview file bên phải
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <form onSubmit={onSubmit}>
            {isEditMode ? (
              <div className="space-y-8">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.95fr)]">
                  <ResourceForm
                    fileInputRef={fileInputRef}
                    classOptions={classOptions}
                    formData={formData}
                    formError={formError}
                    isModalTopicsLoading={isModalTopicsLoading}
                    modalTopicError={modalTopicError}
                    modalTopics={modalTopics}
                    selectedFile={selectedFile}
                    subjects={subjects}
                    onDescriptionChange={onDescriptionChange}
                    onClassChange={onClassChange}
                    onClassSubjectChange={onClassSubjectChange}
                    onFileChange={onFileChange}
                    onOpenFilePicker={onOpenFilePicker}
                    onTitleChange={onTitleChange}
                    onTopicToggle={onTopicToggle}
                  />
                  <ResourcePreview resource={resource} selectedFile={selectedFile} />
                </div>
                <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest disabled:opacity-50"
                  >
                    {isSubmitting ? 'Đang xử lý...' : 'Cập nhật'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <ResourceForm
                  fileInputRef={fileInputRef}
                  classOptions={classOptions}
                  formData={formData}
                  formError={formError}
                  isModalTopicsLoading={isModalTopicsLoading}
                  modalTopicError={modalTopicError}
                  modalTopics={modalTopics}
                  selectedFile={selectedFile}
                  subjects={subjects}
                  onDescriptionChange={onDescriptionChange}
                  onClassChange={onClassChange}
                  onClassSubjectChange={onClassSubjectChange}
                  onFileChange={onFileChange}
                  onOpenFilePicker={onOpenFilePicker}
                  onTitleChange={onTitleChange}
                  onTopicToggle={onTopicToggle}
                />
                <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest disabled:opacity-50"
                  >
                    {isSubmitting ? 'Đang xử lý...' : 'Tải lên ngay'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
