import { useRef } from 'react'
import {
  Button,
  Box,
  Input,
  VStack,
  Center,
  Text,
} from '@chakra-ui/react'
import { FiCamera, FiUpload } from 'react-icons/fi'

interface ScanCaptureProps {
  onCapture: (file: File) => void
  isLoading?: boolean
}

export function ScanCapture({ onCapture, isLoading }: ScanCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      onCapture(file)
    }
  }

  const handleCameraClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <VStack spacing={4} w="full">
      <Center
        w="full"
        h="200px"
        border="2px dashed"
        borderColor="brand.400"
        borderRadius="md"
        bg="brand.300"
        cursor="pointer"
        _hover={{ bg: 'brand.400' }}
        onClick={handleCameraClick}
        transition="all 0.2s"
      >
        <VStack spacing={2}>
          <FiCamera size={32} color="brand.800" />
          <Text color="brand.800" fontWeight="bold">
            Tap to capture or upload
          </Text>
          <Text color="brand.600" fontSize="sm">
            Image of business card
          </Text>
        </VStack>
      </Center>

      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        display="none"
        disabled={isLoading}
      />

      <Button
        w="full"
        leftIcon={<FiUpload />}
        variant="outline"
        onClick={handleCameraClick}
        isDisabled={isLoading}
      >
        {isLoading ? 'Processing...' : 'Choose Image'}
      </Button>
    </VStack>
  )
}
