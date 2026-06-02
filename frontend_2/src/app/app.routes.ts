import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'signin',
    loadComponent: () =>
      import('./features/auth/signin/signin.component').then((m) => m.SignInComponent),
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/home/home-overview.component').then(
            (m) => m.HomeOverviewComponent,
          ),
      },
      {
        path: 'exhibitor',
        loadComponent: () =>
          import('./features/exhibitor/exhibitor.component').then(
            (m) => m.ExhibitorComponent,
          ),
      },
      {
        path: 'exhibitor/qr',
        loadComponent: () =>
          import('./features/qr/qr.component').then((m) => m.QrComponent),
      },
      {
        path: 'visitor',
        loadComponent: () =>
          import('./features/visitor/visitor.component').then(
            (m) => m.VisitorComponent,
          ),
      },
      {
        path: 'recent-activity',
        loadComponent: () =>
          import('./features/recent-activity/recent-activity.component').then(
            (m) => m.RecentActivityComponent,
          ),
      },
    ],
  },
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '/home',
  },
];
