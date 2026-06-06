# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Scope

This is `frontend_2/` — the Angular 20 frontend for Meet Sync. It is an in-progress migration replacing the older Vite/React `frontend/` directory at the repo root. The backend (Node/Express/MongoDB) is documented in the parent `../CLAUDE.md` and serves the API this app calls; do not edit backend code from this directory.

## Stack

- **Angular 20** with **standalone components** (no NgModules). Bootstrapped from `src/main.ts` via `bootstrapApplication`.
- **State**: Angular Signals (`signal`, `computed`). No NgRx, no global store.
- **Styling**: Tailwind CSS (config: `tailwind.config.js`) + SCSS. Tailwind has `important: true` — its utilities win over component styles.
- **Forms**: Reactive Forms (`ReactiveFormsModule`).
- **HTTP**: `HttpClient` from `@angular/common/http`, provided in `main.ts` via `provideHttpClient()`. No interceptors currently wired — auth headers are attached manually in each service via `AuthService.getToken()`.
- **Client-side OCR**: `tesseract.js` + `pdfjs-dist` (worker copied to `/assets/pdf.worker.min.mjs` by `angular.json` asset rule).
- **QR generation**: `qrcode` package.

Note: README.md and QUICK_START.md describe a planned structure (interceptors, `core/models/`, `layouts/`, `shared/components/`) that has **not been built yet**. Treat them as aspirational, not authoritative. The real shape is in `src/app/`.

## Commands

```bash
npm install                # plain install works (no --legacy-peer-deps needed here)
npm start                  # ng serve on http://localhost:4200
npm run build              # ng build (defaults to production config)
npm run build:prod         # explicit production build → dist/meet-sync-frontend
npm run watch              # dev build with --watch
npm run lint               # angular-eslint
npm run format             # prettier on src/**/*.{ts,html,scss,json}
npm run type-check         # tsc --noEmit
npm test                   # ng test (Karma + Jasmine)
```

No tests exist yet; `npm test` will start Karma against an empty spec set.

## Path aliases

Defined in `tsconfig.json` — use these, do **not** write deep relative imports:

```
@core/*      → src/app/core/*
@shared/*    → src/app/shared/*       (directory does not exist yet)
@features/*  → src/app/features/*
@layouts/*   → src/app/layouts/*      (directory does not exist yet)
@env/*       → src/environments/*
```

## Routing

`src/app/app.routes.ts` is the single source of truth. All feature routes are lazy-loaded via `loadComponent`.

```
/signin                       → SignInComponent (public)
/home                         → HomeComponent shell (authGuard) with children:
  ''                          → HomeOverviewComponent
  exhibitor                   → ExhibitorComponent       (create event + booth + docs)
  exhibitor/qr                → QrComponent              (post-create QR + summary)
  visitor                     → VisitorComponent         (placeholder)
  recent-activity             → RecentActivityComponent
'' and **                     → redirect to /home
```

`authGuard` (`src/app/core/guards/auth.guard.ts`) checks `AuthService.isAuthenticated()` (signal-backed) and redirects to `/signin?returnUrl=...` when missing.

## Auth flow

`AuthService` (`src/app/core/services/auth.service.ts`) is the only auth surface.

1. Sign-in button calls `loginWithGoogle()`, which redirects to `<apiBase>/auth/google?origin=...` where `apiBase` is `environment.apiUrl` with a trailing `/api/v1` stripped. The backend handles Google consent and redirects back to `/signin` on this app with `?jwt=&email=&name=&returnUrl=` query params.
2. `SignInComponent.ngOnInit` reads those params and calls `handleOAuthCallback`, which writes `auth_token` and `auth_user` to `localStorage` and navigates to `returnUrl || /home`.
3. Services call `AuthService.getToken()` and attach `Authorization: Bearer <token>` headers themselves. There is no auth interceptor yet — if you add new HTTP services, follow the existing pattern in `ExhibitorService.authHeaders()` / `RecentActivityService.authHeaders()`.

## Backend API base URL

`src/environments/environment.ts` → `apiUrl: 'http://localhost:3000/api/v1'` (dev)
`src/environments/environment.prod.ts` → `apiUrl: 'https://api.meetsync.com'` (note: prod base has **no `/api/v1` suffix** — verify before deploying; one of the two configs is likely wrong)

Backend endpoint conventions are in the parent `../CLAUDE.md`. Critical rule from there: use `/exhibitor/*` for exhibitor flows and `/events/:id/booths` only for visitor-scan reads. Don't cross the streams.

