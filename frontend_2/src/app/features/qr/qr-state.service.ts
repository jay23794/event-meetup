import { Injectable, signal } from '@angular/core';
import type { QrPageData } from './qr.models';

@Injectable({ providedIn: 'root' })
export class QrStateService {
  private readonly _data = signal<QrPageData | null>(null);

  set(data: QrPageData): void {
    this._data.set(data);
  }

  get(): QrPageData | null {
    return this._data();
  }

  clear(): void {
    this._data.set(null);
  }
}
