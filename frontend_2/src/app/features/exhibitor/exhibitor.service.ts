import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { AuthService } from '@core/services/auth.service';

export type DocumentFileType = 'card' | 'brochure';

export interface ExhibitorDocumentPayload {
  rawText: string;
  fileType: DocumentFileType;
  fileName: string;
  driveFileId?: string;
  driveFileUrl?: string;
  mimeType?: string;
  sizeBytes?: number;
  isPublic?: boolean;
}

export interface CreateEventWithBoothAndDocumentsPayload {
  eventName: string;
  startDate?: string;
  endDate?: string;
  boothName: string;
  description: string;
  documents: ExhibitorDocumentPayload[];
}

export interface CreatedEvent {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  driveEventFolderId?: string;
  driveImagesFolderId?: string;
}

export interface CreatedBooth {
  id: string;
  boothName: string;
  description: string;
  qrId: string;
  qrUrl: string;
}

export interface ProcessedDocument {
  id: string;
  fileName: string;
  fileType: DocumentFileType;
  extractedName?: string;
  extractedCompany?: string;
  extractedEmail?: string;
  extractedPhone?: string;
  extractedTitle?: string;
  extractedWebsite?: string;
  extractedAddress?: string;
}

export interface CreateEventWithBoothAndDocumentsResponse {
  event: CreatedEvent;
  booth: CreatedBooth;
  documents: ProcessedDocument[];
}

interface ApiResponseBody<T> {
  success: boolean;
  data?: T;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ExhibitorService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  createEventWithBoothAndDocuments(
    payload: CreateEventWithBoothAndDocumentsPayload,
  ): Observable<CreateEventWithBoothAndDocumentsResponse> {
    const url = `${environment.apiUrl}/exhibitor/events/create-with-booth-and-documents`;
    return this.http
      .post<ApiResponseBody<CreateEventWithBoothAndDocumentsResponse>>(url, payload, {
        headers: this.authHeaders(),
      })
      .pipe(
        map((res) => {
          if (!res.success || !res.data) {
            throw new Error(res.message || 'Failed to create event with booth and documents');
          }
          return res.data;
        }),
      );
  }

  private authHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    return new HttpHeaders(
      token
        ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        : { 'Content-Type': 'application/json' },
    );
  }
}
