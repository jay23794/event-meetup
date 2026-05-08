import { Card, CardBody, Heading, Text, VStack, HStack, Badge, IconButton, Link } from '@chakra-ui/react'
import { FaWhatsapp, FaPhone } from 'react-icons/fa'
import { formatDateTime } from '../../../shared/utils/formatDate'
import { toWhatsAppUrl, toTelUrl } from '../../../shared/utils/contact'
import { Booth } from '../types'

interface BoothCardProps {
  booth: Booth
  onClick?: () => void
}

export function BoothCard({ booth, onClick }: BoothCardProps) {
  const firstName = booth.names?.[0]?.trim() || ''
  const firstPhone = booth.phones?.[0]?.trim() || ''
  const hasVoiceNote = !!booth.voiceTranscript

  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation()

  return (
    <Card
      cursor={onClick ? 'pointer' : 'default'}
      onClick={onClick}
      _hover={
        onClick
          ? { boxShadow: 'lg', transform: 'translateY(-2px)', borderColor: 'brand.500' }
          : {}
      }
      transition="all 0.2s"
      borderWidth="1px"
    >
      <CardBody>
        <VStack align="start" spacing={2} h="full">
          <HStack w="full" justify="space-between" align="start">
            <Heading size="sm" color="brand.900" noOfLines={1}>
              {booth.boothName || 'Unnamed Booth'}
            </Heading>
            <Badge colorScheme="blue" fontSize="xs">
              {booth.scanCount} {booth.scanCount === 1 ? 'scan' : 'scans'}
            </Badge>
          </HStack>

          {firstName && (
            <Text fontSize="sm" color="brand.800" fontWeight="500" noOfLines={1}>
              {firstName}
            </Text>
          )}

          {firstPhone ? (
            <HStack w="full" spacing={2}>
              <Text fontSize="sm" color="brand.700" noOfLines={1} flex="1">
                📱 {firstPhone}
              </Text>
              <Link
                href={toTelUrl(firstPhone)}
                onClick={stopPropagation}
                aria-label="Call"
              >
                <IconButton
                  aria-label="Call"
                  icon={<FaPhone />}
                  size="xs"
                  colorScheme="blue"
                  variant="ghost"
                />
              </Link>
              <Link
                href={toWhatsAppUrl(firstPhone)}
                isExternal
                onClick={stopPropagation}
                aria-label="WhatsApp"
              >
                <IconButton
                  aria-label="WhatsApp"
                  icon={<FaWhatsapp />}
                  size="xs"
                  colorScheme="green"
                  variant="ghost"
                />
              </Link>
            </HStack>
          ) : (
            <Text fontSize="sm" color="brand.500" fontStyle="italic">
              No phone
            </Text>
          )}

          <HStack w="full" justify="space-between" mt="auto" pt={1}>
            <Text fontSize="xs" color="brand.500">
              {formatDateTime(booth.timestamp)}
            </Text>
            {hasVoiceNote && (
              <Text fontSize="xs" color="brand.600">
                🎤 voice
              </Text>
            )}
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
