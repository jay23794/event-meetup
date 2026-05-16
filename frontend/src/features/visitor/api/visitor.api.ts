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
  nextCursor: number | null
  total: number
}

export interface ScannedBoothsPage {
  booths: ScannedBoothEntry[]
  nextCursor: number | null
  total: number
}

export const visitorApi = {
  listScannedBooths: async (
    params: { limit?: number; cursor?: number } = {}
  ): Promise<ScannedBoothsPage> => {
    const search = new URLSearchParams()
    if (params.limit !== undefined) search.set('limit', String(params.limit))
    if (params.cursor !== undefined) search.set('cursor', String(params.cursor))
    const qs = search.toString()
    const response = await axios.get<ApiResponse<ListResponse>>(
      `/visitor/scanned-booths${qs ? `?${qs}` : ''}`
    )
    return response.data.data
  },
}
