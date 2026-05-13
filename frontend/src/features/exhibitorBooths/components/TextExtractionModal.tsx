import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  HStack,
  Text,
  Box,
  Divider,
  Code,
  Badge,
  Textarea,
  Progress,
  Spinner,
} from '@chakra-ui/react'
import { ExtractionResult, ExtractionState } from '../hooks/useTesseractExtraction'

interface TextExtractionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (text: string) => void
  fileName: string
  result?: ExtractionResult | null
  state: ExtractionState
  isConfirming?: boolean
}

export function TextExtractionModal({
  isOpen,
  onClose,
  onConfirm,
  fileName,
  result,
  state,
  isConfirming = false,
}: TextExtractionModalProps) {
  const handleConfirm = () => {
    if (result?.text) {
      onConfirm(result.text)
    }
  }

  const isEmpty = !!(result && result.text.length === 0)

  return (
    <Modal isOpen={!!isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent maxH="90vh" display="flex" flexDirection="column">
        <ModalHeader>
          <VStack align="flex-start" spacing={1}>
            <Text fontSize="lg" fontWeight="bold">
              Extracted Text
            </Text>
            <Text fontSize="sm" color="gray.600" fontWeight="normal">
              {fileName}
            </Text>
          </VStack>
        </ModalHeader>

        <ModalBody flex={1} overflow="auto">
          {state.isExtracting ? (
            <VStack spacing={4} justify="center" h="200px">
              <Spinner size="lg" />
              <VStack spacing={2}>
                <Text fontWeight="medium">Extracting text...</Text>
                <HStack w="full" spacing={2}>
                  <Progress
                    value={state.progress}
                    size="sm"
                    flex={1}
                    hasStripe
                    isAnimated
                  />
                  <Text fontSize="sm" color="gray.600" minW="40px">
                    {state.progress}%
                  </Text>
                </HStack>
              </VStack>
            </VStack>
          ) : state.error ? (
            <Box
              bg="red.50"
              border="1px solid"
              borderColor="red.200"
              rounded="md"
              p={4}
            >
              <Text color="red.700" fontWeight="medium">
                Extraction Failed
              </Text>
              <Text color="red.600" fontSize="sm" mt={2}>
                {state.error}
              </Text>
            </Box>
          ) : result ? (
            <VStack spacing={4} align="stretch">
              {isEmpty && (
                <Box
                  bg="yellow.50"
                  border="1px solid"
                  borderColor="yellow.200"
                  rounded="md"
                  p={3}
                >
                  <Text color="yellow.700" fontSize="sm">
                    No text detected in this image. The document might be too dark, blurry, or contain
                    non-text elements.
                  </Text>
                </Box>
              )}

              <VStack spacing={2} align="flex-start">
                <HStack spacing={2}>
                  <Badge colorScheme="blue">
                    Confidence: {Math.round(result.confidence)}%
                  </Badge>
                  <Badge colorScheme="gray">
                    {result.processingTimeMs}ms
                  </Badge>
                </HStack>
              </VStack>

              <Box>
                <Text fontSize="sm" fontWeight="bold" color="gray.700" mb={2}>
                  Extracted Content
                </Text>
                <Textarea
                  value={result.text}
                  isReadOnly
                  minH="200px"
                  maxH="300px"
                  fontSize="sm"
                  fontFamily="mono"
                  bg="gray.50"
                  borderColor="gray.300"
                />
              </Box>

              <Box bg="gray.50" rounded="md" p={3}>
                <Text fontSize="xs" color="gray.600">
                  <strong>Tip:</strong> Review the extracted text. You can edit it if there are OCR errors.
                  This text will be sent to our AI for structuring.
                </Text>
              </Box>
            </VStack>
          ) : null}
        </ModalBody>

        <Divider />

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="outline" onClick={onClose} isDisabled={state.isExtracting}>
              Cancel
            </Button>
            <Button
              bg="brand.800"
              color="white"
              _hover={{ bg: 'brand.700' }}
              onClick={handleConfirm}
              isDisabled={state.isExtracting || !result || isEmpty}
              isLoading={isConfirming}
              loadingText="Uploading..."
            >
              Confirm & Upload
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
