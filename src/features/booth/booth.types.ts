export type BoothRow = {
  rowNumber: number;
  timestamp: string;
  boothName: string | null;
  scanCount: number;
  names: string[];
  phones: string[];
  emails: string[];
  companies: string[];
  websites: string[];
  linkedinUrls: string[];
  socialMediaUrls: string[];
  rawOcr: Array<{
    ocrText: string;
    extractedFields: Record<string, any>;
  }>;
  voiceTranscript: string | null;
  imageUrls: string[];
};

export type BoothQrInfo = {
  qrId: string;
  qrUrl: string;
};

export type CreateBoothPersistInput = {
  ownerUserId: string;
  eventId: string;
  boothName?: string;
  description?: string;
  qrId: string;
  qrUrl: string;
  scanCount: number;
  hasVoiceNote: boolean;
  sheetRowNumber: number;
};
