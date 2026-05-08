export interface ScanResult {
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

export interface ProcessingScan {
  id: string
  status: 'capturing' | 'processing' | 'reviewing' | 'completed'
  imageFile?: File
  extractedFields?: ExtractedFields
  imageUrl?: string
  driveFileId?: string
  rawText?: string
  error?: string
}
