import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { VisitorService } from './visitor.service';
import type { VisitedBooth } from './visitor.models';

@Component({
  selector: 'app-visitor',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './visitor.component.html',
})
export class VisitorComponent implements OnInit {
  private service = inject(VisitorService);

  booths = signal<VisitedBooth[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  expandedQrId = signal<string | null>(null);

  totalCount = computed(() => this.booths().length);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.listVisitedBooths().subscribe({
      next: (items) => {
        this.booths.set(items);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to load visited booths. Please try again.';
        this.error.set(message);
        this.loading.set(false);
      },
    });
  }

  toggleDocuments(qrId: string): void {
    this.expandedQrId.set(this.expandedQrId() === qrId ? null : qrId);
  }

  isExpanded(qrId: string): boolean {
    return this.expandedQrId() === qrId;
  }

  fileNameFor(url: string, fallback?: string): string {
    if (fallback) return fallback;
    try {
      const parsed = new URL(url);
      const segments = parsed.pathname.split('/').filter(Boolean);
      const last = segments[segments.length - 1];
      return last ? decodeURIComponent(last) : url;
    } catch {
      return url;
    }
  }

  absoluteTime(iso: string): string {
    return new Date(iso).toLocaleString();
  }

  relativeTime(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const sec = Math.round(diffMs / 1000);
    if (sec < 60) return 'just now';
    const min = Math.round(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.round(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.round(hr / 24);
    if (day < 7) return `${day}d ago`;
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  }
}
