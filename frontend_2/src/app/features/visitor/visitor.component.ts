import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-visitor',
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
          Visitor
        </h1>
        <p class="text-sm text-slate-600">
          Scan booths, save contacts, and view your visit history.
        </p>
      </header>

      <div
        class="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500"
      >
        Visitor workspace coming soon.
      </div>
    </section>
  `,
})
export class VisitorComponent {}
