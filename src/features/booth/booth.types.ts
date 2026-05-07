export type BoothRow = {
  rowNumber: number;
  timestamp: string;
  boothName: string | null;
  scanCount: number;
  names: string[];
  phones: string[];
  emails: string[];
  companies: string[];
  rawOcr: Array<{
    ocrText: string;
    extractedFields: Record<string, any>;
  }>;
  voiceTranscript: string | null;
  imageUrls: string[];
};
