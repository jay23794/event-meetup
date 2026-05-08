import { Card, CardBody, Heading, Text, VStack, HStack, Box } from '@chakra-ui/react'
import { formatRelativeTime } from '../../../shared/utils/formatDate'
import { Booth } from '../types'

interface BoothCardProps {
  booth: Booth
  onClick?: () => void
}

export function BoothCard({ booth, onClick }: BoothCardProps) {
  return (
    <Card
      cursor={onClick ? 'pointer' : 'default'}
      onClick={onClick}
      _hover={onClick ? { boxShadow: 'md', transform: 'translateY(-2px)', transition: 'all 0.2s' } : {}}
    >
      <CardBody>
        <VStack align="start" spacing={3}>
          <Heading size="sm" color="brand.900">
            {booth.boothName || 'Unnamed Booth'}
          </Heading>

          <HStack spacing={4} fontSize="sm">
            <Box>
              <Text fontWeight="bold" color="brand.800">
                {booth.scanCount}
              </Text>
              <Text color="brand.600">scans</Text>
            </Box>
            {booth.hasVoiceNote && (
              <Box>
                <Text fontWeight="bold" color="brand.800">
                  ✓
                </Text>
                <Text color="brand.600">voice note</Text>
              </Box>
            )}
          </HStack>

          <Text fontSize="xs" color="brand.500">
            Row {booth.sheetRowNumber} • {formatRelativeTime(booth.createdAt)}
          </Text>
        </VStack>
      </CardBody>
    </Card>
  )
}
