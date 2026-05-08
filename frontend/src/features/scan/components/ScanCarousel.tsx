import { useState, useEffect } from 'react'
import {
  VStack,
  Button,
  Text,
  HStack,
  Box,
  Badge,
} from '@chakra-ui/react'
import { FiPlus } from 'react-icons/fi'
import { useScan } from '../hooks/useScan'
import { ProcessingScan, ExtractedFields } from '../types'
import { ScanCapture } from './ScanCapture'
import { ScanReview } from './ScanReview'
import { useToast } from '../../../shared/hooks/useToast'

interface ScanCarouselProps {
  eventId: string
  onScansReady: (scans: ProcessingScan[]) => void
}

export function ScanCarousel({ eventId, onScansReady }: ScanCarouselProps) {
  const [scans, setScans] = useState<ProcessingScan[]>([])
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const { processScan, isPending } = useScan(eventId)
  const { error: showError, success: showSuccess } = useToast()

  const maxScans = 2

  // Update parent whenever scans change
  useEffect(() => {
    onScansReady(scans)
  }, [scans, onScansReady])

  const handleCapture = async (file: File) => {
    if (scans.length >= maxScans) {
      showError(`Maximum ${maxScans} uploads allowed`)
      return
    }

    const scanId = Date.now().toString()
    const newScan: ProcessingScan = {
      id: scanId,
      status: 'processing',
      imageFile: file,
    }

    setScans((prev) => [...prev, newScan])

    try {
      const result = await processScan(file)
      setScans((prev) =>
        prev.map((scan) =>
          scan.id === scanId
            ? {
                ...scan,
                status: 'reviewing',
                imageUrl: result.imageUrl,
                extractedFields: result.extractedFields,
                rawText: result.rawText,
                driveFileId: result.driveFileId,
              }
            : scan
        )
      )
      // Set currentIndex to show the review screen
      setScans((prev) => {
        const idx = prev.findIndex((s) => s.id === scanId)
        setCurrentIndex(idx)
        return prev
      })
      showSuccess('Image processed successfully')
    } catch (err) {
      setScans((prev) =>
        prev.map((scan) =>
          scan.id === scanId
            ? {
                ...scan,
                status: 'capturing',
                error: 'Failed to process image',
              }
            : scan
        )
      )
      showError('Failed to process image. Please try again.')
    }
  }

  const handleConfirm = (fields: ExtractedFields) => {
    if (currentIndex === null) return

    setScans((prev) =>
      prev.map((scan, idx) =>
        idx === currentIndex
          ? { ...scan, status: 'completed', extractedFields: fields }
          : scan
      )
    )
    setCurrentIndex(null)
  }

  const handleDelete = () => {
    if (currentIndex === null) return
    setScans((prev) => prev.filter((_, idx) => idx !== currentIndex))
    setCurrentIndex(null)
  }

  const handleRescan = () => {
    if (currentIndex === null) return
    setScans((prev) =>
      prev.map((scan, idx) =>
        idx === currentIndex
          ? { ...scan, status: 'capturing', imageUrl: undefined, extractedFields: undefined }
          : scan
      )
    )
  }

  const handleAddMore = () => {
    // Create a new capturing scan
    const scanId = Date.now().toString()
    setScans((prev) => [
      ...prev,
      {
        id: scanId,
        status: 'capturing',
      },
    ])
    setCurrentIndex((prev) => (prev === null ? scans.length : prev))
  }

  const completedCount = scans.filter((s) => s.status === 'completed').length
  const isMaxed = scans.length >= maxScans

  if (currentIndex !== null) {
    const current = scans[currentIndex]
    if (current.status === 'capturing' || current.status === 'processing') {
      return (
        <ScanCapture
          onCapture={(file) => {
            const newScans = [...scans]
            newScans[currentIndex] = {
              ...newScans[currentIndex],
              imageFile: file,
            }
            handleCapture(file)
          }}
          isLoading={isPending}
        />
      )
    } else if (current.status === 'reviewing' && current.imageUrl && current.extractedFields) {
      return (
        <ScanReview
          imageUrl={current.imageUrl}
          extractedFields={current.extractedFields}
          onConfirm={handleConfirm}
          onDelete={handleDelete}
          onRescan={handleRescan}
        />
      )
    }
  }

  return (
    <VStack spacing={4} w="full">
      <VStack spacing={2} w="full">
        <HStack w="full" justify="space-between">
          <VStack align="start" spacing={0}>
            <Text fontWeight="bold" color="brand.900">
              Scan business cards
            </Text>
            <Text fontSize="xs" color="brand.600">
              {scans.length}/{maxScans} uploaded
            </Text>
          </VStack>
          <Badge colorScheme="brand">{completedCount} completed</Badge>
        </HStack>

        {scans.length > 0 && (
          <VStack spacing={2} w="full">
            {scans.map((scan, idx) => (
              <Box
                key={scan.id}
                p={2}
                borderRadius="md"
                bg={
                  scan.status === 'completed'
                    ? 'brand.300'
                    : scan.status === 'reviewing'
                      ? 'brand.400'
                      : 'brand.200'
                }
                w="full"
                borderLeft="4px solid"
                borderLeftColor={
                  scan.status === 'completed'
                    ? 'brand.800'
                    : 'brand.600'
                }
              >
                <HStack justify="space-between">
                  <Text fontSize="sm" color="brand.900">
                    Scan {idx + 1} — {scan.status}
                  </Text>
                  {scan.status === 'completed' && (
                    <Text fontSize="xs" color="brand.600">
                      {scan.extractedFields?.name || 'Unnamed'}
                    </Text>
                  )}
                </HStack>
              </Box>
            ))}
          </VStack>
        )}
      </VStack>

      {completedCount > 0 && (
        <Button
          w="full"
          leftIcon={<FiPlus />}
          variant="outline"
          onClick={handleAddMore}
          isDisabled={isMaxed}
        >
          {isMaxed ? 'Maximum scans reached' : 'Add another scan'}
        </Button>
      )}

      {completedCount === 0 && scans.length === 0 && (
        <ScanCapture onCapture={handleCapture} isLoading={isPending} />
      )}
    </VStack>
  )
}
