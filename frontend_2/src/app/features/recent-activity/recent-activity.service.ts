import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  Observable,
  catchError,
  forkJoin,
  map,
  of,
  switchMap,
  throwError,
} from 'rxjs';
import { environment } from '@env/environment';
import { AuthService } from '@core/services/auth.service';
import type {
  CreatedBooth,
  CreatedEvent,
  ProcessedDocument,
} from '@features/exhibitor/exhibitor.service';
import type { QrPageData } from '@features/qr/qr.models';

interface ApiResponseBody<T> {
  success: boolean;
  data?: T;
  message: string;
}

interface ScannedBoothItem {
  timestamp: string;
  boothName: string;
  eventName: string;
  qrId: string;
  sharedDocuments: Array<{ url: string; fileName?: string }>;
}

interface ScannedBoothsResponse {
  booths: ScannedBoothItem[];
  nextCursor: number | null;
  total: number;
}

export interface ExhibitorEventItem {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  boothCount: number;
  createdAt: string;
  updatedAt?: string;
  driveEventFolderId?: string;
  driveImagesFolderId?: string;
}

interface RawExhibitorEvent {
  _id?: string;
  id?: string;
  name: string;
  startDate?: string;
  endDate?: string;
  boothCount?: number;
  createdAt: string;
  updatedAt?: string;
  driveEventFolderId?: string;
  driveImagesFolderId?: string;
}

interface ListEventsResponse {
  events: RawExhibitorEvent[];
}

export type ActivityKind = 'visited_booth' | 'created_exhibitor_event';

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  title: string;
  subtitle: string;
  timestamp: string;
  eventId?: string;
}

interface RawBooth {
  _id?: string;
  id?: string;
  boothName: string;
  description?: string;
  qrId: string;
  qrUrl: string;
}

interface RawDocument {
  _id?: string;
  id?: string;
  fileName: string;
  fileType: 'card' | 'brochure';
  extractedName?: string;
  extractedCompany?: string;
  extractedEmail?: string;
  extractedPhone?: string;
  extractedTitle?: string;
  extractedWebsite?: string;
  extractedAddress?: string;
}

interface ListBoothsResponse {
  booths: RawBooth[];
}

interface ListDocumentsResponse {
  documents: RawDocument[];
}

