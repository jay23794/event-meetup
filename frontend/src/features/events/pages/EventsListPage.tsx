import { Button, Heading, VStack, SimpleGrid, HStack } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { FiPlus } from 'react-icons/fi'
import { Layout } from '../../../shared/components/Layout'
import { PageContainer } from '../../../shared/components/PageContainer'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { EmptyState } from '../../../shared/components/EmptyState'
import { EventCard } from '../components/EventCard'
import { useEvents } from '../hooks/useEvents'

export function EventsListPage() {
  const navigate = useNavigate()
  const { events, isLoading, error } = useEvents()

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
            onClick={() => navigate('/events/new')}
          >
            Create Event
          </Button>
        </HStack>

        {events.length === 0 ? (
          <EmptyState
            title="No events yet"
            description="Create your first event to start scanning business cards"
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
