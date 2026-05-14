import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Input,
  FormControl,
  FormLabel,
  VStack,
  HStack,
  Text,
} from '@chakra-ui/react'
import { Layout } from '../../../shared/components/Layout'
import { PageContainer } from '../../../shared/components/PageContainer'
import { ScanCarousel } from '../../scan/components/ScanCarousel'
import { useCreateBooth } from '../hooks/useCreateBooth'
import { useToast } from '../../../shared/hooks/useToast'
import { ProcessingScan } from '../../scan/types'
import { CreateBoothInput } from '../types'

export function BoothFormPage() {
  const { id: eventId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [boothName, setBoothName] = useState('')
  const [scans, setScans] = useState<ProcessingScan[]>([])
  const { createBooth, isPending } = useCreateBooth(eventId || '')
  const { success: showSuccess, error: showError } = useToast()

  const completedScans = scans.filter((s) => s.status === 'completed')
  const maxScans = 2

  const handleScansReady = (readyScans: ProcessingScan[]) => {
    setScans(readyScans)
  }

  const handleSubmit = async () => {
    if (!eventId) {
      showError('Event not found')
      return
    }

    if (completedScans.length < 1) {
      showError('Please upload at least 1 business card')
      return
    }

    if (completedScans.length > maxScans) {
      showError(`Maximum ${maxScans} business cards allowed`)
      return
    }

    try {
      const input: CreateBoothInput = {
        boothName: boothName || undefined,
        scans: completedScans.map((scan) => ({
          imageUrl: scan.imageUrl || '',
          extractedFields: scan.extractedFields || {},
          rawText: scan.rawText || '',
          driveFileId: scan.driveFileId,
        })),
      }

      await new Promise<void>((resolve, reject) => {
        createBooth(input, {
          onSuccess: () => resolve(),
          onError: (err) => reject(err),
        })
      })

      showSuccess('Booth created successfully')
      navigate('/visitor')
    } catch (err) {
      showError('Failed to create booth. Please try again.')
    }
  }

  return (
    <Layout>
      <PageContainer>
        <Card>
          <CardHeader>
            <HStack align="start" justify="space-between" spacing={4} w="full">
              <VStack align="start" spacing={1}>
                <Heading size="md" color="brand.900">
                  New Booths
                </Heading>
                <Text color="brand.600" fontSize="sm">
                  Log a booth visit by scanning business cards. We'll extract
                  contacts and save them to your event sheet.
                </Text>
              </VStack>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/visitor')}
                flexShrink={0}
              >
                Cancel
              </Button>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack spacing={6} align="start" w="full">
              <FormControl>
                <FormLabel htmlFor="boothName">Booth Name (Optional)</FormLabel>
                <Input
                  id="boothName"
                  placeholder="e.g., Microsoft Booth A"
                  value={boothName}
                  onChange={(e) => setBoothName(e.target.value)}
                />
              </FormControl>

              <VStack spacing={4} w="full">
                <ScanCarousel eventId={eventId || ''} onScansReady={handleScansReady} />
              </VStack>

              <Button
                w="full"
                size="lg"
                bg="brand.800"
                color="white"
                _hover={{ bg: 'brand.700' }}
                onClick={handleSubmit}
                isLoading={isPending}
                isDisabled={completedScans.length < 1}
                title={completedScans.length < 1 ? 'Upload at least 1 card' : 'Submit booth'}
              >
                Submit Booth ({completedScans.length}/{maxScans})
              </Button>
            </VStack>
          </CardBody>
        </Card>
      </PageContainer>
    </Layout>
  )
}
