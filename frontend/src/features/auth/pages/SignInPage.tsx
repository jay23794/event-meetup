import { useEffect } from 'react'
import { Button, Card, CardBody, Center, Heading, Text, VStack } from '@chakra-ui/react'
import { authStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'

export function SignInPage() {
  const navigate = useNavigate()
  const token = authStore((state) => state.token)

  useEffect(() => {
    // If already logged in, redirect to events
    if (token) {
      navigate('/', { replace: true })
      return
    }

    // Check for JWT in query params (from OAuth callback)
    const params = new URLSearchParams(window.location.search)
    const jwtFromUrl = params.get('jwt')
    const emailFromUrl = params.get('email')
    const nameFromUrl = params.get('name')

    if (jwtFromUrl && emailFromUrl && nameFromUrl) {
      const setToken = authStore.getState().setToken
      const setUser = authStore.getState().setUser

      setToken(jwtFromUrl)
      setUser({
        id: '', // Will be fetched from /auth/me if needed
        email: emailFromUrl,
        name: nameFromUrl,
        role: 'user',
      })

      // Clean up URL and redirect
      window.history.replaceState({}, document.title, '/signin')
      navigate('/', { replace: true })
    }
  }, [token, navigate])

  const handleGoogleSignIn = () => {
    const backendUrl = import.meta.env.VITE_API_URL.replace('/api/v1', '')
    window.location.href = `${backendUrl}/auth/google`
  }

  return (
    <Center minH="100vh" bg="brand.200">
      <Card maxW="md" w="full" mx={4}>
        <CardBody>
          <VStack spacing={6}>
            <VStack spacing={2} textAlign="center">
              <Heading size="lg" color="brand.900">
                Meet Sync
              </Heading>
              <Text color="brand.600" fontSize="sm">
                Sign in to manage your event booth scans
              </Text>
            </VStack>

            <Button
              w="full"
              bg="brand.800"
              color="white"
              _hover={{ bg: 'brand.700' }}
              onClick={handleGoogleSignIn}
              size="lg"
            >
              Continue with Google
            </Button>
          </VStack>
        </CardBody>
      </Card>
    </Center>
  )
}
