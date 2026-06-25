import type { TeacherDocument } from '@/api/teacherDocumentApi';
import type { ResourcePreviewKind } from '../types';

const PDF_MIME = 'application/pdf';
const TXT_MIME = 'text/plain';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const normalizeExtension = (value?: string | null) => value?.trim().toLowerCase() || '';

const getFileExtension = (value?: string | null) => {
  const normalized = normalizeExtension(value);
  if (!normalized) return '';

  const withoutQuery = normalized.split('?')[0]?.split('#')[0] || normalized;
  const parts = withoutQuery.split('.');
  return parts.length > 1 ? parts[parts.length - 1] || '' : '';
};

const getSourceName = (selectedFile: File | null, resource: TeacherDocument | null) =>
  selectedFile?.name || resource?.file_url || resource?.title || '';

const getSourceMime = (selectedFile: File | null, resource: TeacherDocument | null) =>
  selectedFile?.type || resource?.file_type || '';

export const isPdfFile = (selectedFile: File | null, resource: TeacherDocument | null) => {
  const mime = getSourceMime(selectedFile, resource).toLowerCase();
  const extension = getFileExtension(getSourceName(selectedFile, resource));
  return mime === PDF_MIME || extension === 'pdf';
};

export const isTxtFile = (selectedFile: File | null, resource: TeacherDocument | null) => {
  const mime = getSourceMime(selectedFile, resource).toLowerCase();
  const extension = getFileExtension(getSourceName(selectedFile, resource));
  return mime === TXT_MIME || extension === 'txt';
};

export const isDocxFile = (selectedFile: File | null, resource: TeacherDocument | null) => {
  const mime = getSourceMime(selectedFile, resource).toLowerCase();
  const extension = getFileExtension(getSourceName(selectedFile, resource));
  return mime === DOCX_MIME || extension === 'docx';
};

export const getPreviewKind = (
  selectedFile: File | null,
  resource: TeacherDocument | null,
): ResourcePreviewKind => {
  if (!selectedFile && !resource?.file_url) {
    return 'empty';
  }
  if (isPdfFile(selectedFile, resource)) {
    return 'pdf';
  }
  if (isTxtFile(selectedFile, resource)) {
    return 'txt';
  }
  if (isDocxFile(selectedFile, resource)) {
    return 'docx';
  }
  return 'unsupported';
};

export const getPreviewUrl = (
  selectedFile: File | null,
  resource: Pick<TeacherDocument, 'file_url'> | null,
  objectUrl?: string | null,
) => {
  if (selectedFile) {
    return objectUrl || '';
  }
  return resource?.file_url || '';
};

export const formatResourceFileSize = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

export const formatResourceDate = (value: string) => new Date(value).toLocaleDateString('vi-VN');
