import { Card, CardBody, Heading, Text, VStack, HStack, Box } from '@chakra-ui/react'
import { formatRelativeTime } from '../../../shared/utils/formatDate'
import { Booth } from '../types'

interface BoothCardProps {
  booth: Booth
}

export function BoothCard({ booth }: BoothCardProps) {
  return (
    <Card>
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
