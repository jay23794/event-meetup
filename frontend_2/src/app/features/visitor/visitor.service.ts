import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { AuthService } from '@core/services/auth.service';
import {
  EMPTY_VISITED_BOOTH_CONTACTS,
  type SharedDocument,
  type VisitedBooth,
  type VisitedBoothContacts,
} from './visitor.models';

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
  contacts?: Partial<VisitedBoothContacts>;
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
    const c = raw.contacts ?? {};
    return {
      qrId: raw.qrId,
      boothName: raw.boothName,
      eventName: raw.eventName,
      timestamp: raw.timestamp,
      contacts: {
        names: c.names ?? EMPTY_VISITED_BOOTH_CONTACTS.names,
        companies: c.companies ?? EMPTY_VISITED_BOOTH_CONTACTS.companies,
        titles: c.titles ?? EMPTY_VISITED_BOOTH_CONTACTS.titles,
        phones: c.phones ?? EMPTY_VISITED_BOOTH_CONTACTS.phones,
        emails: c.emails ?? EMPTY_VISITED_BOOTH_CONTACTS.emails,
        websites: c.websites ?? EMPTY_VISITED_BOOTH_CONTACTS.websites,
        socials: c.socials ?? EMPTY_VISITED_BOOTH_CONTACTS.socials,
        addresses: c.addresses ?? EMPTY_VISITED_BOOTH_CONTACTS.addresses,
      },
      sharedDocuments: raw.sharedDocuments ?? [],
    };
  }

  private authHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }
}
