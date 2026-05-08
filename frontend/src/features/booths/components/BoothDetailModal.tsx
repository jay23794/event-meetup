import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Box,
  Text,
  Heading,
  Divider,
  Badge,
  Image,
  SimpleGrid,
  Link,
  IconButton,
} from '@chakra-ui/react'
import { FaWhatsapp, FaPhone, FaEnvelope } from 'react-icons/fa'
import { formatDateTime } from '../../../shared/utils/formatDate'
import { toWhatsAppUrl, toTelUrl, toMailtoUrl } from '../../../shared/utils/contact'
import { Booth } from '../types'

interface BoothDetailModalProps {
  isOpen: boolean
  onClose: () => void
  booth: Booth | null
}

export function BoothDetailModal({ isOpen, onClose, booth }: BoothDetailModalProps) {
  if (!booth) return null

  const maxLen = Math.max(
    booth.names?.length || 0,
    booth.phones?.length || 0,
    booth.emails?.length || 0,
    booth.companies?.length || 0
  )

  const contacts = Array.from({ length: maxLen }, (_, i) => ({
    name: booth.names?.[i] || '',
    phone: booth.phones?.[i] || '',
    email: booth.emails?.[i] || '',
    company: booth.companies?.[i] || '',
  }))

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <VStack align="start" spacing={2}>
            <Heading size="md">{booth.boothName || 'Booth Details'}</Heading>
            <HStack spacing={3}>
              <Badge colorScheme="blue">Row {booth.rowNumber}</Badge>
              <Badge colorScheme="purple">
                {booth.scanCount} {booth.scanCount === 1 ? 'scan' : 'scans'}
              </Badge>
              <Text fontSize="xs" color="gray.500">
                {formatDateTime(booth.timestamp)}
              </Text>
            </HStack>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody pb={6}>
          <VStack align="start" spacing={5} w="full">
            {contacts.length > 0 && (
              <Box w="full">
                <Heading size="sm" mb={3}>
                  Contacts
                </Heading>
                <VStack align="start" spacing={4} w="full">
                  {contacts.map((c, idx) => (
                    <Box
                      key={idx}
                      w="full"
                      p={3}
                      borderWidth="1px"
                      borderRadius="md"
                      borderColor="gray.200"
                    >
                      {c.name && (
                        <Text fontWeight="600" color="brand.900" mb={1}>
                          {c.name}
                        </Text>
                      )}
                      {c.company && (
                        <Text fontSize="sm" color="brand.700" fontWeight="500" mb={2}>
                          {c.company}
                        </Text>
                      )}
                      {c.phone && (
                        <HStack spacing={2} mb={1}>
                          <Text fontSize="sm" color="brand.700" flex="1">
                            📱 {c.phone}
                          </Text>
                          <Link href={toTelUrl(c.phone)} aria-label="Call">
                            <IconButton
                              aria-label="Call"
                              icon={<FaPhone />}
                              size="sm"
                              colorScheme="blue"
                              variant="ghost"
                            />
                          </Link>
                          <Link
                            href={toWhatsAppUrl(c.phone)}
                            isExternal
                            aria-label="WhatsApp"
                          >
                            <IconButton
                              aria-label="WhatsApp"
                              icon={<FaWhatsapp />}
                              size="sm"
                              colorScheme="green"
                              variant="ghost"
                            />
                          </Link>
                        </HStack>
                      )}
                      {c.email && (
                        <HStack spacing={2}>
                          <Text fontSize="sm" color="brand.700" flex="1" noOfLines={1}>
                            ✉️ {c.email}
                          </Text>
                          <Link href={toMailtoUrl(c.email)} aria-label="Email">
                            <IconButton
                              aria-label="Email"
                              icon={<FaEnvelope />}
                              size="sm"
                              colorScheme="purple"
                              variant="ghost"
                            />
                          </Link>
                        </HStack>
                      )}
                    </Box>
                  ))}
                </VStack>
              </Box>
            )}

            {booth.voiceTranscript && (
              <>
                <Divider />
                <Box w="full">
                  <Heading size="sm" mb={2}>
                    🎤 Voice Note
                  </Heading>
                  <Text
                    fontSize="sm"
                    color="brand.700"
                    whiteSpace="pre-wrap"
                    p={3}
                    bg="gray.50"
                    borderRadius="md"
                  >
                    {booth.voiceTranscript}
                  </Text>
                </Box>
              </>
            )}

            {booth.imageUrls && booth.imageUrls.length > 0 && (
              <>
                <Divider />
                <Box w="full">
                  <Heading size="sm" mb={3}>
                    Scanned Images
                  </Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                    {booth.imageUrls.map((url, idx) => (
                      <Link key={idx} href={url} isExternal>
                        <Image
                          src={url}
                          alt={`Scan ${idx + 1}`}
                          borderRadius="md"
                          maxH="200px"
                          w="full"
                          objectFit="cover"
                          cursor="pointer"
                          _hover={{ opacity: 0.8 }}
                        />
                      </Link>
                    ))}
                  </SimpleGrid>
                </Box>
              </>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
