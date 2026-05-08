import { useEffect, useState } from 'react'
import { boothsApi, BoothDetail } from '../api/booths.api'

export function useBooth(eventId: string, rowNumber: number | null) {
  const [booth, setBooth] = useState<BoothDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!rowNumber) return

    const fetchBooth = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await boothsApi.getBooth(eventId, rowNumber)
        setBooth(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load booth')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBooth()
  }, [eventId, rowNumber])

  return { booth, isLoading, error }
}
