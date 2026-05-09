import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { exhibitorBoothsApi } from '../api/exhibitorBooths.api'
import { CreateBoothInput, CreateDocumentInput } from '../types'

interface CreateBoothVars {
  eventId: string
  input: CreateBoothInput
}

interface CreateDocumentVars {
  boothId: string
  input: CreateDocumentInput
}

export function useCreateBooth() {
  const queryClient = useQueryClient()

  const { mutate, isPending, error } = useMutation({
    mutationFn: ({ eventId, input }: CreateBoothVars) =>
      exhibitorBoothsApi.createBooth(eventId, input),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['exhibitor-booths', eventId] })
    },
  })

  return {
    createBooth: mutate,
    isPending,
    error,
  }
}

export function useBooth(boothId: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['exhibitor-booth', boothId],
    queryFn: () => exhibitorBoothsApi.getBooth(boothId),
    enabled: !!boothId,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })

  return {
    booth: data,
    isLoading,
    error,
  }
}

export function useExhibitorBooths(eventId: string) {
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['exhibitor-booths', eventId],
    queryFn: () => exhibitorBoothsApi.listByEvent(eventId),
    enabled: !!eventId,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  })

  return {
    booths: data,
    isLoading,
    error,
  }
}

export function useCreateDocument() {
  const queryClient = useQueryClient()

  const { mutate, isPending, error } = useMutation({
    mutationFn: ({ boothId, input }: CreateDocumentVars) =>
      exhibitorBoothsApi.createDocument(boothId, input),
    onSuccess: (_, { boothId }) => {
      queryClient.invalidateQueries({
        queryKey: ['exhibitor-booth-documents', boothId],
      })
      queryClient.invalidateQueries({ queryKey: ['exhibitor-booth', boothId] })
    },
  })

  return {
    createDocument: mutate,
    isPending,
    error,
  }
}
