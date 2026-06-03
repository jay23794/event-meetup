import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { environment } from '@env/environment';
import { AuthService } from '@core/services/auth.service';
import type {
  BoothDocument,
  BoothDocumentFileType,
  BoothInfo,
  CheckInPayload,
  CheckInResult,
} from './check-in.models';

interface ApiResponseBody<T> {
  success: boolean;
  data?: T;
  message: string;
}

interface RawBooth {
  _id?: string;
  id?: string;
  boothName: string;
  description: string;
  qrId: string;
  qrUrl: string;
  scanCount?: number;
}

interface RawBoothDocument {
  _id?: string;
  id?: string;
  fileName: string;
  fileType: BoothDocumentFileType;
  driveFileUrl?: string;
  driveFileId?: string;
  mimeType?: string;
  sizeBytes?: number;
}

export interface BoothViewData {
  booth: BoothInfo;
  documents: BoothDocument[];
}

@Injectable({ providedIn: 'root' })
export class CheckInService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  loadBoothView(qrId: string): Observable<BoothViewData> {
    return forkJoin({
      booth: this.fetchBooth(qrId),
      documents: this.fetchDocuments(qrId),
    });
  }

  checkIn(qrId: string, payload: CheckInPayload): Observable<CheckInResult> {
    const url = `${environment.apiUrl}/public/exhibitor-booths/${encodeURIComponent(qrId)}/checkin`;
    return this.http
      .post<ApiResponseBody<CheckInResult>>(url, payload, {
        headers: this.authHeaders(true),
      })
      .pipe(
        map((res) => {
          if (!res.success || !res.data) {
            throw new Error(res.message || 'Check-in failed');
          }
          return res.data;
        }),
      );
  }

  private fetchBooth(qrId: string): Observable<BoothInfo> {
    const url = `${environment.apiUrl}/public/exhibitor-booths/${encodeURIComponent(qrId)}`;
    return this.http
      .get<ApiResponseBody<{ booth: RawBooth }>>(url, {
        headers: this.authHeaders(),
      })
      .pipe(
        map((res) => {
          if (!res.success || !res.data?.booth) {
            throw new Error(res.message || 'Booth not found');
          }
          return this.normalizeBooth(res.data.booth);
        }),
      );
  }

  private fetchDocuments(qrId: string): Observable<BoothDocument[]> {
    const url = `${environment.apiUrl}/public/exhibitor-booths/${encodeURIComponent(qrId)}/documents`;
    return this.http
      .get<ApiResponseBody<{ documents: RawBoothDocument[] }>>(url, {
        headers: this.authHeaders(),
      })
      .pipe(
        map((res) =>
          (res.data?.documents ?? []).map((d) => this.normalizeDocument(d)),
        ),
      );
  }

  private normalizeBooth(raw: RawBooth): BoothInfo {
    return {
      id: raw.id ?? raw._id ?? '',
      boothName: raw.boothName,
      description: raw.description,
      qrId: raw.qrId,
      qrUrl: raw.qrUrl,
      scanCount: raw.scanCount ?? 0,
    };
  }

  private normalizeDocument(raw: RawBoothDocument): BoothDocument {
    return {
      id: raw.id ?? raw._id ?? '',
      fileName: raw.fileName,
      fileType: raw.fileType,
      driveFileUrl: raw.driveFileUrl,
      driveFileId: raw.driveFileId,
      mimeType: raw.mimeType,
      sizeBytes: raw.sizeBytes,
    };
  }

  private authHeaders(withJson = false): HttpHeaders {
    const token = this.auth.getToken();
    const base: Record<string, string> = withJson
      ? { 'Content-Type': 'application/json' }
      : {};
    if (token) base['Authorization'] = `Bearer ${token}`;
    return new HttpHeaders(base);
  }
}
