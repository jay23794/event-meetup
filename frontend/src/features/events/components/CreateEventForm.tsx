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
  startDate: z.string().optional(),
  endDate: z.string().optional(),
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

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={4}>
        <FormControl isInvalid={!!errors.name}>
          <FormLabel htmlFor="name">Event Name *</FormLabel>
          <Input
            id="name"
            placeholder="TechConf 2024"
            {...register('name')}
          />
          {errors.name && (
            <FormErrorMessage>{errors.name.message}</FormErrorMessage>
          )}
        </FormControl>

        <FormControl>
          <FormLabel htmlFor="startDate">Start Date</FormLabel>
          <Input
            id="startDate"
            type="date"
            {...register('startDate')}
          />
        </FormControl>

        <FormControl>
          <FormLabel htmlFor="endDate">End Date</FormLabel>
          <Input
            id="endDate"
            type="date"
            {...register('endDate')}
          />
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
