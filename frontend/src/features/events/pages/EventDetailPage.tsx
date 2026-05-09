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
import { useExhibitorEvent } from '../../exhibitorBooths/hooks/useExhibitorEvents'
import { useEvent } from '../hooks/useEvent'
import { BoothListPage } from '../../booths/pages/BoothListPage'
import { ExhibitorBoothList } from '../../exhibitorBooths/components/ExhibitorBoothList'

interface EventDetailPageProps {
  isExhibitor?: boolean
}

export function EventDetailPage({ isExhibitor = true }: EventDetailPageProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const exhibitorQuery = useExhibitorEvent(isExhibitor ? (id || '') : '')
  const visitorQuery = useEvent(!isExhibitor ? (id || '') : '')
  const { event, isLoading, error } = isExhibitor ? exhibitorQuery : visitorQuery

  const basePath = isExhibitor ? '/exhibitor' : '/visitor'

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
            onRetry={() => navigate(basePath)}
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

          {isExhibitor && (
            <Button
              leftIcon={<FiPlus />}
              bg="brand.800"
              color="white"
              _hover={{ bg: 'brand.700' }}
              size="lg"
              w={{ base: 'full', md: 'auto' }}
              onClick={() => navigate(`${basePath}/events/${id}/booths/new`)}
            >
              Add Booth
            </Button>
          )}

          <Divider />

          {isExhibitor ? (
            <>
              <VStack align="start" spacing={4} w="full">
                <Heading size="md" color="brand.900">
                  My Exhibitor Booths
                </Heading>
                <Box w="full">
                  <ExhibitorBoothList eventId={id} />
                </Box>
              </VStack>
            </>
          ) : (
            <>
              <VStack align="start" spacing={4} w="full">
                <Heading size="md" color="brand.900">
                  Visitor Scans
                </Heading>
                <Box w="full">
                  <BoothListPage eventId={id} />
                </Box>
              </VStack>
            </>
          )}
        </VStack>
      </PageContainer>
    </Layout>
  )
}
