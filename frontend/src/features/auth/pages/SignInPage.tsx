import { useEffect } from 'react'
import { Button, Card, CardBody, Center, Heading, Text, VStack } from '@chakra-ui/react'
import { authStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'

export function SignInPage() {
  const navigate = useNavigate()
  const token = authStore((state) => state.token)

  useEffect(() => {
    // Run once on mount — handle OAuth callback OR already-logged-in case
    const params = new URLSearchParams(window.location.search)
    const jwtFromUrl = params.get('jwt')
    const emailFromUrl = params.get('email')
    const nameFromUrl = params.get('name')

    console.log('[SignIn] mount. jwtInUrl=', !!jwtFromUrl, 'tokenInStore=', !!authStore.getState().token)

    if (jwtFromUrl && emailFromUrl && nameFromUrl) {
      const setToken = authStore.getState().setToken
      const setUser = authStore.getState().setUser

      setToken(jwtFromUrl)
      setUser({
        id: '',
        email: emailFromUrl,
        name: nameFromUrl,
        role: 'user',
      })

      const stored = localStorage.getItem('meetSync_postLoginRedirect')
      console.log('[SignIn] postLoginRedirect from localStorage:', stored)
      const target = stored || '/'
      if (stored) localStorage.removeItem('meetSync_postLoginRedirect')

      window.history.replaceState({}, document.title, '/signin')
      console.log('[SignIn] OAuth complete → navigating to', target)
      navigate(target, { replace: true })
      return
    }

    // No OAuth params: if already logged in, just go home
    if (authStore.getState().token) {
      console.log('[SignIn] already logged in (no jwt in url) → navigating to /')
      navigate('/', { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleGoogleSignIn = () => {
    const backendBase = import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, '')
    const origin = encodeURIComponent(window.location.origin)
    window.location.href = `${backendBase}/auth/google?origin=${origin}`
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
