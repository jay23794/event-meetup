export interface Booth {
  id: string
  eventId: string
  boothName?: string
  scanCount: number
  hasVoiceNote: boolean
  sheetRowNumber: number
  createdAt: string
}

export interface CreateBoothInput {
  boothName?: string
  scans: ScanData[]
}

export interface ScanData {
  imageUrl: string
  extractedFields: ExtractedFields
  rawText: string
  driveFileId?: string
}

export interface ExtractedFields {
  name?: string
  company?: string
  title?: string
  phone?: string
  email?: string
  website?: string
  address?: string
}
