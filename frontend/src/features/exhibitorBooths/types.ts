export type ExhibitorDocumentFileType = 'card' | 'brochure'

export interface ExhibitorBooth {
  id: string
  ownerUserId: string
  eventId: string
  boothName: string
  description: string
  qrId: string
  qrUrl: string
  documentCount: number
  scanCount: number
  createdAt: string
  updatedAt: string
}

export interface ExhibitorBoothDocument {
  id: string
  ownerUserId: string
  exhibitorBoothId: string
  eventId: string
  driveFileId: string
  driveFileUrl: string
  fileName: string
  fileType: ExhibitorDocumentFileType
  mimeType?: string
  sizeBytes?: number
  isPublic: boolean
  extractedName?: string
  extractedCompany?: string
  extractedTitle?: string
  extractedPhone?: string
  extractedEmail?: string
  extractedWebsite?: string
  extractedAddress?: string
  extractionStatus?: 'pending' | 'success' | 'failed'
  createdAt: string
  updatedAt: string
}

export interface CreateBoothInput {
  boothName: string
  description: string
}

export interface CreateDocumentInput {
  driveFileId: string
  driveFileUrl: string
  fileName: string
  fileType: ExhibitorDocumentFileType
  mimeType?: string
  sizeBytes?: number
  isPublic?: boolean
}
