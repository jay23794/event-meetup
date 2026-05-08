import { useMutation } from '@tanstack/react-query'
import { scanApi } from '../api/scan.api'

export function useScan(eventId: string) {
  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: (imageFile: File) => scanApi.processScan(imageFile, eventId),
  })

  return {
    processScan: mutateAsync,
    isPending,
    error,
  }
}
