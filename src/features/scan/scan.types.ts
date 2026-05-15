export type ExtractedFields = {
  name: string | null;
  company: string | null;
  title: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  linkedin: string | null;
  socialMedia: string[];
  address: string | null;
};

export type ScanResult = {
  extractedFields: ExtractedFields;
  rawText: string;
  imageUrl: string;
  driveFileId: string;
};
