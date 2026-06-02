import { Injectable } from '@angular/core';
import { createWorker, type Worker } from 'tesseract.js';

export const MAX_PDF_PAGES = 4;

export interface OcrProgress {
  status: 'loading' | 'rendering' | 'recognizing' | 'done' | 'error';
  progress: number;
  currentPage?: number;
  totalPages?: number;
  message?: string;
}

export interface OcrResult {
  text: string;
  pages: string[];
  pagesProcessed: number;
  totalPages: number;
}

type ProgressCallback = (p: OcrProgress) => void;

@Injectable({ providedIn: 'root' })
export class OcrService {
  private workerPromise: Promise<Worker> | null = null;
  private pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null;
  private activeRecognitionLogger:
    | ((p: { status: string; progress: number }) => void)
    | null = null;

  async extractText(
    file: File,
    onProgress: ProgressCallback,
  ): Promise<OcrResult> {
    try {
      if (file.type === 'application/pdf') {
        return await this.extractFromPdf(file, onProgress);
      }
      return await this.extractFromImage(file, onProgress);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Extraction failed';
      onProgress({ status: 'error', progress: 0, message });
      throw error;
    } finally {
      this.activeRecognitionLogger = null;
    }
  }

  async terminate(): Promise<void> {
    if (this.workerPromise) {
      const worker = await this.workerPromise;
      await worker.terminate();
      this.workerPromise = null;
    }
  }

  private async extractFromImage(
    file: File,
    onProgress: ProgressCallback,
  ): Promise<OcrResult> {
    onProgress({ status: 'loading', progress: 0, totalPages: 1 });
    const worker = await this.getWorker();
    onProgress({
      status: 'recognizing',
      progress: 0,
      currentPage: 1,
      totalPages: 1,
    });
    this.activeRecognitionLogger = (m) => {
      if (m.status === 'recognizing text') {
        onProgress({
          status: 'recognizing',
          progress: m.progress,
          currentPage: 1,
          totalPages: 1,
        });
      }
    };
    const { data } = await worker.recognize(file);
    this.activeRecognitionLogger = null;
    onProgress({
      status: 'done',
      progress: 1,
      currentPage: 1,
      totalPages: 1,
    });
    return {
      text: data.text.trim(),
      pages: [data.text.trim()],
      pagesProcessed: 1,
      totalPages: 1,
    };
  }

  private async extractFromPdf(
    file: File,
    onProgress: ProgressCallback,
  ): Promise<OcrResult> {
    onProgress({ status: 'loading', progress: 0 });
    const pdfjs = await this.getPdfJs();
    const data = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data });
    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;
    const pagesToProcess = Math.min(totalPages, MAX_PDF_PAGES);

    const worker = await this.getWorker();
    const pages: string[] = [];

    for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
      onProgress({
        status: 'rendering',
        progress: (pageNum - 1) / pagesToProcess,
        currentPage: pageNum,
        totalPages: pagesToProcess,
      });

      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas 2D context unavailable');

      await page.render({ canvasContext: context, viewport, canvas }).promise;

      onProgress({
        status: 'recognizing',
        progress: (pageNum - 1) / pagesToProcess,
        currentPage: pageNum,
        totalPages: pagesToProcess,
      });

      const blob: Blob = await new Promise((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
          'image/png',
        ),
      );

      this.activeRecognitionLogger = (m) => {
        if (m.status === 'recognizing text') {
          const pageFraction =
            ((pageNum - 1) + m.progress) / pagesToProcess;
          onProgress({
            status: 'recognizing',
            progress: pageFraction,
            currentPage: pageNum,
            totalPages: pagesToProcess,
          });
        }
      };
      const { data: result } = await worker.recognize(blob);
      this.activeRecognitionLogger = null;
      pages.push(result.text.trim());

      onProgress({
        status: 'recognizing',
        progress: pageNum / pagesToProcess,
        currentPage: pageNum,
        totalPages: pagesToProcess,
      });

      page.cleanup();
    }

    await pdf.cleanup();
    onProgress({
      status: 'done',
      progress: 1,
      currentPage: pagesToProcess,
      totalPages: pagesToProcess,
    });

    return {
      text: pages.join('\n\n').trim(),
      pages,
      pagesProcessed: pagesToProcess,
      totalPages,
    };
  }

  private getWorker(): Promise<Worker> {
    if (!this.workerPromise) {
      this.workerPromise = createWorker('eng', 1, {
        logger: (m: { status: string; progress: number }) => {
          this.activeRecognitionLogger?.(m);
        },
      });
    }
    return this.workerPromise;
  }

  private async getPdfJs(): Promise<typeof import('pdfjs-dist')> {
    if (!this.pdfjsPromise) {
      this.pdfjsPromise = import('pdfjs-dist').then((mod) => {
        mod.GlobalWorkerOptions.workerSrc = '/assets/pdf.worker.min.mjs';
        return mod;
      });
    }
    return this.pdfjsPromise;
  }
}
