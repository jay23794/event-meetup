import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { AuthService } from '@core/services/auth.service';
import type { SharedDocument, VisitedBooth } from './visitor.models';

interface ApiResponseBody<T> {
  success: boolean;
  data?: T;
  message: string;
}

interface RawVisitedBooth {
  qrId: string;
  boothName: string;
  eventName: string;
  timestamp: string;
  sharedDocuments?: SharedDocument[];
}

interface VisitedBoothsResponse {
  booths: RawVisitedBooth[];
  nextCursor: number | null;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class VisitorService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  listVisitedBooths(limit = 50): Observable<VisitedBooth[]> {
    const url = `${environment.apiUrl}/visitor/scanned-booths?limit=${limit}`;
    return this.http
      .get<ApiResponseBody<VisitedBoothsResponse>>(url, {
        headers: this.authHeaders(),
      })
      .pipe(
        map((res) => {
          if (!res.success) {
            throw new Error(res.message || 'Failed to load visited booths');
          }
          const booths = res.data?.booths ?? [];
          return booths
            .map((b) => this.normalize(b))
            .sort(
              (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime(),
            );
        }),
      );
  }

  private normalize(raw: RawVisitedBooth): VisitedBooth {
    return {
      qrId: raw.qrId,
      boothName: raw.boothName,
      eventName: raw.eventName,
      timestamp: raw.timestamp,
      sharedDocuments: raw.sharedDocuments ?? [],
    };
  }

  private authHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }
}
