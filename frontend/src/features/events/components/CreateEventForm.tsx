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

        <FormControl isInvalid={!!errors.startDate}>
          <FormLabel htmlFor="startDate">Start Date</FormLabel>
          <Input id="startDate" type="date" {...register('startDate')} />
          {errors.startDate && (
            <FormErrorMessage>{errors.startDate.message}</FormErrorMessage>
          )}
        </FormControl>

        <FormControl isInvalid={!!errors.endDate}>
          <FormLabel htmlFor="endDate">End Date</FormLabel>
          <Input id="endDate" type="date" {...register('endDate')} />
          {errors.endDate && (
            <FormErrorMessage>{errors.endDate.message}</FormErrorMessage>
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
