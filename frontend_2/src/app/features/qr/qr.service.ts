import { Injectable } from '@angular/core';
import * as QRCode from 'qrcode';

@Injectable({ providedIn: 'root' })
export class QrService {
  async toDataUrl(
    text: string,
    options?: QRCode.QRCodeToDataURLOptions,
  ): Promise<string> {
    return QRCode.toDataURL(text, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: 'M',
      ...options,
    });
  }
}
