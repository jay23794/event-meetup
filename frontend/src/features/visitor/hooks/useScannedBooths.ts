import { useQuery } from '@tanstack/react-query'
import { visitorApi } from '../api/visitor.api'

export function useScannedBooths() {
  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ['visitor', 'scannedBooths'],
    queryFn: visitorApi.listScannedBooths,
    staleTime: 60 * 1000,
  })
  return { scannedBooths: data, isLoading, error, refetch }
}
