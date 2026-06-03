import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { CheckInService } from './check-in.service';
import type {
  BoothDocument,
  BoothInfo,
  CheckInPayload,
  CheckInResult,
} from './check-in.models';
import { AuthService } from '@core/services/auth.service';

function phoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value ?? '').toString().trim();
    if (!value) return null;
    const digits = value.replace(/[^\d]/g, '');
    if (digits.length < 10 || digits.length > 15) {
      return { phone: true };
    }
    return null;
  };
}

@Component({
  selector: 'app-visitor-check-in',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './check-in.component.html',
})
export class CheckInComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private service = inject(CheckInService);
  private auth = inject(AuthService);

  qrId = signal<string | null>(null);
  booth = signal<BoothInfo | null>(null);
  documents = signal<BoothDocument[]>([]);

  loading = signal(true);
  loadError = signal<string | null>(null);

  submitted = signal(false);
  submitting = signal(false);
  submitError = signal<string | null>(null);
  submitResult = signal<CheckInResult | null>(null);

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [phoneValidator()]],
  });

  pdfDocuments = computed(() =>
    this.documents().filter(
      (d) =>
        d.mimeType === 'application/pdf' ||
        d.fileName.toLowerCase().endsWith('.pdf'),
    ),
  );

  otherDocuments = computed(() =>
    this.documents().filter(
      (d) =>
        d.mimeType !== 'application/pdf' &&
        !d.fileName.toLowerCase().endsWith('.pdf'),
    ),
  );

  visitorCount = computed(() => {
    const result = this.submitResult();
    if (result) return result.booth.scanCount;
    return this.booth()?.scanCount ?? 0;
  });

  ngOnInit(): void {
    const qrId = this.route.snapshot.paramMap.get('qrId');
    if (!qrId) {
      this.loadError.set('Missing booth QR code.');
      this.loading.set(false);
      return;
    }
    this.qrId.set(qrId);
    this.prefillFromAuthUser();
    this.load(qrId);
  }

  load(qrId: string): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.service.loadBoothView(qrId).subscribe({
      next: ({ booth, documents }) => {
        this.booth.set(booth);
        this.documents.set(documents);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        const message =
          err instanceof Error
            ? err.message
            : (err as { error?: { message?: string } })?.error?.message ??
              'Failed to load booth details. Please try again.';
        this.loadError.set(message);
        this.loading.set(false);
      },
    });
  }

  private prefillFromAuthUser(): void {
    const user = this.auth.user();
    if (!user) return;
    this.form.patchValue({
      name: user.name ?? '',
      email: user.email ?? '',
    });
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    if (!control) return false;
    return control.invalid && (control.touched || this.submitted());
  }

  onSubmit(): void {
    this.submitted.set(true);
    this.submitError.set(null);
    this.form.markAllAsTouched();

    if (this.form.invalid) return;
    const qrId = this.qrId();
    if (!qrId) return;

    const { name, email, phone } = this.form.value as {
      name: string;
      email: string;
      phone: string;
    };

    const payload: CheckInPayload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim() ? phone.trim() : undefined,
    };

    this.submitting.set(true);
    this.service.checkIn(qrId, payload).subscribe({
      next: (result) => {
        this.submitResult.set(result);
        this.submitting.set(false);
      },
      error: (err: unknown) => {
        const message =
          err instanceof Error
            ? err.message
            : (err as { error?: { message?: string } })?.error?.message ??
              'Check-in failed. Please try again.';
        this.submitError.set(message);
        this.submitting.set(false);
      },
    });
  }

  resetForAnother(): void {
    this.submitted.set(false);
    this.submitResult.set(null);
    this.submitError.set(null);
    this.form.reset({ name: '', email: '', phone: '' });
    this.prefillFromAuthUser();
  }

  formatSize(bytes?: number): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
