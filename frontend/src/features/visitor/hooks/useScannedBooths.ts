import { useInfiniteQuery } from '@tanstack/react-query'
import { visitorApi } from '../api/visitor.api'

const PAGE_SIZE = 30

export function useScannedBooths() {
  const query = useInfiniteQuery({
    queryKey: ['visitor', 'scannedBooths'],
    queryFn: ({ pageParam = 0 }) =>
      visitorApi.listScannedBooths({ limit: PAGE_SIZE, cursor: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 60 * 1000,
  })

  const scannedBooths = query.data?.pages.flatMap((p) => p.booths) ?? []
  const total = query.data?.pages[0]?.total ?? 0

  return {
    scannedBooths,
    total,
    isLoading: query.isLoading,
    error: query.error,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    refetch: query.refetch,
  }
}
