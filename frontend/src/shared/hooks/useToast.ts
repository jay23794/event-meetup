import { useToast as useChakraToast } from '@chakra-ui/react'

export function useToast() {
  const toast = useChakraToast()

  return {
    success: (message: string) =>
      toast({
        title: message,
        status: 'success',
        duration: 4000,
        isClosable: true,
        position: 'top',
      }),
    error: (message: string) =>
      toast({
        title: 'Error',
        description: message,
        status: 'error',
        duration: 6000,
        isClosable: true,
        position: 'top',
      }),
    info: (message: string) =>
      toast({
        title: message,
        status: 'info',
        duration: 4000,
        isClosable: true,
        position: 'top',
      }),
  }
}
