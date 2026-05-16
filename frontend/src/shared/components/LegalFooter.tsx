import { HStack, Link, Text } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'

export function LegalFooter() {
  return (
    <HStack
      as="footer"
      spacing={4}
      justify="center"
      py={4}
      color="gray.600"
      fontSize="sm"
      w="full"
    >
      <Link as={RouterLink} to="/privacy-policy" textDecoration="underline">
        Privacy Policy
      </Link>
      <Text color="gray.400" aria-hidden="true">
        ·
      </Text>
      <Link as={RouterLink} to="/terms" textDecoration="underline">
        Terms of Service
      </Link>
    </HStack>
  )
}
