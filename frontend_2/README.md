# Meet Sync Frontend

A production-ready Angular 20 application for event management with exhibitor and visitor workflows.

## 📋 Requirements

- Node.js 18+ (latest LTS)
- npm 9+
- Angular 20+

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm start
```

Navigate to `http://localhost:4200/` in your browser. The application will auto-reload if you change any of the source files.

### 3. Build for Production

```bash
npm run build:prod
```

The build artifacts will be stored in the `dist/` directory.

## 📁 Project Structure

```
src/
├── app/
│   ├── core/                          # Core functionality (singleton services, guards)
│   │   ├── interceptors/              # HTTP interceptors (auth, error, loading)
│   │   ├── services/                  # Core services (auth, api, event, visitor, activity)
│   │   ├── guards/                    # Route guards (auth)
│   │   ├── models/                    # TypeScript interfaces & types
│   │   └── constants/                 # Application constants
│   │
│   ├── shared/                        # Shared components & utilities
│   │   ├── components/                # Reusable components
│   │   │   ├── loader/
│   │   │   ├── empty-state/
│   │   │   ├── confirmation-dialog/
│   │   │   └── page-header/
│   │   ├── directives/                # Custom directives
│   │   ├── pipes/                     # Custom pipes
│   │   ├── interfaces/                # Shared interfaces
│   │   └── utils/                     # Utility functions
│   │
│   ├── features/                      # Feature modules
│   │   ├── auth/
│   │   │   └── signin/
│   │   └── home/
│   │       ├── homepage/
│   │       ├── exhibitor/
│   │       │   ├── create-event/
│   │       │   └── event-list/
│   │       └── visitor/
│   │           ├── show-visited/
│   │           └── mark-visit/
│   │
│   ├── layouts/                       # Layout components
│   │   ├── auth-layout/
│   │   └── main-layout/
│   │
│   ├── app.routes.ts                  # Application routes
│   └── app.component.ts               # Root component
│
├── environments/                      # Environment configurations
├── styles.scss                        # Global styles
├── main.ts                            # Application entry point
└── index.html                         # HTML template
```

## 🔐 Authentication

The application uses JWT-based authentication with Google OAuth2 integration:

- **Sign-in Page**: `/auth/signin`
- **Protected Routes**: All routes except auth require authentication via `authGuard`
- **Auth Service**: Manages login, logout, token storage, and user state
- **Interceptors**: Automatically attach JWT to requests and handle auth errors

### Token Management

- Tokens are stored in localStorage under the key `auth_token`
- User info is stored under `current_user`
- Tokens are automatically included in all API requests via the auth interceptor

## 🛠️ Services

### Core Services

1. **AuthService** - Authentication & authorization
2. **ApiService** - HTTP client wrapper with base configuration
3. **EventService** - Event CRUD operations
4. **VisitorService** - Visitor management
5. **ActivityService** - Activity tracking & stats
6. **NotificationService** - Toast/snackbar notifications
7. **LoadingService** - Global loading state management

## 🎨 UI Components

### Shared Components

- **LoaderComponent** - Spinner with optional message
- **EmptyStateComponent** - Placeholder for empty data
- **ConfirmationDialogComponent** - Confirmation modal
- **PageHeaderComponent** - Page title & action buttons

### Material Integration

- Toolbar
- Sidenav
- Cards
- Tables
- Forms
- Dialogs
- Pagination
- Snackbars
- Icons

### Tailwind CSS

- Responsive utilities
- Custom color palette
- Mobile-first approach
- Common utility classes (flex-center, text-primary, btn-primary, etc.)

## 📡 HTTP Interceptors

### 1. Auth Interceptor
- Automatically adds JWT bearer token to requests
- Skips auth routes

### 2. Error Interceptor
- Handles HTTP errors (401, 403, 404, 500)
- Shows user-friendly error notifications
- Auto-logout on 401 (unauthorized)

### 3. Loading Interceptor
- Manages global loading state
- Shows/hides loader on requests
- Counts concurrent requests to prevent flickering

## 🔄 State Management

The application uses **Angular Signals** for local state management:

```typescript
// Service state
currentUser = signal<User | null>(null);
isAuthenticated = signal(false);
isLoading = signal(false);

// Component usage
constructor(public authService: AuthService) {}

// In template
{{ (authService.currentUser)()?.email }}
[disabled]="(authService.isLoading)()"
```

## 🎯 Routing

### Route Structure

```
/ → redirect to /home
├── /auth
│   └── /signin
└── / (protected by authGuard)
    ├── /home (dashboard)
    ├── /exhibitor
    │   ├── / (event list)
    │   ├── /create-event
    │   └── /events/:id
    └── /visitor
        ├── / (scanned booths)
        └── /mark-visit
```

### Lazy Loading

All feature routes are lazy-loaded for better performance:

```typescript
loadComponent: () =>
  import('./features/auth/signin/signin.component').then((m) => m.SignInComponent)
```

## 📱 Responsive Design

- Mobile-first approach with Tailwind CSS
- Flexbox and grid layouts
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Sidenav transforms to drawer on mobile

## 🧪 Testing

### Run Tests

```bash
npm test
```

### Type Checking

```bash
npm run type-check
```

## 🔗 API Configuration

### Environment Variables

Update `src/environments/environment.ts` for development:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
};
```

Update `src/environments/environment.prod.ts` for production:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.meetsync.com',
};
```

## 📦 Build & Deployment

### Development Build

```bash
npm run build
```

### Production Build

```bash
npm run build:prod
```

### Bundle Analysis

The production build includes a budget warning for bundle size:
- Initial bundle: max 500KB (warning) / 1MB (error)
- Component styles: max 2KB (warning) / 4KB (error)

## 📝 Code Quality

### Format Code

```bash
npm run format
```

### Lint Code

```bash
npm run lint
```

### TypeScript Strict Mode

The project uses strict TypeScript settings:
- `strict: true`
- `noImplicitAny: true`
- `noUncheckedIndexedAccess: true`
- `noImplicitReturns: true`

## 🎓 Best Practices

### Component Structure

```typescript
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [CommonModule, MatButtonModule], // Standalone imports
  template: `...`,
  styles: [`...`],
})
export class ExampleComponent {}
```

### Service Pattern

```typescript
@Injectable({ providedIn: 'root' })
export class ExampleService {
  data = signal<Data[]>([]);
  isLoading = signal(false);

  constructor(private apiService: ApiService) {}

  getData(): Observable<Data[]> {
    this.isLoading.set(true);
    return this.apiService.get<Data[]>('/endpoint').pipe(
      tap((response) => {
        if (response.data) {
          this.data.set(response.data);
        }
        this.isLoading.set(false);
      })
    );
  }
}
```

### Error Handling

```typescript
dataService.getData().subscribe({
  next: (data) => { /* handle success */ },
  error: (error) => {
    console.error('Error:', error);
    notificationService.error('Failed to fetch data');
  },
});
```

## 🔒 Security

- JWT tokens stored in localStorage
- CORS enabled with backend
- XSS protection via Angular sanitization
- CSRF protection via backend
- Route guards prevent unauthorized access
- Sensitive data not logged

## 📚 Resources

- [Angular Documentation](https://angular.io)
- [Angular Material](https://material.angular.io)
- [Tailwind CSS](https://tailwindcss.com)
- [RxJS](https://rxjs.dev)
- [TypeScript](https://www.typescriptlang.org)

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'Add amazing feature'`)
3. Push to branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
