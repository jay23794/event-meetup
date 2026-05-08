import { create } from 'zustand'
import { User } from '../types'

interface AuthState {
  token: string | null
  user: User | null
  googleAccessToken: string | null
  setToken: (token: string) => void
  setUser: (user: User) => void
  setGoogleAccessToken: (token: string) => void
  logout: () => void
}

const STORAGE_KEY = 'meet_sync_token'
const USER_STORAGE_KEY = 'meet_sync_user'
const GOOGLE_TOKEN_STORAGE_KEY = 'meet_sync_google_token'

export const authStore = create<AuthState>((set) => {
  const storedToken = localStorage.getItem(STORAGE_KEY)
  const storedUser = localStorage.getItem(USER_STORAGE_KEY)
  const storedGoogleToken = localStorage.getItem(GOOGLE_TOKEN_STORAGE_KEY)

  return {
    token: storedToken,
    user: storedUser ? JSON.parse(storedUser) : null,
    googleAccessToken: storedGoogleToken,

    setToken: (token: string) => {
      localStorage.setItem(STORAGE_KEY, token)
      set({ token })
    },

    setUser: (user: User) => {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
      set({ user })
    },

    setGoogleAccessToken: (token: string) => {
      localStorage.setItem(GOOGLE_TOKEN_STORAGE_KEY, token)
      set({ googleAccessToken: token })
    },

    logout: () => {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(USER_STORAGE_KEY)
      localStorage.removeItem(GOOGLE_TOKEN_STORAGE_KEY)
      set({ token: null, user: null, googleAccessToken: null })
    },
  }
})
