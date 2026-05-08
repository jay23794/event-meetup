import { useMutation, useQueryClient } from '@tanstack/react-query'
import { eventsApi } from '../api/events.api'
import { CreateEventInput } from '../types'

export function useCreateEvent() {
  const queryClient = useQueryClient()

  const { mutate, isPending, error } = useMutation({
    mutationFn: (input: CreateEventInput) => eventsApi.createEvent(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })

  return {
    createEvent: mutate,
    isPending,
    error,
  }
}
