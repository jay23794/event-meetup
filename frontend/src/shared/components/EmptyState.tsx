import { VStack, Heading, Text } from '@chakra-ui/react'

interface EmptyStateProps {
  title: string
  description: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <VStack
      spacing={4}
      py={16}
      textAlign="center"
    >
      <Heading size="md" color="brand.700">
        {title}
      </Heading>
      <Text color="brand.600">
        {description}
      </Text>
    </VStack>
  )
}
