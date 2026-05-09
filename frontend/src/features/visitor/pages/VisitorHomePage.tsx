import { useRef, useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  CardBody,
  Divider,
  Heading,
  HStack,
  Image,
  Link,
  SimpleGrid,
  Text,
  VStack,
  Icon,
} from '@chakra-ui/react'
import { FiCamera, FiPlus, FiMaximize, FiX, FiClock, FiFileText, FiImage } from 'react-icons/fi'
import type { IconType } from 'react-icons'
import { FaFilePdf } from 'react-icons/fa'
import type { SharedDocument } from '../api/visitor.api'
import { Layout } from '../../../shared/components/Layout'
import { PageContainer } from '../../../shared/components/PageContainer'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { EmptyState } from '../../../shared/components/EmptyState'
import { useToast } from '../../../shared/hooks/useToast'
import { useEvents } from '../../events/hooks/useEvents'
import { useScannedBooths } from '../hooks/useScannedBooths'

interface ScannedBooth {
  boothName: string
  qrId: string
  scannedAt: string
  sharedDocuments?: SharedDocument[]
  eventName?: string
}

function isImage(mimeType?: string) {
  return !!mimeType && mimeType.startsWith('image/')
}

function isPdf(mimeType?: string) {
  return mimeType === 'application/pdf'
}

function getDocIcon(mimeType?: string): IconType {
  if (isImage(mimeType)) return FiImage
  if (isPdf(mimeType)) return FaFilePdf
  return FiFileText
}

export function VisitorHomePage() {
  const navigate = useNavigate()
  const { events, isLoading: eventsLoading, error: eventsError } = useEvents()
  const { info } = useToast()
  const eventsRef = useRef<HTMLDivElement>(null)
  const { scannedBooths: serverBooths, isLoading: serverLoading, error: serverError } = useScannedBooths()
  const [localBooths, setLocalBooths] = useState<ScannedBooth[]>([])

  useEffect(() => {
    const key = 'meetSync_scannedBooths'
    const stored = localStorage.getItem(key)
    if (stored) {
      try {
        setLocalBooths(JSON.parse(stored))
      } catch {
        // Ignore parse errors
      }
    }
  }, [])

  // Merge server (source of truth) + local (covers fresh scans not yet in sheet),
  // dedupe by qrId, prefer server entry.
  const scannedBooths: ScannedBooth[] = useMemo(() => {
    const byQr = new Map<string, ScannedBooth>()
    for (const b of localBooths) {
      if (b.qrId) byQr.set(b.qrId, b)
    }
    for (const b of serverBooths) {
      byQr.set(b.qrId, {
        qrId: b.qrId,
        boothName: b.boothName,
        scannedAt: b.timestamp,
        eventName: b.eventName,
        sharedDocuments: b.sharedDocuments,
      })
    }
    return Array.from(byQr.values()).sort(
      (a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime()
    )
  }, [serverBooths, localBooths])

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
    const updated = localBooths.filter((b) => b.qrId !== qrId)
    localStorage.setItem(key, JSON.stringify(updated))
    setLocalBooths(updated)
  }

  const handleClearHistory = () => {
    const key = 'meetSync_scannedBooths'
    localStorage.removeItem(key)
    setLocalBooths([])
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

          {/* Hidden for now — keeping for future use
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
          */}

          {serverLoading && scannedBooths.length === 0 && <LoadingSpinner />}

          {serverError && scannedBooths.length === 0 && (
            <ErrorMessage
              message="Could not load your scanned booths"
              onRetry={() => window.location.reload()}
            />
          )}

          {!serverLoading && !serverError && scannedBooths.length === 0 && (
            <EmptyState
              title="No booths scanned yet"
              description="Use your phone camera to scan a booth QR code. The booth will appear here once you check in."
            />
          )}

          {scannedBooths.length > 0 && (
            <>
              <VStack align="stretch" spacing={4}>
                <HStack justify="space-between" wrap="wrap">
                  <Heading size="md" color="brand.900">
                    Scanned Booths
                  </Heading>
                  {localBooths.length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={handleClearHistory}
                    >
                      Clear local history
                    </Button>
                  )}
                </HStack>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                  {scannedBooths.map((booth) => {
                    const isLocalOnly = localBooths.some((l) => l.qrId === booth.qrId)
                      && !serverBooths.some((s) => s.qrId === booth.qrId)
                    return (
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
                              {isLocalOnly && (
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
                              )}
                            </HStack>
                            {booth.eventName && (
                              <Text fontSize="xs" color="gray.600" noOfLines={1}>
                                {booth.eventName}
                              </Text>
                            )}
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
                            {booth.sharedDocuments && booth.sharedDocuments.length > 0 && (
                              <VStack align="start" spacing={2} pt={1} w="full">
                                <Text fontSize="xs" color="gray.500" fontWeight="medium">
                                  Shared documents
                                </Text>
                                <SimpleGrid columns={3} spacing={2} w="full">
                                  {booth.sharedDocuments.map((doc, idx) => {
                                    const label = doc.fileName || `Document ${idx + 1}`
                                    const showThumb = isImage(doc.mimeType) && doc.thumbnailUrl
                                    return (
                                      <Link
                                        key={doc.url + idx}
                                        href={doc.url}
                                        isExternal
                                        _hover={{ textDecoration: 'none' }}
                                      >
                                        <VStack
                                          spacing={1}
                                          p={2}
                                          borderWidth="1px"
                                          borderColor="gray.200"
                                          rounded="md"
                                          bg="white"
                                          _hover={{ borderColor: 'brand.700', shadow: 'sm' }}
                                          transition="all 0.15s"
                                        >
                                          <Box
                                            w="full"
                                            h="64px"
                                            display="flex"
                                            alignItems="center"
                                            justifyContent="center"
                                            bg={showThumb ? 'gray.50' : isPdf(doc.mimeType) ? 'red.50' : 'brand.50'}
                                            rounded="sm"
                                            overflow="hidden"
                                          >
                                            {showThumb ? (
                                              <Image
                                                src={doc.thumbnailUrl}
                                                alt={label}
                                                objectFit="cover"
                                                w="full"
                                                h="full"
                                                fallback={
                                                  <Icon as={FiImage} w={6} h={6} color="brand.700" />
                                                }
                                              />
                                            ) : (
                                              <Icon
                                                as={getDocIcon(doc.mimeType)}
                                                w={6}
                                                h={6}
                                                color={isPdf(doc.mimeType) ? 'red.600' : 'brand.700'}
                                              />
                                            )}
                                          </Box>
                                          <Text
                                            fontSize="2xs"
                                            color="gray.700"
                                            noOfLines={1}
                                            w="full"
                                            textAlign="center"
                                          >
                                            {label}
                                          </Text>
                                        </VStack>
                                      </Link>
                                    )
                                  })}
                                </SimpleGrid>
                              </VStack>
                            )}
                          </VStack>
                        </CardBody>
                      </Card>
                    )
                  })}
                </SimpleGrid>
              </VStack>
            </>
          )}
        </VStack>
      </PageContainer>
    </Layout>
  )
}
