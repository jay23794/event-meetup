import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Box,
  Button,
  Card,
  CardBody,
  Heading,
  VStack,
  HStack,
  Text,
  Badge,
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Icon,
  SimpleGrid,
  LinkBox,
  LinkOverlay,
} from '@chakra-ui/react'
import { FiDownload, FiFileText, FiCheck } from 'react-icons/fi'
import { PageContainer } from '../../../shared/components/PageContainer'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { exhibitorBoothsPublicApi } from '../api/exhibitorBooths.public.api'
import { authStore } from '../../auth/store/authStore'

const checkInSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
})

type CheckInFormData = z.infer<typeof checkInSchema>

interface ScannedBooth {
  boothName: string
  qrId: string
  scannedAt: string
}

export function PublicBoothPage() {
  const { qrId } = useParams<{ qrId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const token = authStore((state) => state.token)
  const user = authStore((state) => state.user)
  const [checkInState, setCheckInState] = useState<'idle' | 'success' | 'already'>('idle')

  // After a successful check-in (or "already checked in"), send the visitor to
  // their scanned-booths page so they can see the doc list.
  useEffect(() => {
    if (checkInState === 'idle') return
    queryClient.invalidateQueries({ queryKey: ['visitor', 'scannedBooths'] })
    const timer = setTimeout(() => navigate('/visitor'), 1500)
    return () => clearTimeout(timer)
  }, [checkInState, navigate, queryClient])

  useEffect(() => {
    console.log('[PublicBoothPage] mounted. qrId=', qrId, 'token=', token ? 'present' : 'null')
    if (!token && qrId) {
      const path = `/exhibitor/${qrId}`
      console.log('[PublicBoothPage] no token → saving path & redirecting to OAuth:', path)
      localStorage.setItem('meetSync_postLoginRedirect', path)
      const backendBase = import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, '')
      const origin = encodeURIComponent(window.location.origin)
      window.location.href = `${backendBase}/auth/google?origin=${origin}`
    }
  }, [token, qrId])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckInFormData>({
    resolver: zodResolver(checkInSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  })

  const boothQuery = useQuery({
    queryKey: ['publicBooth', qrId],
    queryFn: () => exhibitorBoothsPublicApi.getBoothByQrId(qrId || ''),
    enabled: !!qrId && !!token,
  })

  const documentsQuery = useQuery({
    queryKey: ['publicDocuments', qrId],
    queryFn: () => exhibitorBoothsPublicApi.listPublicDocuments(qrId || ''),
    enabled: !!qrId && !!token && boothQuery.isSuccess,
  })

  const checkInMutation = useMutation({
    mutationFn: (data: CheckInFormData) => {
      console.log('[PublicBoothPage] submitting check-in', { qrId, ...data })
      return exhibitorBoothsPublicApi.checkIn(qrId || '', data)
    },
    onError: (error) => {
      console.error('[PublicBoothPage] check-in failed', error)
    },
    onSuccess: (result) => {
      console.log('[PublicBoothPage] check-in result', result)
      if (result.alreadyCheckedIn) {
        setCheckInState('already')
      } else {
        setCheckInState('success')
        // Save to localStorage
        const key = 'meetSync_scannedBooths'
        const existing = JSON.parse(localStorage.getItem(key) ?? '[]') as ScannedBooth[]
        const scannedBooth: ScannedBooth = {
          boothName: result.booth.boothName,
          qrId: qrId || '',
          scannedAt: new Date().toISOString(),
        }
        localStorage.setItem(key, JSON.stringify([scannedBooth, ...existing]))
      }
    },
  })

  if (!qrId) {
    return (
      <VStack spacing={0} minH="100vh" w="full" bg="brand.200">
        <PageContainer>
          <ErrorMessage message="Invalid QR code" />
        </PageContainer>
      </VStack>
    )
  }

  if (!token) {
    return (
      <VStack spacing={0} minH="100vh" w="full" bg="brand.200" justify="center">
        <VStack spacing={4}>
          <LoadingSpinner />
          <Text color="brand.900">Redirecting to sign-in...</Text>
        </VStack>
      </VStack>
    )
  }

  if (boothQuery.isLoading) {
    return (
      <VStack spacing={0} minH="100vh" w="full" bg="brand.200">
        <PageContainer>
          <LoadingSpinner />
        </PageContainer>
      </VStack>
    )
  }

  if (boothQuery.error || !boothQuery.data) {
    return (
      <VStack spacing={0} minH="100vh" w="full" bg="brand.200">
        <PageContainer>
          <ErrorMessage
            message="Booth not found. Please check the QR code and try again."
            onRetry={() => window.location.reload()}
          />
        </PageContainer>
      </VStack>
    )
  }

  const booth = boothQuery.data
  const documents = documentsQuery.data || []

  return (
    <VStack spacing={0} minH="100vh" w="full" bg="brand.200">
      <PageContainer>
        <VStack spacing={8} maxW="3xl" mx="auto" align="stretch">
          {/* Booth Header */}
          <Card bg="brand.50" borderWidth="2px" borderColor="brand.700">
            <CardBody>
              <VStack spacing={3} align="start">
                <Heading size="lg" color="brand.900">
                  {booth.boothName}
                </Heading>
                <Text color="gray.700" fontSize="md">
                  {booth.description}
                </Text>
                <HStack spacing={4} pt={2}>
                  <Badge colorScheme="brand">QR ID: {booth.qrId}</Badge>
                  <Badge colorScheme="gray">{booth.scanCount} visitors</Badge>
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Documents Section */}
          {documents.length > 0 ? (
            <Box>
              <Heading size="md" mb={4}>
                Shared Documents
              </Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {documents.map((doc) => (
                  <LinkBox
                    key={doc.id}
                    as={Card}
                    _hover={{ shadow: 'md' }}
                    transition="all 0.2s"
                  >
                    <CardBody>
                      <HStack spacing={3}>
                        <Icon
                          as={FiFileText}
                          w={6}
                          h={6}
                          color="brand.700"
                          flexShrink={0}
                        />
                        <VStack align="start" spacing={1} flex={1} minW={0}>
                          <Text fontWeight="medium" noOfLines={2}>
                            {doc.fileName}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {doc.fileType === 'card' ? 'Business Card' : 'Brochure'}
                          </Text>
                        </VStack>
                        <Icon as={FiDownload} w={4} h={4} color="gray.400" flexShrink={0} />
                      </HStack>
                      <LinkOverlay
                        href={doc.driveFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    </CardBody>
                  </LinkBox>
                ))}
              </SimpleGrid>
            </Box>
          ) : (
            <Card bg="gray.50">
              <CardBody textAlign="center">
                <Text color="gray.600" fontSize="sm">
                  No files shared yet
                </Text>
              </CardBody>
            </Card>
          )}

          {/* Check-in Form */}
          {checkInState === 'idle' && (
            <Card>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Heading size="md">Check In</Heading>
                  <form onSubmit={handleSubmit((data) => checkInMutation.mutate(data))}>
                    <VStack spacing={4}>
                      <FormControl isInvalid={!!errors.name}>
                        <FormLabel>Name</FormLabel>
                        <Input
                          placeholder="Your name"
                          {...register('name')}
                          type="text"
                        />
                        {errors.name && (
                          <FormErrorMessage>{errors.name.message}</FormErrorMessage>
                        )}
                      </FormControl>

                      <FormControl isInvalid={!!errors.email}>
                        <FormLabel>Email</FormLabel>
                        <Input
                          placeholder="your@email.com"
                          {...register('email')}
                          type="email"
                        />
                        {errors.email && (
                          <FormErrorMessage>{errors.email.message}</FormErrorMessage>
                        )}
                      </FormControl>

                      <FormControl>
                        <FormLabel>Phone (optional)</FormLabel>
                        <Input
                          placeholder="+1 (555) 000-0000"
                          {...register('phone')}
                          type="tel"
                        />
                      </FormControl>

                      <Button
                        type="submit"
                        w="full"
                        bg="brand.800"
                        color="white"
                        _hover={{ bg: 'brand.700' }}
                        isLoading={checkInMutation.isPending}
                      >
                        Complete Check-in
                      </Button>

                      {checkInMutation.isError && (
                        <Text color="red.600" fontSize="sm">
                          Check-in failed. Please try again.
                        </Text>
                      )}
                    </VStack>
                  </form>
                </VStack>
              </CardBody>
            </Card>
          )}

          {/* Success Message */}
          {checkInState === 'success' && (
            <Card bg="green.50" borderColor="green.200" borderWidth="1px">
              <CardBody>
                <VStack spacing={3} align="start">
                  <HStack>
                    <Icon as={FiCheck} color="green.600" w={6} h={6} />
                    <Heading size="md" color="green.700">
                      You're checked in!
                    </Heading>
                  </HStack>
                  <Text color="green.700">
                    {booth.boothName} has your details. Thanks for visiting!
                  </Text>
                  <Button
                    size="sm"
                    bg="green.600"
                    color="white"
                    _hover={{ bg: 'green.700' }}
                    onClick={() => navigate('/visitor')}
                  >
                    View my scanned booths
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          )}

          {/* Already Checked In Message */}
          {checkInState === 'already' && (
            <Card bg="blue.50" borderColor="blue.200" borderWidth="1px">
              <CardBody>
                <VStack spacing={3} align="start">
                  <HStack>
                    <Icon as={FiCheck} color="blue.600" w={6} h={6} />
                    <Heading size="md" color="blue.700">
                      Already checked in
                    </Heading>
                  </HStack>
                  <Text color="blue.700">
                    You've already visited this booth. We have your information!
                  </Text>
                  <Button
                    size="sm"
                    bg="blue.600"
                    color="white"
                    _hover={{ bg: 'blue.700' }}
                    onClick={() => navigate('/visitor')}
                  >
                    View my scanned booths
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          )}
        </VStack>
      </PageContainer>
    </VStack>
  )
}
