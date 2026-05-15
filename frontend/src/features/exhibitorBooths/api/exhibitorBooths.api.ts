import axios from '../../../shared/api/axios'
import { ApiResponse } from '../../../shared/types/api.types'
import {
  CreateBoothInput,
  CreateDocumentInput,
  ExhibitorBooth,
  ExhibitorBoothDocument,
  ExhibitorDocumentFileType,
} from '../types'

type ExhibitorBoothResponse = {
  _id?: string
  id?: string
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

type ExhibitorBoothDocumentResponse = {
  _id?: string
  id?: string
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

const mapBooth = (booth: ExhibitorBoothResponse): ExhibitorBooth =>
  ({
    ...booth,
    id: booth._id || booth.id || '',
  } as ExhibitorBooth)

const mapDocument = (doc: ExhibitorBoothDocumentResponse): ExhibitorBoothDocument =>
  ({
    ...doc,
    id: doc._id || doc.id || '',
  } as ExhibitorBoothDocument)

export const exhibitorBoothsApi = {
  createBooth: async (
    eventId: string,
    input: CreateBoothInput
  ): Promise<ExhibitorBooth> => {
    const response = await axios.post<ApiResponse<{ booth: ExhibitorBoothResponse }>>(
      `/exhibitor/events/${eventId}/booths`,
      input
    )
    return mapBooth(response.data.data.booth)
  },

  listByEvent: async (eventId: string): Promise<ExhibitorBooth[]> => {
    const response = await axios.get<ApiResponse<{ booths: ExhibitorBoothResponse[] }>>(
      `/exhibitor/events/${eventId}/booths`
    )
    return response.data.data.booths.map(mapBooth)
  },

  getBooth: async (boothId: string): Promise<ExhibitorBooth> => {
    const response = await axios.get<ApiResponse<{ booth: ExhibitorBoothResponse }>>(
      `/exhibitor/booths/${boothId}`
    )
    return mapBooth(response.data.data.booth)
  },

  listBoothDocuments: async (
    boothId: string
  ): Promise<ExhibitorBoothDocument[]> => {
    const response = await axios.get<
      ApiResponse<{ documents: ExhibitorBoothDocumentResponse[] }>
    >(`/exhibitor/booths/${boothId}/documents`)
    return response.data.data.documents.map(mapDocument)
  },

  createDocument: async (
    boothId: string,
    input: CreateDocumentInput
  ): Promise<ExhibitorBoothDocument> => {
    const response = await axios.post<
      ApiResponse<{ document: ExhibitorBoothDocumentResponse }>
    >(`/exhibitor/booths/${boothId}/documents`, input)
    return mapDocument(response.data.data.document)
  },

  extractDocument: async (
    boothId: string,
    docId: string,
    rawText: string
  ): Promise<ExhibitorBoothDocument> => {
    const response = await axios.post<
      ApiResponse<{ document: ExhibitorBoothDocumentResponse }>
    >(`/exhibitor/booths/${boothId}/documents/${docId}/extract`, { rawText })
    return mapDocument(response.data.data.document)
  },

  createBoothWithDocuments: async (
    eventId: string,
    input: {
      boothName: string
      description: string
      documents: Array<{ rawText: string; fileType: 'card' | 'brochure'; fileName: string }>
    }
  ): Promise<{
    booth: ExhibitorBooth
    documents: Array<{ id: string; fileName: string; fileType: string; extractedEmail?: string; extractedName?: string }>
    sheetUrl: string
  }> => {
    const response = await axios.post<
      ApiResponse<{
        booth: ExhibitorBoothResponse
        documents: Array<any>
        sheetUrl: string
      }>
    >(`/exhibitor/events/${eventId}/booths/create-with-documents`, input)
    return {
      booth: mapBooth(response.data.data.booth),
      documents: response.data.data.documents,
      sheetUrl: response.data.data.sheetUrl,
    }
  },
}
