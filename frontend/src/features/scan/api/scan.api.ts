import axios from '../../../shared/api/axios'
import { ApiResponse } from '../../../shared/types/api.types'
import { ScanResult } from '../types'

export const scanApi = {
  processScan: async (imageFile: File, eventId: string): Promise<ScanResult> => {
    const formData = new FormData()
    formData.append('image', imageFile)
    formData.append('eventId', eventId)

    const response = await axios.post<ApiResponse<ScanResult>>(
      '/scan',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data.data
  },
}
