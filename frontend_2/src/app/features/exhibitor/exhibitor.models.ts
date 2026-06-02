export type UploadedFileStatus = 'queued' | 'extracting' | 'done' | 'error';

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: UploadedFileStatus;
  progress: number;
  progressLabel: string;
  currentPage?: number;
  totalPages?: number;
  text?: string;
  error?: string;
}
