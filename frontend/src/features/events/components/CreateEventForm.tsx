import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  HStack,
  FormErrorMessage,
  FormHelperText,
} from '@chakra-ui/react'
import { CreateEventInput } from '../types'

const createEventSchema = z.object({
  name: z.string().min(1, 'Event name is required'),
  eventLink: z
    .string()
    .trim()
    .url('Must be a valid URL (e.g. https://...)')
    .optional()
    .or(z.literal('')),
})

interface CreateEventFormProps {
  onSubmit: (data: CreateEventInput) => void
  isPending: boolean
  onCancel: () => void
}

export function CreateEventForm({
  onSubmit,
  isPending,
  onCancel,
}: CreateEventFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
  })

  const submitHandler = (data: CreateEventInput) => {
    onSubmit({
      name: data.name,
      eventLink: data.eventLink?.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit(submitHandler)}>
      <Stack spacing={4}>
        <FormControl isInvalid={!!errors.name}>
          <FormLabel htmlFor="name">Event Name *</FormLabel>
          <Input id="name" placeholder="TechConf 2024" {...register('name')} />
          {errors.name && (
            <FormErrorMessage>{errors.name.message}</FormErrorMessage>
          )}
        </FormControl>

        <FormControl isInvalid={!!errors.eventLink}>
          <FormLabel htmlFor="eventLink">Event Link</FormLabel>
          <Input
            id="eventLink"
            type="url"
            placeholder="https://example.com/my-event"
            {...register('eventLink')}
          />
          {errors.eventLink ? (
            <FormErrorMessage>{errors.eventLink.message}</FormErrorMessage>
          ) : (
            <FormHelperText>Optional — paste the event page URL</FormHelperText>
          )}
        </FormControl>

        <HStack spacing={4} justify="flex-end">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            bg="brand.800"
            color="white"
            _hover={{ bg: 'brand.700' }}
            isLoading={isPending}
          >
            Create Event
          </Button>
        </HStack>
      </Stack>
    </form>
  )
}
