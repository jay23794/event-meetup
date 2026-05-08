import { useNavigate } from 'react-router-dom'
import { Card, CardBody, CardHeader, Heading, VStack } from '@chakra-ui/react'
import { Layout } from '../../../shared/components/Layout'
import { PageContainer } from '../../../shared/components/PageContainer'
import { CreateEventForm } from '../components/CreateEventForm'
import { useCreateEvent } from '../hooks/useCreateEvent'
import { CreateEventInput } from '../types'
import { useToast } from '../../../shared/hooks/useToast'

export function CreateEventPage() {
  const navigate = useNavigate()
  const { createEvent, isPending, error } = useCreateEvent()
  const { success: showSuccess, error: showError } = useToast()

  const handleSubmit = async (data: CreateEventInput) => {
    try {
      const event = await new Promise<any>((resolve, reject) => {
        createEvent(data, {
          onSuccess: (event) => resolve(event),
          onError: (err) => reject(err),
        })
      })
      showSuccess('Event created successfully')
      navigate(`/events/${event.id}/booths/new`)
    } catch (err) {
      showError('Failed to create event. Please try again.')
    }
  }

  return (
    <Layout>
      <PageContainer>
        <VStack spacing={8} maxW="md">
          <Card w="full">
            <CardHeader>
              <Heading size="md" color="brand.900">
                Create New Event
              </Heading>
            </CardHeader>
            <CardBody>
              <CreateEventForm
                onSubmit={handleSubmit}
                isPending={isPending}
                onCancel={() => navigate('/events')}
              />
            </CardBody>
          </Card>
        </VStack>
      </PageContainer>
    </Layout>
  )
}
