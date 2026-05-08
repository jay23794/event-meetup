import { create } from 'zustand'
import { User } from '../types'

interface AuthState {
  token: string | null
  user: User | null
  setToken: (token: string) => void
  setUser: (user: User) => void
  logout: () => void
}

const STORAGE_KEY = 'meet_sync_token'
const USER_STORAGE_KEY = 'meet_sync_user'

export const authStore = create<AuthState>((set) => {
  const storedToken = localStorage.getItem(STORAGE_KEY)
  const storedUser = localStorage.getItem(USER_STORAGE_KEY)

  return {
    token: storedToken,
    user: storedUser ? JSON.parse(storedUser) : null,

    setToken: (token: string) => {
      localStorage.setItem(STORAGE_KEY, token)
      set({ token })
    },

    setUser: (user: User) => {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
      set({ user })
    },

    logout: () => {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(USER_STORAGE_KEY)
      set({ token: null, user: null })
    },
  }
})
