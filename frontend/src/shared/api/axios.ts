import axios from 'axios'
import { authStore } from '../../features/auth/store/authStore'


const baseURL = import.meta.env.VITE_API_URL

const instance = axios.create({
  baseURL,
  timeout: 30000,
})

instance.interceptors.request.use((config) => {
  const token = authStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authStore.getState().logout()
      window.location.href = '/signin'
    }

    if (error.response?.status === 412) {
      // Precondition Failed - missing refresh token
    }

    return Promise.reject(error)
  },
)

export default instance
