import { Card, CardBody, VStack, HStack, Heading, Text, Badge, Button } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { ExhibitorBooth } from '../types'

interface ExhibitorBoothCardProps {
  booth: ExhibitorBooth
}

export function ExhibitorBoothCard({ booth }: ExhibitorBoothCardProps) {
  const navigate = useNavigate()

  return (
    <Card h="full" borderWidth="1px" borderColor="gray.200">
      <CardBody>
        <VStack align="start" spacing={3} h="full">
          <VStack align="start" spacing={1} w="full">
            <Heading size="sm" color="subheading" noOfLines={2}>
              {booth.boothName}
            </Heading>
            <Text fontSize="xs" color="gray.500">
              QR ID: {booth.qrId}
            </Text>
          </VStack>

          <Text fontSize="sm" color="gray.600" noOfLines={3} flex={1}>
            {booth.description}
          </Text>

          <HStack spacing={4} w="full" fontSize="sm" color="gray.600">
            <VStack spacing={0} align="start">
              <Text fontWeight="bold" color="brand.700">
                {booth.documentCount}
              </Text>
              <Text fontSize="xs">documents</Text>
            </VStack>
            <VStack spacing={0} align="start">
              <Text fontWeight="bold" color="brand.700">
                {booth.scanCount}
              </Text>
              <Text fontSize="xs">scans</Text>
            </VStack>
          </HStack>

          <Button
            size="sm"
            variant="outline"
            w="full"
            onClick={() => navigate(`/exhibitor/events/${booth.eventId}/booths/${booth.id}/qr`)}
          >
            View QR Code
          </Button>
        </VStack>
      </CardBody>
    </Card>
  )
}
