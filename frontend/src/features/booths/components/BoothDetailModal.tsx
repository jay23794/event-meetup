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
  Spinner,
} from '@chakra-ui/react'
import { formatDate } from '../../../shared/utils/formatDate'
import { useBooth } from '../hooks/useBooth'

interface BoothDetailModalProps {
  isOpen: boolean
  onClose: () => void
  eventId: string
  rowNumber: number | null
}

export function BoothDetailModal({
  isOpen,
  onClose,
  eventId,
  rowNumber,
}: BoothDetailModalProps) {
  const { booth, isLoading, error } = useBooth(eventId, rowNumber)

  const parseItems = (itemString: string): string[] => {
    return itemString
      .split(';')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  const parseImageUrls = (urlString: string): string[] => {
    return urlString
      .split(';')
      .map((url) => url.trim())
      .filter(Boolean)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <VStack align="start" spacing={2}>
            <Heading size="md">{booth?.boothName || 'Booth Details'}</Heading>
            <HStack spacing={4}>
              <Badge colorScheme="blue">Row {rowNumber}</Badge>
              <Text fontSize="xs" color="gray.500">
                {booth && formatDate(booth.timestamp)}
              </Text>
            </HStack>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          {isLoading && <Spinner mx="auto" />}
          {error && <Text color="red.500">{error}</Text>}

          {booth && (
            <VStack align="start" spacing={6} w="full">
              {/* Scan Info */}
              <Box w="full">
                <Heading size="sm" mb={3}>
                  Scan Information
                </Heading>
                <HStack spacing={4}>
                  <Box>
                    <Text fontWeight="bold" color="brand.800">
                      {booth.scanCount}
                    </Text>
                    <Text fontSize="sm" color="brand.600">
                      scans
                    </Text>
                  </Box>
                </HStack>
              </Box>

              <Divider />

              {/* Contacts */}
              <Box w="full">
                <Heading size="sm" mb={3}>
                  Contacts
                </Heading>
                <VStack align="start" spacing={3} w="full">
                  {parseItems(booth.names).map((name, idx) => (
                    <Box key={idx} w="full">
                      <Text fontWeight="600" color="brand.900">
                        {name}
                      </Text>
                      {booth.emails && (
                        <Text fontSize="sm" color="brand.600">
                          {parseItems(booth.emails)[idx] || '-'}
                        </Text>
                      )}
                      {booth.phones && (
                        <Text fontSize="sm" color="brand.600">
                          {parseItems(booth.phones)[idx] || '-'}
                        </Text>
                      )}
                      {booth.companies && (
                        <Text fontSize="sm" color="brand.700" fontWeight="500">
                          {parseItems(booth.companies)[idx] || '-'}
                        </Text>
                      )}
                    </Box>
                  ))}
                </VStack>
              </Box>

              {booth.voiceTranscript && (
                <>
                  <Divider />
                  <Box w="full">
                    <Heading size="sm" mb={3}>
                      Voice Note
                    </Heading>
                    <Text fontSize="sm" color="brand.700" whiteSpace="pre-wrap">
                      {booth.voiceTranscript}
                    </Text>
                  </Box>
                </>
              )}

              {booth.imageUrls && (
                <>
                  <Divider />
                  <Box w="full">
                    <Heading size="sm" mb={3}>
                      Scanned Images
                    </Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                      {parseImageUrls(booth.imageUrls).map((url, idx) => (
                        <Link key={idx} href={url} isExternal>
                          <Image
                            src={url}
                            alt={`Scan ${idx + 1}`}
                            borderRadius="md"
                            maxH="200px"
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
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
