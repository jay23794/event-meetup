import { useQuery } from '@tanstack/react-query'
import { eventsApi } from '../api/events.api'

export function useEvent(id: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsApi.getEvent(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })

  return {
    event: data,
    isLoading,
    error,
  }
}
