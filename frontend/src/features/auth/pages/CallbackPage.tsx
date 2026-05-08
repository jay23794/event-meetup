import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Center } from '@chakra-ui/react'
import { authStore } from '../store/authStore'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { authApi } from '../api/auth.api'
import { useToast } from '../../../shared/hooks/useToast'

export function CallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const setToken = authStore((state) => state.setToken)
  const setUser = authStore((state) => state.setUser)
  const { error: showError } = useToast()
  const code = searchParams.get('code')

  const handleCallback = async () => {
    if (!code) {
      showError('No authorization code received')
      return
    }

    try {
      const { jwt, user } = await authApi.exchangeCode(code)
      setToken(jwt)
      setUser(user)
      navigate('/')
    } catch (err) {
      showError('Failed to complete sign in. Please try again.')
    }
  }

  useEffect(() => {
    handleCallback()
  }, [code])

  return (
    <Center minH="100vh" bg="brand.200">
      {code ? (
        <LoadingSpinner fullPage />
      ) : (
        <ErrorMessage
          message="No authorization code received. Please try signing in again."
          onRetry={() => navigate('/signin')}
        />
      )}
    </Center>
  )
}
