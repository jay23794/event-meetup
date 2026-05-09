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
}
