import { Card, CardBody, Heading, Text, VStack, HStack, Box } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { formatDate, formatRelativeTime } from '../../../shared/utils/formatDate'
import { Event } from '../types'

interface EventCardProps {
  event: Event
}

export function EventCard({ event }: EventCardProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`/events/${event.id}`)
  }

  return (
    <Card
      cursor="pointer"
      onClick={handleClick}
      _hover={{ boxShadow: 'md', bg: 'brand.300' }}
      transition="all 0.2s"
    >
      <CardBody>
        <VStack align="start" spacing={3}>
          <Heading size="md" color="brand.900">
            {event.name}
          </Heading>

          {event.startDate && (
            <Text fontSize="sm" color="brand.600">
              {formatDate(event.startDate)}
              {event.endDate && ` - ${formatDate(event.endDate)}`}
            </Text>
          )}

          <HStack spacing={4} fontSize="sm">
            <Box>
              <Text fontWeight="bold" color="brand.800">
                {event.boothCount}
              </Text>
              <Text color="brand.600">booths logged</Text>
            </Box>
          </HStack>

          <Text fontSize="xs" color="brand.500">
            Created {formatRelativeTime(event.createdAt)}
          </Text>
        </VStack>
      </CardBody>
    </Card>
  )
}
