import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  ActivityItem,
  ActivityKind,
  ExhibitorEventItem,
  RecentActivityService,
  VisitedBoothContacts,
} from './recent-activity.service';
import { QrStateService } from '@features/qr/qr-state.service';

type TabKey = 'created' | 'visited';

interface TabDef {
  key: TabKey;
  label: string;
  kind: ActivityKind;
  emptyTitle: string;
  emptyHint: string;
}

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
        <h1
          class="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl"
        >
          Recent Activity
        </h1>
        <p class="text-sm text-slate-600">
          Switch tabs to view booths you created or booths you've visited.
        </p>
      </header>

      <div
        role="tablist"
        aria-label="Activity tabs"
        class="flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1"
      >
        @for (tab of tabs; track tab.key) {
          <button
            type="button"
            role="tab"
            [id]="'tab-' + tab.key"
            [attr.aria-selected]="activeTab() === tab.key"
            [attr.aria-controls]="'panel-' + tab.key"
            [tabindex]="activeTab() === tab.key ? 0 : -1"
            (click)="setTab(tab.key)"
            class="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition"
            [class.bg-white]="activeTab() === tab.key"
            [class.text-slate-900]="activeTab() === tab.key"
            [class.shadow-sm]="activeTab() === tab.key"
            [class.text-slate-600]="activeTab() !== tab.key"
            [class.hover:text-slate-900]="activeTab() !== tab.key"
          >
            {{ tab.label }}
            <span
              class="rounded-full bg-slate-200 px-1.5 text-xs font-semibold text-slate-700"
              [class.bg-primary-100]="activeTab() === tab.key"
              [class.text-primary-700]="activeTab() === tab.key"
            >
              {{ countFor(tab.kind) }}
            </span>
          </button>
        }
      </div>

      <div
        [id]="'panel-' + activeTab()"
        role="tabpanel"
        [attr.aria-labelledby]="'tab-' + activeTab()"
      >
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
        } @else if (visibleItems().length === 0) {
          <div
            class="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500"
          >
            <p class="font-medium text-slate-700">{{ currentTab().emptyTitle }}</p>
            <p class="mt-1 text-sm">{{ currentTab().emptyHint }}</p>
          </div>
        } @else {
          @if (openError()) {
            <div
              class="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              role="alert"
            >
              {{ openError() }}
            </div>
          }
          <ul class="flex flex-col gap-3">
            @for (item of visibleItems(); track item.id) {
              <li>
                @if (item.kind === 'created_exhibitor_event') {
                  <button
                    type="button"
                    (click)="onItemClick(item)"
                    [disabled]="!isClickable(item) || !!openingId()"
                    class="flex w-full items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition sm:p-5"
                    [class.cursor-pointer]="isClickable(item)"
                    [class.hover:border-primary-200]="isClickable(item)"
                    [class.hover:shadow-md]="isClickable(item)"
                    [class.cursor-default]="!isClickable(item)"
                    [class.opacity-60]="!!openingId() && openingId() !== item.id"
                    [attr.aria-busy]="openingId() === item.id"
                  >
                    <span
                      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white shadow-md"
                      [class]="accentFor(item.kind)"
                      [attr.aria-label]="labelFor(item.kind)"
                    >
                      {{ badgeFor(item.kind) }}
                    </span>
                    <div class="flex min-w-0 flex-1 flex-col gap-0.5">
                      <p
                        class="truncate text-sm font-medium text-slate-900 sm:text-base"
                      >
                        {{ item.title }}
                      </p>
                      <p class="truncate text-xs text-slate-500 sm:text-sm">
                        {{ item.subtitle }}
                      </p>
                    </div>
                    @if (openingId() === item.id) {
                      <span
                        class="shrink-0 text-xs font-medium text-primary-700"
                        role="status"
                      >
                        Opening…
                      </span>
                    } @else {
                      <time
                        class="shrink-0 text-xs text-slate-400 sm:text-sm"
                        [attr.datetime]="item.timestamp"
                        [title]="absoluteTime(item.timestamp)"
                      >
                        {{ relativeTime(item.timestamp) }}
                      </time>
                    }
                  </button>
                } @else {
                  <article
                    class="flex w-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm sm:p-5"
                    [attr.aria-label]="labelFor(item.kind)"
                  >
                    <div class="flex items-start gap-4">
                      <span
                        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white shadow-md"
                        [class]="accentFor(item.kind)"
                        aria-hidden="true"
                      >
                        {{ badgeFor(item.kind) }}
                      </span>
                      <div class="flex min-w-0 flex-1 flex-col gap-0.5">
                        <p
                          class="truncate text-sm font-medium text-slate-900 sm:text-base"
                        >
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
                    </div>

                    @if (item.contacts && hasAnyContact(item.contacts)) {
                      <dl
                        class="grid grid-cols-1 gap-x-6 gap-y-2 border-t border-slate-100 pt-3 text-xs sm:grid-cols-2 sm:text-sm lg:grid-cols-3"
                      >
                        @if (item.contacts.names.length > 0) {
                          <div class="flex items-baseline gap-2 min-w-0">
                            <dt
                              class="shrink-0 text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs"
                            >
                              Name
                            </dt>
                            <dd
                              class="flex flex-wrap gap-1 text-slate-800 min-w-0"
                            >
                              @for (v of item.contacts.names; track v) {
                                <span
                                  class="rounded-md bg-slate-100 px-1.5 py-0.5"
                                >
                                  {{ v }}
                                </span>
                              }
                            </dd>
                          </div>
                        }
                        @if (item.contacts.companies.length > 0) {
                          <div class="flex items-baseline gap-2 min-w-0">
                            <dt
                              class="shrink-0 text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs"
                            >
                              Company
                            </dt>
                            <dd
                              class="flex flex-wrap gap-1 text-slate-800 min-w-0"
                            >
                              @for (v of item.contacts.companies; track v) {
                                <span
                                  class="rounded-md bg-slate-100 px-1.5 py-0.5"
                                >
                                  {{ v }}
                                </span>
                              }
                            </dd>
                          </div>
                        }
                        @if (item.contacts.titles.length > 0) {
                          <div class="flex items-baseline gap-2 min-w-0">
                            <dt
                              class="shrink-0 text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs"
                            >
                              Title
                            </dt>
                            <dd
                              class="flex flex-wrap gap-1 text-slate-800 min-w-0"
                            >
                              @for (v of item.contacts.titles; track v) {
                                <span
                                  class="rounded-md bg-slate-100 px-1.5 py-0.5"
                                >
                                  {{ v }}
                                </span>
                              }
                            </dd>
                          </div>
                        }
                        @if (item.contacts.phones.length > 0) {
                          <div class="flex items-baseline gap-2 min-w-0">
                            <dt
                              class="shrink-0 text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs"
                            >
                              Mobile
                            </dt>
                            <dd class="flex flex-wrap gap-x-2 gap-y-1 min-w-0">
                              @for (v of item.contacts.phones; track v) {
                                <a
                                  [href]="'tel:' + v"
                                  class="font-medium text-primary-700 hover:underline"
                                >
                                  {{ v }}
                                </a>
                              }
                            </dd>
                          </div>
                        }
                        @if (item.contacts.emails.length > 0) {
                          <div class="flex items-baseline gap-2 min-w-0">
                            <dt
                              class="shrink-0 text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs"
                            >
                              Email
                            </dt>
                            <dd class="flex flex-wrap gap-x-2 gap-y-1 min-w-0">
                              @for (v of item.contacts.emails; track v) {
                                <a
                                  [href]="'mailto:' + v"
                                  class="truncate font-medium text-primary-700 hover:underline"
                                >
                                  {{ v }}
                                </a>
                              }
                            </dd>
                          </div>
                        }
                        @if (item.contacts.websites.length > 0) {
                          <div class="flex items-baseline gap-2 min-w-0">
                            <dt
                              class="shrink-0 text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs"
                            >
                              Website
                            </dt>
                            <dd class="flex flex-wrap gap-x-2 gap-y-1 min-w-0">
                              @for (v of item.contacts.websites; track v) {
                                <a
                                  [href]="ensureHttp(v)"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  class="truncate font-medium text-primary-700 hover:underline"
                                >
                                  {{ v }}
                                </a>
                              }
                            </dd>
                          </div>
                        }
                        @if (item.contacts.socials.length > 0) {
                          <div class="flex items-baseline gap-2 min-w-0">
                            <dt
                              class="shrink-0 text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs"
                            >
                              Social
                            </dt>
                            <dd class="flex flex-wrap gap-x-2 gap-y-1 min-w-0">
                              @for (v of item.contacts.socials; track v) {
                                <a
                                  [href]="ensureHttp(v)"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  class="font-medium text-primary-700 hover:underline"
                                >
                                  {{ socialLabel(v) }}
                                </a>
                              }
                            </dd>
                          </div>
                        }
                        @if (item.contacts.addresses.length > 0) {
                          <div
                            class="flex items-baseline gap-2 min-w-0 sm:col-span-2 lg:col-span-3"
                          >
                            <dt
                              class="shrink-0 text-[10px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs"
                            >
                              Address
                            </dt>
                            <dd
                              class="flex flex-wrap gap-x-3 gap-y-1 text-slate-700 min-w-0"
                            >
                              @for (v of item.contacts.addresses; track v) {
                                <span>{{ v }}</span>
                              }
                            </dd>
                          </div>
                        }
                      </dl>
                    }
                  </article>
                }
              </li>
            }
          </ul>
        }
      </div>
    </section>
  `,
})
export class RecentActivityComponent implements OnInit {
  private service = inject(RecentActivityService);
  private qrState = inject(QrStateService);
  private router = inject(Router);

  readonly tabs: readonly TabDef[] = [
    {
      key: 'created',
      label: 'Created Booths',
      kind: 'created_exhibitor_event',
      emptyTitle: 'No created booths yet',
      emptyHint: 'Create an exhibitor booth to see it listed here.',
    },
    {
      key: 'visited',
      label: 'Visited Booths',
      kind: 'visited_booth',
      emptyTitle: 'No visited booths yet',
      emptyHint: 'Scan a booth QR to add it to your visit history.',
    },
  ];

  activities = signal<ActivityItem[]>([]);
  createdEvents = signal<ExhibitorEventItem[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  activeTab = signal<TabKey>('created');
  openingId = signal<string | null>(null);
  openError = signal<string | null>(null);

  currentTab = computed<TabDef>(
    () => this.tabs.find((t) => t.key === this.activeTab()) ?? this.tabs[0]!,
  );

  visibleItems = computed<ActivityItem[]>(() =>
    this.activities().filter((a) => a.kind === this.currentTab().kind),
  );

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
    this.service.loadCreatedEvents().subscribe({
      next: (events) => this.createdEvents.set(events),
    });
  }

  setTab(key: TabKey): void {
    this.activeTab.set(key);
    this.openError.set(null);
  }

  onItemClick(item: ActivityItem): void {
    if (item.kind !== 'created_exhibitor_event' || !item.eventId) return;
    if (this.openingId()) return;

    const eventMeta = this.createdEvents().find((e) => e.id === item.eventId);
    if (!eventMeta) {
      this.openError.set('Event details unavailable. Please refresh.');
      return;
    }

    this.openError.set(null);
    this.openingId.set(item.id);
    this.service.loadEventDetail(eventMeta).subscribe({
      next: (data) => {
        this.qrState.set(data);
        this.openingId.set(null);
        void this.router.navigate(['/home/exhibitor/qr']);
      },
      error: (err: unknown) => {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to open booth. Please try again.';
        this.openError.set(message);
        this.openingId.set(null);
      },
    });
  }

  countFor(kind: ActivityKind): number {
    return this.activities().filter((a) => a.kind === kind).length;
  }

  isClickable(item: ActivityItem): boolean {
    return item.kind === 'created_exhibitor_event' && !!item.eventId;
  }

  badgeFor(kind: ActivityKind): string {
    return kind === 'visited_booth' ? 'V' : 'E';
  }

  labelFor(kind: ActivityKind): string {
    return kind === 'visited_booth' ? 'Visited booth' : 'Created exhibitor booth';
  }

  accentFor(kind: ActivityKind): string {
    return kind === 'visited_booth'
      ? 'bg-gradient-to-br from-emerald-500 to-emerald-700'
      : 'bg-gradient-to-br from-primary-500 to-primary-700';
  }

  hasAnyContact(contacts: VisitedBoothContacts): boolean {
    return (
      contacts.names.length > 0 ||
      contacts.companies.length > 0 ||
      contacts.titles.length > 0 ||
      contacts.phones.length > 0 ||
      contacts.emails.length > 0 ||
      contacts.websites.length > 0 ||
      contacts.socials.length > 0 ||
      contacts.addresses.length > 0
    );
  }

  ensureHttp(url: string): string {
    return /^https?:\/\//i.test(url) ? url : `https://${url}`;
  }

  socialLabel(url: string): string {
    try {
      const host = new URL(this.ensureHttp(url)).hostname.replace(
        /^www\./,
        '',
      );
      const base = host.split('.')[0] ?? host;
      return base.charAt(0).toUpperCase() + base.slice(1);
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
