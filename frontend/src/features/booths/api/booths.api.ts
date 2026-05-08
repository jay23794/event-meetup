import axios from '../../../shared/api/axios'
import { ApiResponse } from '../../../shared/types/api.types'
import { Booth, CreateBoothInput } from '../types'

interface BoothsResponse {
  booths: Booth[]
  nextCursor?: string
  total: number
}

interface CreateBoothResponse {
  boothId: string
  sheetRowNumber: number
}

export const boothsApi = {
  listBooths: async (
    eventId: string,
    limit: number = 50,
    cursor?: string
  ): Promise<BoothsResponse> => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(cursor && { cursor }),
    })
    const response = await axios.get<ApiResponse<BoothsResponse>>(
      `/events/${eventId}/booths?${params}`
    )
    return response.data.data
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
