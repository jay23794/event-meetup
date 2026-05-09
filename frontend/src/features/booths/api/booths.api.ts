import axios from '../../../shared/api/axios'
import { ApiResponse } from '../../../shared/types/api.types'
import { Booth, CreateBoothInput } from '../types'

interface BoothsResponse {
  booths: Booth[]
  nextCursor?: number | string
  total: number
}

export interface CreateBoothResponse {
  boothId: string
  sheetRowNumber: number
}

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
      booths: response.data.data.booths,
      nextCursor:
        response.data.data.nextCursor !== undefined
          ? String(response.data.data.nextCursor)
          : undefined,
      total: response.data.data.total,
    }
  },

  getBooth: async (eventId: string, rowNumber: number): Promise<Booth> => {
    const response = await axios.get<ApiResponse<{ booth: Booth }>>(
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
