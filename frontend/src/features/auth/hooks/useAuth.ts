import { useQuery } from '@tanstack/react-query'
import { authApi } from '../api/auth.api'
import { authStore } from '../store/authStore'

export function useAuth() {
  const token = authStore((state) => state.token)
  const user = authStore((state) => state.user)
  const setUser = authStore((state) => state.setUser)

  const { data, isLoading, error } = useQuery({
    queryKey: ['user'],
    queryFn: authApi.getMe,
    enabled: !!token,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  if (data && !user) {
    setUser(data)
  }

  return {
    user: data || user,
    isLoading,
    error,
    isAuthenticated: !!token,
  }
}
