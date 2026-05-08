import axios from '../../../shared/api/axios'
import { ApiResponse } from '../../../shared/types/api.types'
import { Booth, CreateBoothInput } from '../types'

type BoothResponse = {
  _id: string
  eventId: string
  boothName?: string
  scanCount: number
  hasVoiceNote: boolean
  sheetRowNumber: number
  createdAt: string
}

interface BoothsResponse {
  booths: BoothResponse[]
  nextCursor?: string
  total: number
}

interface CreateBoothResponse {
  boothId: string
  sheetRowNumber: number
}

export interface BoothDetail {
  timestamp: string
  boothName: string
  scanCount: number
  names: string
  phones: string
  emails: string
  companies: string
  rawOcr: string
  voiceTranscript?: string
  imageUrls: string
}

const mapBoothResponse = (booth: BoothResponse): Booth => ({
  ...booth,
  id: booth._id,
})

export const boothsApi = {
  listBooths: async (
    eventId: string,
    limit: number = 50,
    cursor?: string
  ): Promise<{ booths: Booth[]; nextCursor?: string; total: number }> => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(cursor && { cursor }),
    })
    const response = await axios.get<ApiResponse<BoothsResponse>>(
      `/events/${eventId}/booths?${params}`
    )
    return {
      booths: response.data.data.booths.map(mapBoothResponse),
      nextCursor: response.data.data.nextCursor,
      total: response.data.data.total,
    }
  },

  getBooth: async (
    eventId: string,
    rowNumber: number
  ): Promise<BoothDetail> => {
    const response = await axios.get<ApiResponse<{ booth: BoothDetail }>>(
      `/events/${eventId}/booths/${rowNumber}`
    )
    return response.data.data.booth
  },

  createBooth: async (
    eventId: string,
    input: CreateBoothInput
  ): Promise<CreateBoothResponse> => {
    const response = await axios.post<ApiResponse<CreateBoothResponse>>(
      `/events/${eventId}/booths`,
      input
    )
    return response.data.data
  },
}
