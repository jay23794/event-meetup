import { IBoothScan } from './booth.model';

export type BoothRow = {
  id: string;
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
  rawOcr: IBoothScan[];
  voiceTranscript: string | null;
  imageUrls: string[];
};

export type BoothQrInfo = {
  qrId: string;
  qrUrl: string;
};
