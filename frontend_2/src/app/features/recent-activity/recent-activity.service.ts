import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, map, of, catchError } from 'rxjs';
import { environment } from '@env/environment';
import { AuthService } from '@core/services/auth.service';

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

interface ExhibitorEventItem {
  _id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export type ActivityKind = 'visited_booth' | 'created_exhibitor_event';

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  title: string;
  subtitle: string;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class RecentActivityService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  loadActivities(): Observable<ActivityItem[]> {
    return forkJoin({
      visited: this.fetchScannedBooths(),
      events: this.fetchExhibitorEvents(),
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
            id: `event:${e._id}`,
            kind: 'created_exhibitor_event',
            title: `Created exhibitor event "${e.name}"`,
            subtitle: this.formatRange(e.startDate, e.endDate),
            timestamp: e.createdAt,
          })),
        ];
        return items.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );
      }),
    );
  }

  private fetchScannedBooths(): Observable<ScannedBoothItem[]> {
    const url = `${environment.apiUrl}/visitor/scanned-booths?limit=50`;
    return this.http
      .get<ApiResponseBody<ScannedBoothsResponse>>(url, { headers: this.authHeaders() })
      .pipe(
        map((res) => res.data?.booths ?? []),
        catchError(() => of([])),
      );
  }

  private fetchExhibitorEvents(): Observable<ExhibitorEventItem[]> {
    const url = `${environment.apiUrl}/exhibitor/events`;
    return this.http
      .get<ApiResponseBody<ExhibitorEventItem[]>>(url, { headers: this.authHeaders() })
      .pipe(
        map((res) => res.data ?? []),
        catchError(() => of([])),
      );
  }

  private authHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  private formatRange(start?: string, end?: string): string {
    if (!start && !end) return 'New event';
    const fmt = (d: string) =>
      new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (start && end) return `${fmt(start)} – ${fmt(end)}`;
    return fmt((start ?? end) as string);
  }
}
