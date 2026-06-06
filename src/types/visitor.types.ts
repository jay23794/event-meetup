export interface ScannedBoothContacts {
  names: string[];
  companies: string[];
  titles: string[];
  phones: string[];
  emails: string[];
  websites: string[];
  socials: string[];
  addresses: string[];
}

export interface SharedDocument {
  url: string;
  fileId?: string;
  fileName?: string;
  mimeType?: string;
  fileType?: 'card' | 'brochure';
  thumbnailUrl?: string;
}

export interface ScannedBoothItem {
  timestamp: string;
  boothName: string;
  eventName: string;
  qrId: string;
  contacts: ScannedBoothContacts;
  sharedDocuments: SharedDocument[];
}

export interface ListScannedBoothsResult {
  booths: ScannedBoothItem[];
  nextCursor: string | null;
  total: number;
}

export interface ListScannedBoothsOptions {
  limit?: number;
  cursor?: string;
}
