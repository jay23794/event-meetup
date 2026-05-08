import { useState } from 'react'
import { VStack, Button, SimpleGrid, useDisclosure } from '@chakra-ui/react'
import { useBooths } from '../hooks/useBooths'
import { BoothCard } from '../components/BoothCard'
import { BoothDetailModal } from '../components/BoothDetailModal'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { EmptyState } from '../../../shared/components/EmptyState'
import { Booth } from '../types'

interface BoothListPageProps {
  eventId: string
}

export function BoothListPage({ eventId }: BoothListPageProps) {
  const [cursor, setCursor] = useState<string | undefined>()
  const [selectedBooth, setSelectedBooth] = useState<Booth | null>(null)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { booths, nextCursor, total, isLoading, error, hasNextPage } = useBooths(
    eventId,
    cursor
  )

  const handleBoothClick = (booth: Booth) => {
    setSelectedBooth(booth)
    onOpen()
  }

  const handleModalClose = () => {
    onClose()
    setSelectedBooth(null)
  }

  if (isLoading && !booths.length) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <ErrorMessage
        message="Failed to load booths"
        onRetry={() => window.location.reload()}
      />
    )
  }

  if (booths.length === 0) {
    return (
      <EmptyState
        title="No booths yet"
        description="Tap '+ New Booth' to scan your first business cards"
      />
    )
  }

  return (
    <>
      <VStack spacing={6} w="full">
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
          {booths.map((booth) => (
            <BoothCard
              key={booth.rowNumber}
              booth={booth}
              onClick={() => handleBoothClick(booth)}
            />
          ))}
        </SimpleGrid>

        {hasNextPage && (
          <Button
            w="full"
            variant="outline"
            onClick={() => setCursor(nextCursor)}
            isLoading={isLoading}
          >
            Load more ({total - booths.length} remaining)
          </Button>
        )}
      </VStack>

      <BoothDetailModal
        isOpen={isOpen}
        onClose={handleModalClose}
        booth={selectedBooth}
      />
    </>
  )
}
