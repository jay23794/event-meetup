export interface ExtractedFields {
  name?: string | null
  company?: string | null
  title?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  linkedin?: string | null
  socialMedia?: string[]
  address?: string | null
}

export interface ScanData {
  imageUrl: string
  extractedFields: ExtractedFields
  rawText: string
  driveFileId?: string
}

export interface Booth {
  rowNumber: number
  timestamp: string
  boothName?: string
  scanCount: number
  names: string[]
  phones: string[]
  emails: string[]
  companies: string[]
  websites: string[]
  linkedinUrls: string[]
  socialMediaUrls: string[]
  rawOcr: ScanData[]
  voiceTranscript: string | null
  imageUrls: string[]
}

export interface CreateBoothInput {
  boothName?: string
  scans: ScanData[]
}
