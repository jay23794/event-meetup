import { Alert, AlertIcon, AlertTitle, Button, Stack } from '@chakra-ui/react'

interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <Stack w="full" maxW="md" mx="auto" py={8}>
      <Alert
        status="error"
        variant="subtle"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        textAlign="center"
        borderRadius="md"
        py={8}
      >
        <AlertIcon boxSize="40px" mr={0} mb={4} />
        <AlertTitle fontSize="lg" mb={2}>
          Something went wrong
        </AlertTitle>
        <div>{message}</div>
      </Alert>
      {onRetry && (
        <Button
          onClick={onRetry}
          colorScheme="brand"
          variant="outline"
          size="sm"
        >
          Try again
        </Button>
      )}
    </Stack>
  )
}
