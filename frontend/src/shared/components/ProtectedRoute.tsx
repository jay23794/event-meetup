import { Navigate } from 'react-router-dom'
import { authStore } from '../../features/auth/store/authStore'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = authStore((state) => state.token)

  if (!token) {
    return <Navigate to="/signin" replace />
  }

  return <>{children}</>
}
