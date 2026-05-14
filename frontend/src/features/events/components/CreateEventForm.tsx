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
} from '@chakra-ui/react'
import { CreateEventInput } from '../types'

const createEventSchema = z.object({
  name: z.string().min(1, 'Event name is required'),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
  mobileNumber: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (val) => !val || /^\+?[0-9\s-]{7,15}$/.test(val),
      'Enter a valid mobile number'
    ),
  eventUrl: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (val) => !val || /^https?:\/\/.+/.test(val),
      'Enter a valid URL (https://...)'
    ),
})

type CreateEventFormValues = z.infer<typeof createEventSchema>

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
  } = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventSchema),
  })

  const submitHandler = (data: CreateEventFormValues) => {
    onSubmit({
      name: data.name,
      startDate: data.startDate || undefined,
      endDate: data.endDate || undefined,
      mobileNumber: data.mobileNumber || undefined,
      eventUrl: data.eventUrl || undefined,
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

        <FormControl isInvalid={!!errors.mobileNumber}>
          <FormLabel htmlFor="mobileNumber">Mobile Number</FormLabel>
          <Input
            id="mobileNumber"
            type="tel"
            placeholder="+91 98765 43210"
            {...register('mobileNumber')}
          />
          {errors.mobileNumber && (
            <FormErrorMessage>{errors.mobileNumber.message}</FormErrorMessage>
          )}
        </FormControl>

        <FormControl isInvalid={!!errors.eventUrl}>
          <FormLabel htmlFor="eventUrl">Event URL</FormLabel>
          <Input
            id="eventUrl"
            type="url"
            placeholder="https://example.com/event"
            {...register('eventUrl')}
          />
          {errors.eventUrl && (
            <FormErrorMessage>{errors.eventUrl.message}</FormErrorMessage>
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
