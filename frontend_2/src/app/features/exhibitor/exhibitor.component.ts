import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { QrStateService } from '@features/qr/qr-state.service';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { OcrService, MAX_PDF_PAGES, type OcrProgress } from './ocr.service';
import {
  ACCEPTED_EXTENSIONS,
  ACCEPTED_TYPES,
  DESCRIPTION_MAX,
  MAX_TOTAL_BYTES,
  formatBytes,
  mobileNumberValidator,
  urlValidator,
} from './exhibitor.constants';
import { UploadedFile } from './exhibitor.models';
import {
  ExhibitorService,
  type CreateEventWithBoothAndDocumentsPayload,
  type CreateEventWithBoothAndDocumentsResponse,
  type DocumentFileType,
  type ExhibitorDocumentPayload,
} from './exhibitor.service';

@Component({
  selector: 'app-exhibitor',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './exhibitor.component.html',
})
export class ExhibitorComponent {
  private fb = inject(FormBuilder);
  private ocr = inject(OcrService);
  private exhibitorApi = inject(ExhibitorService);
  private qrState = inject(QrStateService);
  private router = inject(Router);

  readonly descriptionMax = DESCRIPTION_MAX;
  readonly acceptedExtensions = ACCEPTED_EXTENSIONS;
  readonly maxPdfPages = MAX_PDF_PAGES;

  form: FormGroup = this.fb.group({
    eventName: ['', [Validators.required, Validators.maxLength(200)]],
    mobileNumber: ['', [Validators.required, mobileNumberValidator()]],
    eventUrl: ['', [Validators.required, urlValidator()]],
    boothName: ['', [Validators.required, Validators.maxLength(200)]],
    description: [
      '',
      [Validators.required, Validators.maxLength(DESCRIPTION_MAX)],
    ],
  });

  uploadedFiles = signal<UploadedFile[]>([]);
  dragActive = signal(false);
  fileError = signal<string | null>(null);
  submitted = signal(false);
  submitting = signal(false);
  submitError = signal<string | null>(null);
  submitResult = signal<CreateEventWithBoothAndDocumentsResponse | null>(null);
  private extractionQueue: Promise<void> = Promise.resolve();

  descriptionLength = computed(() => {
    const value = this.form.get('description')?.value ?? '';
    return (value as string).length;
  });

  isExtracting = computed(() =>
    this.uploadedFiles().some(
      (f) => f.status === 'extracting' || f.status === 'queued',
    ),
  );

