export type BoothDocumentFileType = 'card' | 'brochure';

export interface BoothInfo {
  id: string;
  boothName: string;
  description: string;
  qrId: string;
  qrUrl: string;
  scanCount: number;
}

export interface BoothDocument {
  id: string;
  fileName: string;
  fileType: BoothDocumentFileType;
  driveFileUrl?: string;
  driveFileId?: string;
  mimeType?: string;
  sizeBytes?: number;
}

export interface CheckInPayload {
  name: string;
  email: string;
  phone?: string;
}

export interface CheckInResult {
  alreadyCheckedIn: boolean;
  booth: {
    boothName: string;
    description: string;
    scanCount: number;
  };
}
