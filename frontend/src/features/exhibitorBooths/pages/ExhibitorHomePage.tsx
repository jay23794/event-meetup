import { Button, Heading, VStack, SimpleGrid, HStack } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { FiPlus } from 'react-icons/fi'
import { Layout } from '../../../shared/components/Layout'
import { PageContainer } from '../../../shared/components/PageContainer'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { EmptyState } from '../../../shared/components/EmptyState'
import { EventCard } from '../../events/components/EventCard'
import { useExhibitorEvents } from '../hooks/useExhibitorEvents'

export function ExhibitorHomePage() {
  const navigate = useNavigate()
  const { events, isLoading, error } = useExhibitorEvents()

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <PageContainer>
          <ErrorMessage
            message="Failed to load events"
            onRetry={() => window.location.reload()}
          />
        </PageContainer>
      </Layout>
    )
  }

  return (
    <Layout>
      <PageContainer>
        <HStack justify="space-between" mb={8} wrap="wrap">
          <Heading size="lg" color="brand.900">
            My Booths
          </Heading>
          <Button
            leftIcon={<FiPlus />}
            bg="brand.800"
            color="white"
            _hover={{ bg: 'brand.700' }}
            onClick={() => navigate('/exhibitor/events/new')}
          >
            Create Event
          </Button>
        </HStack>

        {events.length === 0 ? (
          <EmptyState
            title="No events yet"
            description="Create your first event to start setting up booths"
          />
        ) : (
          <SimpleGrid
            columns={{ base: 1, md: 2, lg: 3 }}
            spacing={4}
          >
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </SimpleGrid>
        )}
      </PageContainer>
    </Layout>
  )
}
