import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

interface HomeCard {
  title: string;
  description: string;
  link: string;
  badge: string;
  accent: string;
}

@Component({
  selector: 'app-home-overview',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="flex flex-col gap-8">
      <header class="flex flex-col gap-2">
        <h1 class="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Welcome{{ authService.user()?.name ? ', ' + authService.user()?.name : '' }}
        </h1>
        <p class="text-sm text-slate-600 sm:text-base">
          Choose a workspace to get started.
        </p>
      </header>

      <div class="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3">
        @for (card of cards; track card.link) {
          <a
            [routerLink]="card.link"
            class="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-lg sm:p-6"
          >
            <span
              class="inline-flex h-11 w-11 items-center justify-center rounded-xl text-lg font-semibold text-white shadow-md"
              [class]="card.accent"
              aria-hidden="true"
            >
              {{ card.badge }}
            </span>
            <h2 class="text-lg font-semibold text-slate-900">
              {{ card.title }}
            </h2>
            <p class="text-sm leading-relaxed text-slate-600">
              {{ card.description }}
            </p>
            <span
              class="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary-700 group-hover:gap-2 transition-all"
            >
              Open
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                class="h-4 w-4"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                  clip-rule="evenodd"
                />
              </svg>
            </span>
          </a>
        }
      </div>
    </section>
  `,
})
export class HomeOverviewComponent {
  readonly cards: HomeCard[] = [
    {
      title: 'Exhibitor',
      description:
        'Set up your booth, manage event listings, and capture visitor check-ins.',
      link: '/home/exhibitor',
      badge: 'E',
      accent: 'bg-gradient-to-br from-primary-500 to-primary-700',
    },
    {
      title: 'Visitor',
      description:
        'Scan booths, save contacts, and view documents shared with you.',
      link: '/home/visitor',
      badge: 'V',
      accent: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
    },
    {
      title: 'Recent Activity',
      description:
        'See your latest scans, check-ins, and updates across events.',
      link: '/home/recent-activity',
      badge: 'R',
      accent: 'bg-gradient-to-br from-amber-500 to-amber-700',
    },
  ];

  constructor(public authService: AuthService) {}
}
