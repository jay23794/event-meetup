import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-[100dvh] bg-gradient-to-br from-primary-50 via-slate-50 to-white">
      <header
        class="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur"
      >
        <div
          class="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6"
        >
          <a
            routerLink="/home"
            class="flex items-center gap-2.5 text-slate-900 hover:opacity-90"
          >
            <span
              class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-sm font-bold text-white shadow-md shadow-primary-600/25"
              aria-hidden="true"
            >
              MS
            </span>
            <span class="text-base font-semibold tracking-tight sm:text-lg">
              Meet Sync
            </span>
          </a>

          <div class="flex items-center gap-3">
            @if (authService.user(); as u) {
              <span class="hidden text-sm text-slate-600 sm:inline">
                {{ u.name }}
              </span>
            }
            <button
              type="button"
              (click)="onLogout()"
              class="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Logout
            </button>
          </div>
        </div>

       
      </header>

      <main class="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
})
export class HomeComponent {
  constructor(public authService: AuthService) {}

  onLogout(): void {
    this.authService.logout();
  }
}
