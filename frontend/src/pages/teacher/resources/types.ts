import type { TeacherDocument } from '@/api/teacherDocumentApi';
import type {
  TeacherSubjectItem,
  TeacherTopicItem,
} from '@/api/teacherTopicManagementApi';

export type ResourceModalMode = 'upload' | 'edit';
export type ResourcePreviewKind = 'pdf' | 'txt' | 'docx' | 'unsupported' | 'empty';

export interface ResourceFormState {
  title: string;
  classId: string;
  classSubjectId: string;
  topicIds: number[];
  description: string;
}

export interface ResourceCardProps {
  resource: TeacherDocument;
  onDelete: (resource: TeacherDocument) => void | Promise<void>;
  onEdit: (resource: TeacherDocument) => void | Promise<void>;
}

export interface ResourceFormProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  classOptions: TeacherSubjectItem[];
  formData: ResourceFormState;
  formError: string;
  isModalTopicsLoading: boolean;
  modalTopicError: string;
  modalTopics: TeacherTopicItem[];
  selectedFile: File | null;
  subjects: TeacherSubjectItem[];
  onDescriptionChange: (value: string) => void;
  onClassChange: (classIdValue: string) => void;
  onClassSubjectChange: (classSubjectIdValue: string) => void | Promise<void>;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenFilePicker: () => void;
  onTitleChange: (value: string) => void;
  onTopicToggle: (topicId: number, checked: boolean) => void;
}

export interface ResourceFormModalProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  classOptions: TeacherSubjectItem[];
  formData: ResourceFormState;
  formError: string;
  isModalOpen: boolean;
  isModalTopicsLoading: boolean;
  isSubmitting: boolean;
  modalMode: ResourceModalMode;
  modalTopicError: string;
  modalTopics: TeacherTopicItem[];
  resource: TeacherDocument | null;
  selectedFile: File | null;
  subjects: TeacherSubjectItem[];
  onClose: () => void;
  onDescriptionChange: (value: string) => void;
  onClassChange: (classIdValue: string) => void;
  onClassSubjectChange: (classSubjectIdValue: string) => void | Promise<void>;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenFilePicker: () => void;
  onSubmit: (event: React.FormEvent) => void | Promise<void>;
  onTitleChange: (value: string) => void;
  onTopicToggle: (topicId: number, checked: boolean) => void;
}

export interface ResourcePreviewProps {
  className?: string;
  resource: TeacherDocument | null;
  selectedFile: File | null;
}
