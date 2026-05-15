import { useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import {
  Box,
  Button,
  Card,
  CardBody,
  Divider,
  Flex,
  HStack,
  Heading,
  Icon,
  Stat,
  StatLabel,
  StatNumber,
  Stack,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react'
import { IconType } from 'react-icons'
import {
  FiGlobe,
  FiInstagram,
  FiLinkedin,
  FiMail,
  FiPhone,
  FiTwitter,
} from 'react-icons/fi'
import { Layout } from '../../../shared/components/Layout'
import { PageContainer } from '../../../shared/components/PageContainer'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { useToast } from '../../../shared/hooks/useToast'
import { useBooth, useBoothDocuments } from '../hooks/useExhibitorBooths'
import { useExhibitorEvent } from '../hooks/useExhibitorEvents'
import { authStore } from '../../auth/store/authStore'

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
  const user = authStore((state) => state.user)

  const { booth, isLoading: boothLoading, error: boothError } = useBooth(boothId || '')
  const { event } = useExhibitorEvent(eventId || '')
  const { documents } = useBoothDocuments(boothId || '')

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
            onRetry={() => navigate(`/exhibitor/events/${eventId}`)}
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

  // Pull contact details from extracted document fields; fall back to login email only when no doc supplied one.
  const firstNonEmpty = (key: 'extractedEmail' | 'extractedPhone' | 'extractedWebsite') => {
    for (const doc of documents) {
      const value = doc[key]?.trim()
      if (value) return value
    }
    return undefined
  }

  const extractedEmail = firstNonEmpty('extractedEmail')
  const extractedPhone = firstNonEmpty('extractedPhone')
  const extractedWebsite = firstNonEmpty('extractedWebsite')

  const contactEmail = extractedEmail || user?.email
  const contactPhone = extractedPhone
  const contactWebsite = extractedWebsite
  const socials: Array<{ icon: IconType; label: string; href: string }> = []

  return (
    <Layout>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <PageContainer>
        <VStack spacing={6} align="stretch" maxW="2xl" mx="auto" w="full">
          <Card>
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
              </VStack>
            </CardBody>
          </Card>

          <BoothContactCard
            boothName={booth.boothName}
            description={booth.description}
            email={contactEmail}
            phone={contactPhone}
            website={contactWebsite}
            socials={socials}
          />

          <HStack justify="center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/exhibitor/events/${eventId}`)}
            >
              Back to event
            </Button>
          </HStack>
        </VStack>
      </PageContainer>
    </Layout>
  )
}

interface BoothContactCardProps {
  boothName: string
  description?: string
  email?: string
  phone?: string
  website?: string
  socials: Array<{ icon: IconType; label: string; href: string }>
}

function BoothContactCard({
  boothName,
  description,
  email,
  phone,
  website,
  socials,
}: BoothContactCardProps) {
  return (
    <Card overflow="hidden" borderWidth="1px" borderColor="gray.200">
      <Box bg="brand.800" px={6} py={5}>
        <Heading size="md" color="white" letterSpacing="-0.3px">
          {boothName}
        </Heading>
        {description && (
          <Text mt={1} fontSize="sm" color="whiteAlpha.800" noOfLines={2}>
            {description}
          </Text>
        )}
      </Box>

      <CardBody>
        <VStack align="stretch" spacing={3}>
          <ContactRow icon={FiPhone} label="Mobile" value={phone} href={phone ? `tel:${phone}` : undefined} />
          <ContactRow icon={FiMail} label="Email" value={email} href={email ? `mailto:${email}` : undefined} />
          <ContactRow icon={FiGlobe} label="Website" value={website} href={website} />

          <Divider />

          <Text fontSize="xs" fontWeight="semibold" color="gray.500" letterSpacing="0.05em" textTransform="uppercase">
            Socials
          </Text>
          {socials.length > 0 ? (
            <HStack spacing={3} wrap="wrap">
              {socials.map((s) => (
                <SocialIconLink key={s.label} icon={s.icon} label={s.label} href={s.href} />
              ))}
            </HStack>
          ) : (
            <HStack spacing={3} wrap="wrap" opacity={0.4}>
              <SocialIconPlaceholder icon={FiInstagram} />
              <SocialIconPlaceholder icon={FiLinkedin} />
              <SocialIconPlaceholder icon={FiTwitter} />
            </HStack>
          )}
        </VStack>
      </CardBody>
    </Card>
  )
}

interface ContactRowProps {
  icon: IconType
  label: string
  value?: string
  href?: string
}

function ContactRow({ icon, label, value, href }: ContactRowProps) {
  const isEmpty = !value
  const content = (
    <HStack
      spacing={3}
      px={3}
      py={2.5}
      rounded="md"
      transition="background-color 0.15s"
      _hover={!isEmpty ? { bg: 'brand.50' } : undefined}
      cursor={!isEmpty && href ? 'pointer' : 'default'}
    >
      <Flex
        align="center"
        justify="center"
        w="36px"
        h="36px"
        rounded="full"
        bg={isEmpty ? 'gray.100' : 'brand.50'}
        color={isEmpty ? 'gray.400' : 'brand.800'}
        flexShrink={0}
      >
        <Icon as={icon} boxSize={4} />
      </Flex>
      <Box minW={0} flex={1}>
        <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="0.05em">
          {label}
        </Text>
        <Text fontSize="sm" color={isEmpty ? 'gray.400' : 'gray.800'} fontWeight={isEmpty ? 'normal' : 'medium'} noOfLines={1}>
          {value || 'Not added'}
        </Text>
      </Box>
    </HStack>
  )

  if (!isEmpty && href) {
    return (
      <Box as="a" href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
        {content}
      </Box>
    )
  }
  return content
}

function SocialIconLink({ icon, label, href }: { icon: IconType; label: string; href: string }) {
  return (
    <Tooltip label={label} hasArrow>
      <Box
        as="a"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        w="40px"
        h="40px"
        rounded="full"
        bg="brand.50"
        color="brand.800"
        transition="all 0.15s"
        _hover={{ bg: 'brand.800', color: 'white' }}
      >
        <Icon as={icon} boxSize={4} />
      </Box>
    </Tooltip>
  )
}

function SocialIconPlaceholder({ icon }: { icon: IconType }) {
  return (
    <Flex
      align="center"
      justify="center"
      w="40px"
      h="40px"
      rounded="full"
      bg="gray.100"
      color="gray.400"
    >
      <Icon as={icon} boxSize={4} />
    </Flex>
  )
}
