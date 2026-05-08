import { useMutation, useQueryClient } from '@tanstack/react-query'
import { boothsApi } from '../api/booths.api'
import { CreateBoothInput } from '../types'

export function useCreateBooth(eventId: string) {
  const queryClient = useQueryClient()

  const { mutate, isPending, error } = useMutation({
    mutationFn: (input: CreateBoothInput) =>
      boothsApi.createBooth(eventId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booths', eventId] })
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
    },
  })

  return {
    createBooth: mutate,
    isPending,
    error,
  }
}
