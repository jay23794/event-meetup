import { useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import {
  Box,
  Button,
  Card,
  CardBody,
  HStack,
  Heading,
  Stat,
  StatLabel,
  StatNumber,
  Stack,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react'
import { Layout } from '../../../shared/components/Layout'
import { PageContainer } from '../../../shared/components/PageContainer'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { useToast } from '../../../shared/hooks/useToast'
import { useBooth } from '../hooks/useExhibitorBooths'
import { useEvent } from '../../events/hooks/useEvent'

const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  .booth-qr-print, .booth-qr-print * { visibility: visible !important; }
  .booth-qr-print {
    position: absolute !important;
    inset: 0 !important;
    margin: 0 !important;
    padding: 24px !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 24px !important;
    color: #000 !important;
    background: #fff !important;
  }
  .booth-qr-print canvas {
    width: 320px !important;
    height: 320px !important;
  }
}
`

export function BoothQRPage() {
  const { eventId, boothId } = useParams<{ eventId: string; boothId: string }>()
  const navigate = useNavigate()
  const { success: showSuccess, error: showError } = useToast()

  const { booth, isLoading: boothLoading, error: boothError } = useBooth(boothId || '')
  const { event } = useEvent(eventId || '')

  const qrWrapperRef = useRef<HTMLDivElement>(null)

  if (!boothId || !eventId) {
    return (
      <Layout>
        <PageContainer>
          <ErrorMessage message="Missing booth or event id" />
        </PageContainer>
      </Layout>
    )
  }

  if (boothLoading) {
    return (
      <Layout>
        <PageContainer>
          <LoadingSpinner fullPage />
        </PageContainer>
      </Layout>
    )
  }

  if (boothError || !booth) {
    return (
      <Layout>
        <PageContainer>
          <ErrorMessage
            message="Could not load booth. It may have been deleted or you don't have access."
            onRetry={() => navigate(`/events/${eventId}`)}
          />
        </PageContainer>
      </Layout>
    )
  }

  const qrUrl = booth.qrUrl

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl)
      showSuccess('Link copied')
    } catch {
      showError('Could not copy — please copy manually')
    }
  }

  const handleDownload = () => {
    const canvas = qrWrapperRef.current?.querySelector('canvas')
    if (!canvas) {
      showError('QR code not ready yet')
      return
    }
    const dataUrl = canvas.toDataURL('image/png')
    const safeName = booth.boothName.replace(/[^a-z0-9-_ ]/gi, '').trim() || 'booth'
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `${safeName} QR.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = () => window.print()

  return (
    <Layout>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <PageContainer>
        <Card maxW="2xl" mx="auto">
          <CardBody>
            <VStack spacing={6} align="stretch">
              <Box className="booth-qr-print">
                <VStack spacing={2} textAlign="center">
                  <Heading size="md" color="brand.900">
                    {booth.boothName}
                  </Heading>
                  {event?.name && (
                    <Text fontSize="sm" color="gray.600">
                      {event.name}
                    </Text>
                  )}
                </VStack>

                <Box
                  ref={qrWrapperRef}
                  display="flex"
                  justifyContent="center"
                  py={4}
                >
                  <QRCodeCanvas
                    value={qrUrl}
                    size={256}
                    level="H"
                    includeMargin
                  />
                </Box>
              </Box>

              <Tooltip label="Click to copy" hasArrow>
                <Box
                  as="button"
                  type="button"
                  onClick={handleCopy}
                  textAlign="center"
                  fontFamily="mono"
                  fontSize="sm"
                  color="gray.700"
                  bg="gray.50"
                  borderWidth="1px"
                  borderColor="gray.200"
                  rounded="md"
                  px={3}
                  py={2}
                  wordBreak="break-all"
                  _hover={{ bg: 'gray.100' }}
                >
                  {qrUrl}
                </Box>
              </Tooltip>

              <HStack spacing={3} justify="center" flexWrap="wrap">
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  borderColor="brand.700"
                  color="brand.800"
                >
                  Copy Link
                </Button>
                <Button
                  onClick={handleDownload}
                  bg="brand.800"
                  color="white"
                  _hover={{ bg: 'brand.700' }}
                >
                  Download PNG
                </Button>
                <Button onClick={handlePrint} variant="outline">
                  Print
                </Button>
              </HStack>

              <Stack
                direction={{ base: 'column', sm: 'row' }}
                spacing={6}
                pt={2}
                justify="center"
              >
                <Stat textAlign="center">
                  <StatLabel color="gray.500">Documents</StatLabel>
                  <StatNumber color="brand.900">{booth.documentCount}</StatNumber>
                </Stat>
                <Stat textAlign="center">
                  <StatLabel color="gray.500">Scans</StatLabel>
                  <StatNumber color="brand.900">{booth.scanCount}</StatNumber>
                </Stat>
              </Stack>

              <HStack justify="center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/events/${eventId}`)}
                >
                  Back to event
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      </PageContainer>
    </Layout>
  )
}