## Exhibitor flow architecture

This is the only fully-built feature and the reference for how to add new features.

1. **`ExhibitorComponent`** (`src/app/features/exhibitor/`) collects event/booth metadata via a reactive form and accepts up to 20 MB of JPG/PNG/PDF uploads.
2. **`OcrService`** runs **client-side OCR** on each file before submit:
   - Images go straight to a Tesseract.js worker.
   - PDFs are rendered page-by-page on a canvas via `pdfjs-dist` (capped at `MAX_PDF_PAGES = 4`), then each page is OCR'd.
   - The worker and pdfjs module are lazy-initialized once and reused (`workerPromise`, `pdfjsPromise`).
   - Progress is reported through a `ProgressCallback` so the component can display per-file status.
   - Files are processed sequentially through a `Promise` chain (`extractionQueue`) so only one OCR runs at a time.
3. On submit, `ExhibitorService.createEventWithBoothAndDocuments` POSTs the extracted text + metadata to `POST {apiUrl}/exhibitor/events/create`. The server uploads the actual files to Drive and persists the structured fields.
4. **`QrStateService`** (in-memory signal) hands the response (event, booth, documents) to `QrComponent` via `router.navigate(['/home/exhibitor/qr'])`. **There is no route param or query string** — if the user reloads `/home/exhibitor/qr`, the state is gone. Keep this in mind when wiring deep links.
5. `QrComponent` uses `QrService` (a thin wrapper over the `qrcode` package) to render the booth's `qrUrl` as a data URL.

## API response shape

Every backend response is wrapped:

```ts
interface ApiResponseBody<T> {
  success: boolean;
  data?: T;
  message: string;
}
```

Services unwrap it via `.pipe(map(res => { if (!res.success || !res.data) throw …; return res.data; }))`. Mongo documents may come back with either `id` or `_id` — normalize to `id` in the service (see `RecentActivityService.normalizeEvent/Booth/Document`).

## Conventions

- **Standalone components only.** Every component declares its own `imports: []`. No shared NgModules.
- **Use `inject()`** for new services rather than constructor injection where possible; the existing code mixes both styles, prefer `inject()` for consistency with the newer files (`ExhibitorComponent`, `ExhibitorService`).
- **Selectors**: components use `app-` prefix, kebab-case (e.g. `app-exhibitor`); directives use `app` prefix, camelCase. Enforced by `.eslintrc.json`.
- **TypeScript is strict** (`strict`, `noImplicitAny`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `strictTemplates`). `noPropertyAccessFromIndexSignature` means `obj['key']` for index access, not `obj.key`.
- **Tailwind primary palette** is sky-blue (50–900) defined in `tailwind.config.js`. Use `primary-*` classes for brand color, not raw hex.

## Adding a new feature

1. Create `src/app/features/<name>/` and add at minimum `<name>.component.ts` (standalone, `templateUrl` or inline template).
2. Add a lazy `loadComponent` entry to `src/app/app.routes.ts` under `/home`'s `children` if it lives inside the app shell, or at the top level if it has its own layout.
3. If the feature talks to the backend: create `<name>.service.ts` next to the component, inject `HttpClient` + `AuthService`, call `${environment.apiUrl}/...`, and unwrap `ApiResponseBody<T>` as shown above. Attach the Bearer token manually until an auth interceptor exists.
4. Cross-feature state hand-off: prefer an `@Injectable({ providedIn: 'root' })` signal-backed state service (pattern: `QrStateService`) over route params for transient post-submit data. For data the user could deep-link to, use route params and fetch in `ngOnInit`.

## Known gaps to watch

- **No HTTP interceptors.** Every service attaches auth headers manually. If you add many services, consider adding `withInterceptors([...])` to `main.ts` instead of duplicating `authHeaders()`.
- **No global error UI.** Errors are caught per-service-call and surfaced via component signals; there is no toast/snackbar service. Match the existing pattern (`submitError` signal in component) for new features.
- **`/home/exhibitor/qr` is not reload-safe** (see exhibitor flow above). The Recent Activity page reconstructs this view from the API (`loadEventDetail`) — mirror that approach if you need a stable URL.
- **Production `apiUrl` may be missing `/api/v1`** — verify against the deployed backend before relying on `environment.prod.ts`.
- **`shared/` and `layouts/` directories do not exist** despite being referenced in README and `tsconfig` paths. Create them when you actually need shared components; don't trust the README's structure diagram.