@Injectable({ providedIn: 'root' })
export class RecentActivityService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  loadActivities(): Observable<ActivityItem[]> {
    return forkJoin({
      visited: this.fetchScannedBooths(),
      events: this.loadCreatedEvents(),
    }).pipe(
      map(({ visited, events }) => {
        const items: ActivityItem[] = [
          ...visited.map<ActivityItem>((b) => ({
            id: `visited:${b.qrId}:${b.timestamp}`,
            kind: 'visited_booth',
            title: `Visited booth ${b.boothName}`,
            subtitle: b.eventName ? `at ${b.eventName}` : 'Booth scan',
            timestamp: b.timestamp,
          })),
          ...events.map<ActivityItem>((e) => ({
            id: `event:${e.id}`,
            kind: 'created_exhibitor_event',
            title: `${e.name}`,
            subtitle: this.buildEventSubtitle(e),
            timestamp: e.createdAt,
            eventId: e.id,
          })),
        ];
        return items.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );
      }),
    );
  }

  loadCreatedEvents(): Observable<ExhibitorEventItem[]> {
    const url = `${environment.apiUrl}/exhibitor/events`;
    return this.http
      .get<ApiResponseBody<ListEventsResponse>>(url, {
        headers: this.authHeaders(),
      })
      .pipe(
        map((res) =>
          (res.data?.events ?? []).map((e) => this.normalizeEvent(e)),
        ),
        map((events) =>
          [...events].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime(),
          ),
        ),
        catchError(() => of<ExhibitorEventItem[]>([])),
      );
  }

  loadEventDetail(eventMeta: ExhibitorEventItem): Observable<QrPageData> {
    if (!eventMeta.id) {
      return throwError(() => new Error('Missing event id'));
    }
    const url = `${environment.apiUrl}/exhibitor/events/${eventMeta.id}/booths`;
    return this.http
      .get<ApiResponseBody<ListBoothsResponse>>(url, {
        headers: this.authHeaders(),
      })
      .pipe(
        switchMap((res) => {
          const booths = res.data?.booths ?? [];
          const firstBooth = booths[0];
          if (!firstBooth) {
            return throwError(
              () => new Error('This event has no booths yet.'),
            );
          }
          const booth = this.normalizeBooth(firstBooth);
          return this.fetchBoothDocuments(booth.id).pipe(
            map<ProcessedDocument[], QrPageData>((documents) => ({
              event: this.toCreatedEvent(eventMeta),
              booth,
              documents,
            })),
          );
        }),
      );
  }

  private fetchBoothDocuments(boothId: string): Observable<ProcessedDocument[]> {
    const url = `${environment.apiUrl}/exhibitor/booths/${boothId}/documents`;
    return this.http
      .get<ApiResponseBody<ListDocumentsResponse>>(url, {
        headers: this.authHeaders(),
      })
      .pipe(
        map((res) =>
          (res.data?.documents ?? []).map((d) => this.normalizeDocument(d)),
        ),
        catchError(() => of<ProcessedDocument[]>([])),
      );
  }

  private normalizeBooth(raw: RawBooth): CreatedBooth {
    return {
      id: raw.id ?? raw._id ?? '',
      boothName: raw.boothName,
      description: raw.description ?? '',
      qrId: raw.qrId,
      qrUrl: raw.qrUrl,
    };
  }

  private normalizeDocument(raw: RawDocument): ProcessedDocument {
    return {
      id: raw.id ?? raw._id ?? '',
      fileName: raw.fileName,
      fileType: raw.fileType,
      extractedName: raw.extractedName,
      extractedCompany: raw.extractedCompany,
      extractedEmail: raw.extractedEmail,
      extractedPhone: raw.extractedPhone,
      extractedTitle: raw.extractedTitle,
      extractedWebsite: raw.extractedWebsite,
      extractedAddress: raw.extractedAddress,
    };
  }

  private toCreatedEvent(e: ExhibitorEventItem): CreatedEvent {
    return {
      id: e.id,
      name: e.name,
      startDate: e.startDate,
      endDate: e.endDate,
      driveEventFolderId: e.driveEventFolderId,
      driveImagesFolderId: e.driveImagesFolderId,
    };
  }

  private fetchScannedBooths(): Observable<ScannedBoothItem[]> {
    const url = `${environment.apiUrl}/visitor/scanned-booths?limit=50`;
    return this.http
      .get<ApiResponseBody<ScannedBoothsResponse>>(url, {
        headers: this.authHeaders(),
      })
      .pipe(
        map((res) => res.data?.booths ?? []),
        catchError(() => of<ScannedBoothItem[]>([])),
      );
  }

  private normalizeEvent(raw: RawExhibitorEvent): ExhibitorEventItem {
    return {
      id: raw.id ?? raw._id ?? '',
      name: raw.name,
      startDate: raw.startDate,
      endDate: raw.endDate,
      boothCount: raw.boothCount ?? 0,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      driveEventFolderId: raw.driveEventFolderId,
      driveImagesFolderId: raw.driveImagesFolderId,
    };
  }

  private buildEventSubtitle(e: ExhibitorEventItem): string {
    const range = this.formatRange(e.startDate, e.endDate);
    const booths = `${e.boothCount} ${e.boothCount === 1 ? 'booth' : 'booths'}`;
    return range === 'New event' ? booths : `${range} · ${booths}`;
  }

  private authHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  private formatRange(start?: string, end?: string): string {
    if (!start && !end) return 'New event';
    const fmt = (d: string) =>
      new Date(d).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    if (start && end) return `${fmt(start)} – ${fmt(end)}`;
    return fmt((start ?? end) as string);
  }
}