  formatSize = formatBytes;

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    if (!control) return false;
    return control.invalid && (control.touched || this.submitted());
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragActive.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragActive.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragActive.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.addFiles(Array.from(files));
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.addFiles(Array.from(input.files));
    }
    input.value = '';
  }

  removeFile(id: string): void {
    this.uploadedFiles.set(this.uploadedFiles().filter((f) => f.id !== id));
    this.fileError.set(null);
  }

  onReset(): void {
    this.form.reset();
    this.uploadedFiles.set([]);
    this.fileError.set(null);
    this.submitted.set(false);
    this.submitError.set(null);
    this.submitResult.set(null);
  }

  onSubmit(): void {
    this.submitted.set(true);
    this.submitError.set(null);
    this.form.markAllAsTouched();

    if (this.uploadedFiles().length === 0) {
      this.fileError.set('At least one file required.');
    }

    if (
      this.form.invalid ||
      this.uploadedFiles().length === 0 ||
      this.isExtracting()
    ) {
      return;
    }

    const documents = this.buildDocumentsPayload();
    if (documents.length === 0) {
      this.submitError.set(
        'No documents have extracted text. Wait for OCR to finish or remove failed files.',
      );
      return;
    }

    const { eventName, boothName, description } = this.form.value as {
      eventName: string;
      boothName: string;
      description: string;
    };

    const payload: CreateEventWithBoothAndDocumentsPayload = {
      eventName,
      boothName,
      description,
      documents,
    };

    this.submitting.set(true);
    this.exhibitorApi.createEventWithBoothAndDocuments(payload).subscribe({
      next: (result) => {
        this.submitResult.set(result);
        this.submitting.set(false);
        this.qrState.set({
          event: result.event,
          booth: result.booth,
          documents: result.documents,
        });
        void this.router.navigate(['/home/exhibitor/qr']);
      },
      error: (err: unknown) => {
        const message =
          err instanceof Error
            ? err.message
            : (err as { error?: { message?: string } })?.error?.message ??
              'Failed to create booth. Please try again.';
        this.submitError.set(message);
        this.submitting.set(false);
      },
    });
  }

  private buildDocumentsPayload(): ExhibitorDocumentPayload[] {
    return this.uploadedFiles()
      .filter((f) => f.status === 'done' && !!f.text)
      .map((f) => ({
        rawText: f.text ?? '',
        fileType: this.fileTypeFor(f),
        fileName: f.name,
        mimeType: f.type || undefined,
        sizeBytes: f.size,
        isPublic: true,
      }));
  }

  private fileTypeFor(f: UploadedFile): DocumentFileType {
    return f.type.startsWith('image/') ? 'card' : 'brochure';
  }

  private addFiles(incoming: File[]): void {
    const current = this.uploadedFiles();
    const accepted: UploadedFile[] = [];
    let runningTotal = current.reduce((sum, f) => sum + f.size, 0);
    let rejected = false;

    for (const file of incoming) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        this.fileError.set('Only JPG, PNG, or PDF files are allowed.');
        rejected = true;
        continue;
      }
      if (runningTotal + file.size > MAX_TOTAL_BYTES) {
        this.fileError.set('Total file size cannot exceed 20 MB.');
        rejected = true;
        continue;
      }
      runningTotal += file.size;
      accepted.push({
        id: crypto.randomUUID(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'queued',
        progress: 0,
        progressLabel: 'Queued…',
      });
    }

    if (!rejected) this.fileError.set(null);
    if (accepted.length === 0) return;

    this.uploadedFiles.set([...current, ...accepted]);
    for (const item of accepted) {
      this.extractionQueue = this.extractionQueue.then(() =>
        this.runExtraction(item.id),
      );
    }
  }

  private async runExtraction(id: string): Promise<void> {
    const item = this.uploadedFiles().find((f) => f.id === id);
    if (!item || item.status === 'done' || item.status === 'error') return;

    this.updateFile(id, {
      status: 'extracting',
      progress: 0,
      progressLabel: 'Starting…',
    });

    try {
      const result = await this.ocr.extractText(item.file, (p: OcrProgress) =>
        this.updateFile(id, {
          progress: Math.max(0, Math.min(1, p.progress)),
          progressLabel: this.labelFor(p),
          currentPage: p.currentPage,
          totalPages: p.totalPages,
        }),
      );
      this.updateFile(id, {
        status: 'done',
        progress: 1,
        progressLabel:
          result.totalPages > result.pagesProcessed
            ? `Done · ${result.pagesProcessed}/${result.totalPages} pages`
            : 'Done',
        text: result.text,
        totalPages: result.totalPages,
        currentPage: result.pagesProcessed,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Extraction failed';
      this.updateFile(id, {
        status: 'error',
        progress: 1,
        progressLabel: 'Failed',
        error: message,
      });
    }
  }

  private updateFile(id: string, patch: Partial<UploadedFile>): void {
    this.uploadedFiles.set(
      this.uploadedFiles().map((f) => (f.id === id ? { ...f, ...patch } : f)),
    );
  }

  private labelFor(p: OcrProgress): string {
    const pct = Math.round(p.progress * 100);
    switch (p.status) {
      case 'loading':
        return 'Loading…';
      case 'rendering':
        return p.currentPage && p.totalPages
          ? `Rendering page ${p.currentPage}/${p.totalPages}`
          : 'Rendering…';
      case 'recognizing':
        return p.currentPage && p.totalPages
          ? `OCR page ${p.currentPage}/${p.totalPages} · ${pct}%`
          : `OCR ${pct}%`;
      case 'done':
        return 'Done';
      case 'error':
        return 'Failed';
    }
  }
}
