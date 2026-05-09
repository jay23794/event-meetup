import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { exhibitorEventsApi } from '../api/exhibitorEvents.api'
import { CreateEventInput } from '../../events/types'

export function useExhibitorEvents() {
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['exhibitorEvents'],
    queryFn: exhibitorEventsApi.listEvents,
    staleTime: 5 * 60 * 1000,
  })

  return {
    events: data,
    isLoading,
    error,
  }
}

export function useCreateExhibitorEvent() {
  const queryClient = useQueryClient()

  const { mutate, isPending, error } = useMutation({
    mutationFn: (input: CreateEventInput) => exhibitorEventsApi.createEvent(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exhibitorEvents'] })
    },
  })

  return {
    createEvent: mutate,
    isPending,
    error,
  }
}

export function useExhibitorEvent(id: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['exhibitorEvents', id],
    queryFn: () => exhibitorEventsApi.getEvent(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  })

  return {
    event: data,
    isLoading,
    error,
  }
}
