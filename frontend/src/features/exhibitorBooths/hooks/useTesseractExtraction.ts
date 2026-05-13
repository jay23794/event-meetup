import { useState, useCallback } from 'react'
import Tesseract from 'tesseract.js'

export interface ExtractionResult {
  text: string
  confidence: number
  processingTimeMs: number
}

export interface ExtractionState {
  isExtracting: boolean
  error: string | null
  progress: number
}

export function useTesseractExtraction() {
  const [state, setState] = useState<ExtractionState>({
    isExtracting: false,
    error: null,
    progress: 0,
  })

  const extractText = useCallback(async (file: File): Promise<ExtractionResult | null> => {
    if (!file.type.startsWith('image/')) {
      setState({ isExtracting: false, error: 'Only image files supported', progress: 0 })
      return null
    }

    setState({ isExtracting: true, error: null, progress: 0 })
    const startTime = performance.now()

    try {
      console.log('[Tesseract] Starting extraction for:', file.name)

      const result = await Tesseract.recognize(
        file,
        'eng',
        {
          logger: (m) => {
            console.log('[Tesseract Progress]', m.status, Math.round(m.progress * 100) + '%')
            if (m.status === 'recognizing') {
              setState((prev) => ({
                ...prev,
                progress: Math.round(m.progress * 100),
              }))
            }
          },
        }
      )

      const endTime = performance.now()
      const processingTimeMs = Math.round(endTime - startTime)

      const extractedText = result.data.text.trim()
      const confidence = result.data.confidence

      console.log('[Tesseract] Extraction complete:', {
        text: extractedText.substring(0, 100) + '...',
        confidence: (confidence * 100).toFixed(1) + '%',
        processingTimeMs,
      })

      setState({ isExtracting: false, error: null, progress: 100 })

      return {
        text: extractedText,
        confidence,
        processingTimeMs,
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Text extraction failed'
      console.error('[Tesseract] Error:', errorMsg)
      setState({ isExtracting: false, error: errorMsg, progress: 0 })
      return null
    }
  }, [])

  const reset = useCallback(() => {
    setState({ isExtracting: false, error: null, progress: 0 })
  }, [])

  return {
    extractText,
    reset,
    ...state,
  }
}
