import * as pdfjsLib from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min?url'

// Set up the worker to use local file
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc

export interface PDFPage {
  pageNumber: number
  canvas: HTMLCanvasElement
  width: number
  height: number
}

export async function extractPDFPages(
  file: File,
  maxPages: number = 4
): Promise<PDFPage[]> {
  console.log('[PDFExtractor] Starting PDF extraction:', { fileName: file.name, maxPages })

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const totalPages = Math.min(pdf.numPages, maxPages)
  console.log('[PDFExtractor] PDF has', pdf.numPages, 'pages, extracting', totalPages)

  const pages: PDFPage[] = []

  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
    try {
      console.log('[PDFExtractor] Processing page', pageNumber)
      const page = await pdf.getPage(pageNumber)

      const scale = 2 // High quality for OCR
      const viewport = page.getViewport({ scale })

      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height

      const context = canvas.getContext('2d')
      if (!context) throw new Error('Could not get canvas context')

      await (page.render as any)({
        canvasContext: context,
        viewport: viewport,
      }).promise

      pages.push({
        pageNumber,
        canvas,
        width: viewport.width,
        height: viewport.height,
      })

      console.log('[PDFExtractor] Page', pageNumber, 'extracted successfully')
    } catch (err) {
      console.error('[PDFExtractor] Error processing page', pageNumber, err)
      throw err
    }
  }

  return pages
}

export function canvasToFile(canvas: HTMLCanvasElement, fileName: string, pageNumber: number): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to convert canvas to blob'))
        return
      }
      const baseName = fileName.replace('.pdf', '')
      const file = new File([blob], `${baseName}_page_${pageNumber}.jpg`, { type: 'image/jpeg' })
      resolve(file)
    }, 'image/jpeg', 0.95)
  })
}
