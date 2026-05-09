import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  CardBody,
  Divider,
  Heading,
  HStack,
  SimpleGrid,
  Text,
  VStack,
  Icon,
} from '@chakra-ui/react'
import { FiCamera, FiPlus, FiMaximize, FiX, FiClock } from 'react-icons/fi'
import { Layout } from '../../../shared/components/Layout'
import { PageContainer } from '../../../shared/components/PageContainer'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { EmptyState } from '../../../shared/components/EmptyState'
import { useToast } from '../../../shared/hooks/useToast'
import { useEvents } from '../../events/hooks/useEvents'

interface ScannedBooth {
  boothName: string
  qrId: string
  scannedAt: string
}

export function VisitorHomePage() {
  const navigate = useNavigate()
  const { events, isLoading, error } = useEvents()
  const { info } = useToast()
  const eventsRef = useRef<HTMLDivElement>(null)
  const [scannedBooths, setScannedBooths] = useState<ScannedBooth[]>([])

  useEffect(() => {
    const key = 'meetSync_scannedBooths'
    const stored = localStorage.getItem(key)
    if (stored) {
      try {
        setScannedBooths(JSON.parse(stored))
      } catch {
        // Ignore parse errors
      }
    }
  }, [])

  const handleScanQr = () => {
    info('Camera QR scanner coming soon — for now, scan with your phone camera and follow the link.')
  }

  const handleCaptureCard = () => {
    if (events.length === 0) {
      info('Create an event first to capture business cards')
      navigate('/visitor/events/new')
      return
    }
    eventsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleRemoveScanned = (qrId: string) => {
    const key = 'meetSync_scannedBooths'
    const updated = scannedBooths.filter((b) => b.qrId !== qrId)
    localStorage.setItem(key, JSON.stringify(updated))
    setScannedBooths(updated)
  }

  const handleClearHistory = () => {
    const key = 'meetSync_scannedBooths'
    localStorage.removeItem(key)
    setScannedBooths([])
  }

  return (
    <Layout>
      <PageContainer>
        <VStack align="stretch" spacing={8} maxW="3xl" mx="auto">
          <VStack align="start" spacing={1}>
            <Heading size="lg" color="brand.900">
              Visitor mode
            </Heading>
            <Text color="gray.600">
              Capture leads from booths you visit.
            </Text>
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Card
              as="button"
              type="button"
              onClick={handleScanQr}
              cursor="pointer"
              textAlign="left"
              transition="transform 0.15s, box-shadow 0.15s"
              _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
            >
              <CardBody>
                <VStack align="start" spacing={3}>
                  <HStack spacing={3}>
                    <Text fontSize="2xl" color="brand.700">
                      <FiMaximize />
                    </Text>
                    <Heading size="md" color="brand.900">
                      Scan a Booth QR
                    </Heading>
                  </HStack>
                  <Text fontSize="sm" color="gray.600">
                    Open the camera and point it at the QR code on the booth.
                  </Text>
                </VStack>
              </CardBody>
            </Card>

            <Card
              as="button"
              type="button"
              onClick={handleCaptureCard}
              cursor="pointer"
              textAlign="left"
              transition="transform 0.15s, box-shadow 0.15s"
              _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
            >
              <CardBody>
                <VStack align="start" spacing={3}>
                  <HStack spacing={3}>
                    <Text fontSize="2xl" color="brand.700">
                      <FiCamera />
                    </Text>
                    <Heading size="md" color="brand.900">
                      No QR? Capture a card or brochure
                    </Heading>
                  </HStack>
                  <Text fontSize="sm" color="gray.600">
                    Pick the event you're at, then capture the photo. We'll OCR
                    the contact and save it to Drive + your sheet.
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>

          <Divider />

          <VStack align="stretch" spacing={4} ref={eventsRef}>
            <HStack justify="space-between" wrap="wrap">
              <Heading size="md" color="brand.900">
                Pick an event
              </Heading>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<FiPlus />}
                onClick={() => navigate('/visitor/events/new')}
              >
                New event
              </Button>
            </HStack>

            {isLoading && <LoadingSpinner />}

            {error && (
              <ErrorMessage
                message="Could not load events"
                onRetry={() => window.location.reload()}
              />
            )}

            {!isLoading && !error && events.length === 0 && (
              <EmptyState
                title="No events yet"
                description="Create an event so we know what trade show you're capturing leads at."
              />
            )}

            {!isLoading && !error && events.length > 0 && (
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                {events.map((event) => (
                  <Box
                    key={event.id}
                    as="button"
                    type="button"
                    onClick={() => navigate(`/visitor/events/${event.id}/scan`)}
                    p={4}
                    bg="white"
                    borderWidth="1px"
                    borderColor="gray.200"
                    rounded="md"
                    textAlign="left"
                    _hover={{ borderColor: 'brand.700', bg: 'brand.50' }}
                    transition="border-color 0.15s, background-color 0.15s"
                  >
                    <Text fontWeight="medium" color="brand.900" noOfLines={1}>
                      {event.name}
                    </Text>
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      {event.boothCount} booth{event.boothCount === 1 ? '' : 's'} captured
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>
            )}
          </VStack>

          {scannedBooths.length > 0 && (
            <>
              <Divider />

              <VStack align="stretch" spacing={4}>
                <HStack justify="space-between" wrap="wrap">
                  <Heading size="md" color="brand.900">
                    Scanned Booths
                  </Heading>
                  <Button
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={handleClearHistory}
                  >
                    Clear history
                  </Button>
                </HStack>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                  {scannedBooths.map((booth) => (
                    <Card
                      key={booth.qrId}
                      position="relative"
                      transition="box-shadow 0.15s"
                      _hover={{ shadow: 'md' }}
                    >
                      <CardBody>
                        <VStack align="start" spacing={2}>
                          <HStack justify="space-between" w="full">
                            <Text fontWeight="medium" color="brand.900" flex={1} noOfLines={1}>
                              {booth.boothName}
                            </Text>
                            <Box
                              as="button"
                              type="button"
                              onClick={() => handleRemoveScanned(booth.qrId)}
                              p={1}
                              borderRadius="md"
                              _hover={{ bg: 'gray.100' }}
                            >
                              <Icon as={FiX} w={4} h={4} color="gray.500" />
                            </Box>
                          </HStack>
                          <HStack spacing={1} fontSize="xs" color="gray.500">
                            <Icon as={FiClock} w={3} h={3} />
                            <Text>
                              {new Date(booth.scannedAt).toLocaleDateString()} at{' '}
                              {new Date(booth.scannedAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Text>
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              </VStack>
            </>
          )}
        </VStack>
      </PageContainer>
    </Layout>
  )
}
