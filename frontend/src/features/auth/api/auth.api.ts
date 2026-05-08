import axios from '../../../shared/api/axios'
import { ApiResponse } from '../../../shared/types/api.types'
import { AuthResponse, User } from '../types'

const API_URL = import.meta.env.VITE_API_URL

export const authApi = {
  getMe: async (): Promise<User> => {
    const response = await axios.get<ApiResponse<{ user: User }>>(
      '/auth/me'
    )
    return response.data.data.user
  },

  logout: async (): Promise<void> => {
    await axios.post('/auth/logout')
  },

  getGoogleAuthUrl: (): string => {
    return `${API_URL}/auth/google`
  },

  exchangeCode: async (code: string): Promise<AuthResponse> => {
    const response = await axios.get<ApiResponse<AuthResponse>>(
      `/auth/google/callback?code=${code}`
    )
    return response.data.data
  },
}
