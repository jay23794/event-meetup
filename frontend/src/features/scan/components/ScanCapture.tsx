import { useRef } from 'react'
import {
  Button,
  Input,
  VStack,
  HStack,
  Center,
  Text,
  SimpleGrid,
  Box,
} from '@chakra-ui/react'
import { FiCamera, FiUpload, FiImage } from 'react-icons/fi'

interface ScanCaptureProps {
  onCapture: (file: File) => void
  isLoading?: boolean
}

export function ScanCapture({ onCapture, isLoading }: ScanCaptureProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      onCapture(file)
    }
    event.target.value = ''
  }

  const handleCameraClick = () => {
    cameraInputRef.current?.click()
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <VStack spacing={4} w="full">
      <Center
        w="full"
        h="180px"
        border="2px dashed"
        borderColor="brand.400"
        borderRadius="lg"
        bg="brand.200"
        transition="all 0.2s"
      >
        <VStack spacing={2}>
          <FiImage size={36} color="#003F8F" />
          <Text color="brand.800" fontWeight="600">
            Add Business Card Image
          </Text>
          <Text color="brand.600" fontSize="sm">
            Capture with camera or upload from device
          </Text>
        </VStack>
      </Center>

      <Input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        display="none"
        disabled={isLoading}
      />

      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        display="none"
        disabled={isLoading}
      />

      <SimpleGrid columns={2} spacing={3} w="full">
        <Button
          leftIcon={<FiCamera />}
          bg="brand.700"
          color="white"
          _hover={{ bg: 'brand.800' }}
          onClick={handleCameraClick}
          isDisabled={isLoading}
          isLoading={isLoading}
          loadingText="Processing"
          size="lg"
        >
          Capture
        </Button>
        <Button
          leftIcon={<FiUpload />}
          variant="outline"
          borderColor="brand.700"
          color="brand.700"
          _hover={{ bg: 'brand.200' }}
          onClick={handleUploadClick}
          isDisabled={isLoading}
          size="lg"
        >
          Upload
        </Button>
      </SimpleGrid>
    </VStack>
  )
}
