export type FileType = 'card' | 'brochure';

export type BoothDocumentData = {
  ownerUserId: string;
  boothId: string;
  eventId: string;
  driveFileId: string;
  driveFileUrl: string;
  fileName: string;
  fileType: FileType;
  mimeType?: string;
  sizeBytes?: number;
  isPublic?: boolean;
  extractedText?: string;
};
