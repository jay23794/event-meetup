import { useQuery } from '@tanstack/react-query'
import { eventsApi } from '../api/events.api'

export function useEvents() {
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['events'],
    queryFn: eventsApi.listEvents,
    staleTime: 5 * 60 * 1000,
  })

  return {
    events: data,
    isLoading,
    error,
  }
}
