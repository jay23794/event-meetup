import axios from '../../../shared/api/axios'
import { ApiResponse } from '../../../shared/types/api.types'
import { ExhibitorBooth, ExhibitorBoothDocument } from '../types'

type ExhibitorBoothResponse = Omit<ExhibitorBooth, 'id'> & {
  _id?: string
  id?: string
}

const mapBooth = (booth: ExhibitorBoothResponse): ExhibitorBooth =>
  ({
    ...booth,
    id: booth._id || booth.id || '',
  } as ExhibitorBooth)

export const exhibitorBoothsPublicApi = {
  getBoothByQrId: async (qrId: string): Promise<ExhibitorBooth> => {
    const response = await axios.get<ApiResponse<{ booth: ExhibitorBoothResponse }>>(
      `/public/exhibitor-booths/${qrId}`
    )
    return mapBooth(response.data.data.booth)
  },

  listPublicDocuments: async (
    qrId: string
  ): Promise<ExhibitorBoothDocument[]> => {
    const response = await axios.get<
      ApiResponse<{ documents: ExhibitorBoothDocument[] }>
    >(`/public/exhibitor-booths/${qrId}/documents`)
    return response.data.data.documents
  },

  checkIn: async (
    qrId: string,
    data: { name: string; email: string; phone?: string }
  ): Promise<{ alreadyCheckedIn: boolean; booth: any }> => {
    const response = await axios.post<
      ApiResponse<{ alreadyCheckedIn: boolean; booth: any }>
    >(`/public/exhibitor-booths/${qrId}/checkin`, data)
    return response.data.data
  },

  listBoothDocuments: async (
    boothId: string
  ): Promise<ExhibitorBoothDocument[]> => {
    const response = await axios.get<
      ApiResponse<{ documents: ExhibitorBoothDocument[] }>
    >(`/exhibitor/booths/${boothId}/documents`)
    return response.data.data.documents
  },
}
