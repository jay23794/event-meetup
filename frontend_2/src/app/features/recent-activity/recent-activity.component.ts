import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  ActivityItem,
  ActivityKind,
  RecentActivityService,
} from './recent-activity.service';

@Component({
  selector: 'app-recent-activity',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="flex flex-col gap-6">
      <header class="flex flex-col gap-1">
        <a
          routerLink="/home"
          class="text-sm font-medium text-primary-700 hover:underline"
        >
          ← Back to Home
        </a>
        <h1 class="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Recent Activity
        </h1>
        <p class="text-sm text-slate-600">
          Booths you visited and exhibitor events you created.
        </p>
      </header>

      @if (loading()) {
        <ul class="flex flex-col gap-3">
          @for (i of [1, 2, 3, 4]; track i) {
            <li
              class="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
            >
              <div class="h-10 w-10 animate-pulse rounded-xl bg-slate-200"></div>
              <div class="flex-1 space-y-2">
                <div class="h-3 w-2/3 animate-pulse rounded bg-slate-200"></div>
                <div class="h-3 w-1/3 animate-pulse rounded bg-slate-100"></div>
              </div>
            </li>
          }
        </ul>
      } @else if (error()) {
        <div
          class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          role="alert"
        >
          {{ error() }}
        </div>
      } @else if (activities().length === 0) {
        <div
          class="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500"
        >
          <p class="font-medium text-slate-700">No activity yet</p>
          <p class="mt-1 text-sm">
            Visit a booth or create an exhibitor event to get started.
          </p>
        </div>
      } @else {
        <ul class="flex flex-col gap-3">
          @for (item of activities(); track item.id) {
            <li
              class="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-primary-200 hover:shadow-md sm:p-5"
            >
              <span
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white shadow-md"
                [class]="accentFor(item.kind)"
                [attr.aria-label]="labelFor(item.kind)"
              >
                {{ badgeFor(item.kind) }}
              </span>
              <div class="flex min-w-0 flex-1 flex-col gap-0.5">
                <p class="truncate text-sm font-medium text-slate-900 sm:text-base">
                  {{ item.title }}
                </p>
                <p class="truncate text-xs text-slate-500 sm:text-sm">
                  {{ item.subtitle }}
                </p>
              </div>
              <time
                class="shrink-0 text-xs text-slate-400 sm:text-sm"
                [attr.datetime]="item.timestamp"
                [title]="absoluteTime(item.timestamp)"
              >
                {{ relativeTime(item.timestamp) }}
              </time>
            </li>
          }
        </ul>
      }
    </section>
  `,
})
export class RecentActivityComponent implements OnInit {
  private service = inject(RecentActivityService);

  activities = signal<ActivityItem[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.service.loadActivities().subscribe({
      next: (items) => {
        this.activities.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load recent activity. Please try again.');
        this.loading.set(false);
      },
    });
  }

  badgeFor(kind: ActivityKind): string {
    return kind === 'visited_booth' ? 'V' : 'E';
  }

  labelFor(kind: ActivityKind): string {
    return kind === 'visited_booth' ? 'Visited booth' : 'Created exhibitor event';
  }

  accentFor(kind: ActivityKind): string {
    return kind === 'visited_booth'
      ? 'bg-gradient-to-br from-emerald-500 to-emerald-700'
      : 'bg-gradient-to-br from-primary-500 to-primary-700';
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
