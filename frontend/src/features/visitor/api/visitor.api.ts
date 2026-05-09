import axios from '../../../shared/api/axios'
import { ApiResponse } from '../../../shared/types/api.types'

export interface SharedDocument {
  url: string
  fileId?: string
  fileName?: string
  mimeType?: string
  fileType?: 'card' | 'brochure'
  thumbnailUrl?: string
}

export interface ScannedBoothEntry {
  timestamp: string
  boothName: string
  eventName: string
  qrId: string
  sharedDocuments: SharedDocument[]
}

interface ListResponse {
  booths: ScannedBoothEntry[]
}

export const visitorApi = {
  listScannedBooths: async (): Promise<ScannedBoothEntry[]> => {
    const response = await axios.get<ApiResponse<ListResponse>>('/visitor/scanned-booths')
    return response.data.data.booths
  },
}
