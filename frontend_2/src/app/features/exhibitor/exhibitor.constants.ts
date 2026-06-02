import {
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

export const DESCRIPTION_MAX = 5000;
export const MAX_TOTAL_BYTES = 20 * 1024 * 1024;
export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
export const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.pdf';

export function mobileNumberValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value ?? '').toString().trim();
    if (!value) return null;
    const digits = value.replace(/[^\d]/g, '');
    if (digits.length < 10 || digits.length > 15) {
      return { mobile: true };
    }
    return null;
  };
}

export function urlValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value ?? '').toString().trim();
    if (!value) return null;
    try {
      const url = new URL(value);
      if (!['http:', 'https:'].includes(url.protocol)) {
        return { url: true };
      }
      return null;
    } catch {
      return { url: true };
    }
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
