import { useParams, useNavigate } from 'react-router-dom'
import {
  Button,
  Heading,
  VStack,
  HStack,
  Text,
  Box,
  Divider,
} from '@chakra-ui/react'
import { FiPlus } from 'react-icons/fi'
import { Layout } from '../../../shared/components/Layout'
import { PageContainer } from '../../../shared/components/PageContainer'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { formatDate, formatRelativeTime } from '../../../shared/utils/formatDate'
import { useEvent } from '../hooks/useEvent'
import { BoothListPage } from '../../booths/pages/BoothListPage'

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { event, isLoading, error } = useEvent(id || '')

  if (!id) {
    return (
      <Layout>
        <PageContainer>
          <ErrorMessage message="Event not found" />
        </PageContainer>
      </Layout>
    )
  }

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    )
  }

  if (error || !event) {
    return (
      <Layout>
        <PageContainer>
          <ErrorMessage
            message="Failed to load event"
            onRetry={() => navigate('/events')}
          />
        </PageContainer>
      </Layout>
    )
  }

  return (
    <Layout>
      <PageContainer>
        <VStack align="start" spacing={6} w="full">
          <VStack align="start" spacing={2} w="full">
            <Heading size="lg" color="brand.900">
              {event.name}
            </Heading>
            {event.startDate && (
              <Text color="brand.600">
                {formatDate(event.startDate)}
                {event.endDate && ` - ${formatDate(event.endDate)}`}
              </Text>
            )}
          </VStack>

          <Divider />

          <HStack spacing={8} w="full" wrap="wrap">
            <Box>
              <Heading size="sm" color="brand.800">
                {event.totalBooths}
              </Heading>
              <Text color="brand.600" fontSize="sm">
                booths logged
              </Text>
            </Box>
            {event.lastBoothAt && (
              <Box>
                <Heading size="sm" color="brand.800">
                  {formatRelativeTime(event.lastBoothAt)}
                </Heading>
                <Text color="brand.600" fontSize="sm">
                  last activity
                </Text>
              </Box>
            )}
          </HStack>

          <Button
            leftIcon={<FiPlus />}
            bg="brand.800"
            color="white"
            _hover={{ bg: 'brand.700' }}
            size="lg"
            w={{ base: 'full', md: 'auto' }}
            onClick={() => navigate(`/events/${id}/booths/new`)}
          >
            New Booth
          </Button>

          <Divider />

          <VStack align="start" spacing={4} w="full">
            <Heading size="md" color="brand.900">
              Booths
            </Heading>
            <Box w="full">
              <BoothListPage eventId={id} />
            </Box>
          </VStack>
        </VStack>
      </PageContainer>
    </Layout>
  )
}
