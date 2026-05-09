import { VStack, SimpleGrid, Heading, HStack, Text, Box, Code } from '@chakra-ui/react'
import { useExhibitorBooths } from '../hooks/useExhibitorBooths'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ExhibitorBoothCard } from './ExhibitorBoothCard'

interface ExhibitorBoothListProps {
  eventId: string
}

export function ExhibitorBoothList({ eventId }: ExhibitorBoothListProps) {
  const { booths, isLoading, error } = useExhibitorBooths(eventId)

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <ErrorMessage
        message="Failed to load exhibitor booths"
        onRetry={() => window.location.reload()}
      />
    )
  }

  if (booths.length === 0) {
    return (
      <EmptyState
        title="No exhibitor booths yet"
        description="Create a booth to start collecting documents"
      />
    )
  }

  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
      {booths.map((booth) => (
        <ExhibitorBoothCard key={booth.id} booth={booth} />
      ))}
    </SimpleGrid>
  )
}
