import { useQuery } from '@tanstack/react-query'
import { boothsApi } from '../api/booths.api'

export function useBooths(eventId: string, cursor?: string) {
  const { data, isLoading, error, hasNextPage } = useQuery({
    queryKey: ['booths', eventId, cursor],
    queryFn: () => boothsApi.listBooths(eventId, 50, cursor),
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000,
  })

  return {
    booths: data?.booths || [],
    nextCursor: data?.nextCursor,
    total: data?.total || 0,
    isLoading,
    error,
    hasNextPage: !!data?.nextCursor,
  }
}
