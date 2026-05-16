import { useEffect } from 'react'
import { Box, Button, Center, Heading, Image, Text, VStack } from '@chakra-ui/react'
import { authStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import bannerSvg from '../../../assets/banner.svg'
import googleIconSvg from '../../../assets/google-icon.svg'
import { LegalFooter } from '../../../shared/components/LegalFooter'

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
    <VStack
      minH="100vh"
      w="full"
      bg="brand.200"
      justify="space-between"
      align="center"
      py={{ base: 12, md: 16 }}
      px={6}
      spacing={8}
    >
     

      <VStack flex={1} w="full" justify="center" spacing={6}>
        <Image
          src={bannerSvg}
          alt="Meet Sync"
          maxW={{ base: '280px', md: '360px' }}
          w="full"
          h="auto"
        />
        <VStack spacing={2} textAlign="center" px={4}>
          <Heading size="lg" color="brand.800" letterSpacing="-0.5px">
            Meet Sync
          </Heading>
          <Text color="brand.600" fontSize="sm">
            Sign in to manage your event booth scans
          </Text>
        </VStack>
      </VStack>

      <Box w="full" maxW="sm">
        <Button
          w="full"
          size="lg"
          bg="#003F8F"
          color="white"
          borderWidth="1px"
          borderColor="#003F8F"
          _hover={{ bg: 'brand.700', borderColor: 'brand.700' }}
          _active={{ bg: 'brand.700', borderColor: 'brand.700' }}
          leftIcon={<Image src={googleIconSvg} alt="" w="20px" h="20px" />}
          onClick={handleGoogleSignIn}
          fontWeight={600}
        >
          Sign in with Google
        </Button>
      </Box>

      <LegalFooter />
    </VStack>
  )
}
