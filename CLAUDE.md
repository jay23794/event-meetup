# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Meet Sync** is a production-ready Node.js + TypeScript backend for event management. It handles booth management at events with OCR scanning and voice note capabilities. All structured data is stored in MongoDB; Google Drive is used for file storage (booth images, exhibitor documents).

- **Language**: TypeScript (strict mode)
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose (Mongo 5.0+)
- **API Docs**: Swagger UI at `/docs`

## Development Workflow

### Setup
```bash
npm install
cp .env.example .env  # Fill in required environment variables
npm run dev           # Start dev server with auto-reload on port 3000
```

### Key Commands
- `npm run dev` - Start development server (port 3000)
- `npm run build` - Compile TypeScript to dist/
- `npm start` - Run production-built server
- `npm run lint` - Run ESLint on src/
- `npm run format` - Format with Prettier
- `npm run typecheck` - Run TypeScript type checker (--noEmit)

### Environment Variables
Defined in `src/config/env.ts` with Zod validation. All required; no defaults for sensitive values:
- `NODE_ENV`, `PORT`
- `MONGODB_URI` - Must be valid MongoDB connection string
- `JWT_SECRET` (min 32 chars), `JWT_EXPIRES_IN`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` - OAuth2 credentials with scope: `drive.file`
- `ANTHROPIC_API_KEY`
- `LOG_LEVEL` - debug/info/warn/error

## Architecture & Patterns

### Feature-Based Structure
```
src/features/{feature}/
  ├── {feature}.model.ts      - Mongoose schema & interface
  ├── {feature}.schema.ts     - Zod validation schemas
  ├── {feature}.repository.ts - Data access layer
  ├── {feature}.service.ts    - Business logic (calls repo & external APIs)
  ├── {feature}.controller.ts - HTTP handlers
  ├── {feature}.routes.ts     - Express route definitions
  └── {feature}.types.ts      - Feature-specific types
```

### Current Features
1. **auth** - Google OAuth2 sign-in (automatic user creation, JWT generation)
2. **event** - Visitor event CRUD with lazy Google Sheets creation (sheet created on first booth scan)
3. **booth** - Visitor booth entry logging
4. **exhibitorEvent** - Exhibitor-specific event management (separate from visitor events)
5. **exhibitorBooth** - Exhibitor booth data, linked to companies/networks
6. **exhibitorDocument** - Document/attachment storage for exhibitor booths
7. **scan** - OCR image scanning, contact extraction, voice note transcription
8. **visitor** - Visitor workflow routes
9. **drive** - Google Drive integration (file operations)

### Request Flow
`routes` → `controller` → `service` → `repository` → `database`

- **Controller**: Parse params/body, validate auth, call service, format response
- **Service**: Business logic, Google API calls, error handling, authorization checks
- **Repository**: Mongoose queries only

### Error Handling
- Custom `ApiError` class with status codes
- Error middleware at `src/shared/middleware/error.middleware.ts` catches all errors
- Async route handlers use `asyncHandler` utility to catch promises
- Google API errors: throw 412 (missing refresh token) or 502 (API unavailable)

### Authentication
- **OAuth-only flow**: Google OAuth2 sign-in at `/auth/google` → callback at `/auth/google/callback`
- User created automatically on first Google sign-in (email + name extracted from Google ID token)
- Google refresh token saved to User document on sign-in
- JWT generated via `generateToken(payload)` in `src/shared/utils/jwt.ts`
- JWT-based authorization via `authMiddleware` (Bearer token in Authorization header)
- Middleware decodes JWT and sets `req.user` (id, email, name, role)
- All protected routes require valid JWT
- Ownership checks in service methods verify user can access resource

### Validation
- Zod schemas define request body shape
- `validate(schema)` middleware parses and checks req.body
- Custom `.refine()` for cross-field validation (e.g., "scans OR voiceNote required")
- Phone numbers accepted as-is (E.164 or 10-digit Indian); no normalization

## Google Integration

### Architecture
Two client classes in `src/shared/google/`:
1. **oauth.client.ts** - Creates OAuth2Client from user's refresh token; used to verify ID token
2. **drive.client.ts** - File creation, permissioning, and sharing in user's Drive

Google Drive is the only Google API used by the app — for storing booth/document files and sharing public exhibitor documents with visitors at check-in time. All structured data (booths, scans, check-ins, extractions) lives in MongoDB.

### Sign-In Flow
1. User visits `/auth.html` → clicks "Sign in with Google"
2. Redirects to `/auth/google` → Google OAuth consent screen
3. User grants permissions (userinfo.profile, userinfo.email, drive.file)
4. Google redirects to `/auth/google/callback?code=...`
5. Server exchanges code for tokens
6. ID token decoded with `verifyIdToken()` to extract user info
7. User created if new (email + name from ID token, random password hash)
8. Google refresh token saved to User.googleRefreshToken
9. JWT generated and returned to client

### Lazy Drive Folder Creation
The user's MeetSync root folder is created on first sign-in. Per-event folders (event folder + booth-images folder) are created lazily by `EventService.createEvent` / `ensureEventFolders` — only when the user has a refresh token + root folder set. Drive setup is best-effort and does not block event creation.

### Key Pattern
Services call `createOAuthClient(user.googleRefreshToken)` → pass to `DriveClient` / `DriveService`. Refresh token stored in `User.googleRefreshToken` (select: false). All Drive operations happen in the service layer.

### Error Cases
- No refresh token: 412 Precondition Failed ("Reconnect Google account")
- Token expired (invalid_grant): 412 (auth expired) or 502 (downstream Drive call failed)
- Other Drive errors: 502 Service Unavailable

## Database Models

### User
```
email (unique, indexed)
name
password (bcrypt-hashed; auto-generated random string on OAuth sign-in)
role (admin | user, default: user)
googleRefreshToken (string, select: false for security)
timestamps
```

### Event
```
ownerUserId (ref User, indexed)
name
startDate, endDate (optional)
boothCount (number, default 0, denormalized for fast listing)
driveRootFolderId, driveEventFolderId, driveImagesFolderId (optional)
timestamps
```

### Booth (visitor scan log)
```
ownerUserId (ref User, indexed)
eventId (ref Event, indexed)
boothName (optional), description (optional)
qrId (unique, indexed), qrUrl
scans: [{ rawText, extractedFields: {name, company, title, phone, email, website, linkedin, socialMedia, address}, imageUrl?, driveFileId? }]
scanCount, hasVoiceNote
voiceTranscript, voiceDurationSec (optional)
names[], phones[], emails[], companies[], websites[], linkedinUrls[], socialMediaUrls[], imageUrls[] (denormalized flat arrays)
timestamps
```

All PII from scans lives in MongoDB on the Booth document — denormalized flat arrays power summary aggregates without per-row $unwind cost.

### ExhibitorBooth
```
ownerUserId (ref User, indexed), eventId (ref Event, indexed)
boothName, description
qrId (unique, indexed), qrUrl
documentCount, scanCount
timestamps
```

### VisitorCheckIn
```
exhibitorBoothId (ref ExhibitorBooth, indexed)
eventId (ref Event, indexed)
visitorUserId (ref User, optional — present when scanner was signed in)
name, email, phone (optional)
createdAt (no updatedAt)
```
Unique index on `(exhibitorBoothId, email)` — duplicate check-ins are detected via `E11000` on insert.

### VisitorScannedBooth
```
visitorUserId (ref User, indexed), exhibitorBoothId (ref ExhibitorBooth)
qrId, boothName, eventName, sharedDocUrls[]
createdAt
```
Unique index on `(visitorUserId, qrId)`. Powers the visitor's "My Scanned Booths" history. Inserts use `updateOne(..., { upsert: true })` to avoid duplicates.

## API Endpoints

All API routes are prefixed with `/api/v1`. Auth routes also available without prefix for backward compatibility.

### Auth
- `GET /auth/google` - Initiate Google OAuth2 flow (redirects to Google consent screen)
- `GET /auth/google/callback` - OAuth2 callback handler (creates user if new, returns JWT)
- `POST /auth/logout` - Logout user (requires auth)

### Visitor Events & Booths (legacy)
- `GET /events` - List user's visitor events (requires JWT)
- `POST /events` - Create visitor event metadata (requires JWT)
- `GET /events/:id` - Get visitor event (requires JWT)
- `POST /events/:eventId/booths` - Create visitor booth entry (requires JWT)
- `GET /events/:eventId/booths` - List booths in event, cursor-paginated by booth id (newest first)
- `GET /events/:eventId/booths/:boothId` - Get a single booth by Mongo `_id`
- `GET /events/:eventId/summary` - Aggregate counts (totals, uniques) computed via Mongo aggregate

### Exhibitor Routes (require JWT)
- `GET /exhibitor/events` - List user's exhibitor events
- `POST /exhibitor/events` - Create exhibitor event
- `GET /exhibitor/events/:id` - Get exhibitor event
- `POST /exhibitor/booths` - Create exhibitor booth
- `GET /exhibitor/booths/:id` - Get exhibitor booth details
- `POST /exhibitor/documents` - Upload document for exhibitor booth
- `GET /exhibitor/documents/:boothId` - List documents for booth

### Visitor Routes (require JWT)
- `POST /visitor/...` - Visitor-related endpoints (check route definitions)

### Public Exhibitor Routes (no auth required)
- `GET /public/exhibitor-booths/:code` - Access exhibitor booth via public code

### Scan Routes (require JWT)
- `POST /scan` - OCR image scan, extract contacts, store voice notes

### SPA Serving
Routes mounted in `src/app.ts`. Static files served from `public/` directory. Non-API requests fall back to SPA `index.html` for client-side routing.

## Middleware Stack

Defined in `src/shared/middleware/`:
- `auth.middleware.ts` - Extracts JWT, sets req.user
- `validate.middleware.ts` - Zod schema validation
- `error.middleware.ts` - Global error handler
- `rateLimit.middleware.ts` - Rate limiting (auth routes limited, global limit)

All applied in `src/app.ts`:
1. Helmet, CORS, compression
2. Global rate limiter
3. Request ID assignment (nanoid)
4. JSON parsing (10mb limit)
5. Swagger UI at /docs
6. Route handlers
7. 404 handler
8. Error middleware (must be last)

## TypeScript & Type Safety

- `strict: true`, `noImplicitAny: true`, `noUncheckedIndexedAccess: true`
- Strict mode enforced; no `any` except where explicitly needed for external library compatibility
- Zod schemas inferred to TypeScript types with `z.infer<typeof schema>`
- Express Request extended with custom `user` property in shared types

## Logging

Via Pino logger in `src/config/logger.ts`:
- Request logging: method, URL, requestId
- Error logging: error details with context
- Configure level via LOG_LEVEL env var

## Testing & Linting

- ESLint configured for TypeScript
- No unit tests currently; placeholder test script exists
- Format code with `npm run format` before commits
- TypeScript compiler runs in CI; ensure `npm run typecheck` passes

## Key Architectural Patterns

### Exhibitor vs Visitor Separation
Distinct workflows prevent feature confusion:
- **Visitor flow**: Attendees scan booths to collect contact info. Routes: `/api/v1/events`, `/api/v1/events/:id/booths`
- **Exhibitor flow**: Booth operators create events, manage contacts, upload documents. Routes: `/api/v1/exhibitor/events`, `/api/v1/exhibitor/booths`, `/api/v1/exhibitor/documents`
- **Public exhibitor access**: Limited unauthenticated access via `/public/exhibitor-booths/:code` for specific use cases

Keep these separate: never merge exhibitor/visitor endpoints, as it risks exposing data across workflows.

## Common Patterns

### Adding a New Feature
1. Create `src/features/{name}/` directory
2. Implement in order: model → schema → repository → service → controller → routes
3. Mount routes in `src/app.ts` or nest under existing feature
4. Add Swagger annotations to route definitions
5. Use existing patterns: service calls google APIs, handles auth checks, throws ApiError

### Handling Google Drive API Errors
```typescript
try {
  // Drive API call
} catch (error) {
  if (error instanceof Error && error.message.includes('invalid_grant')) {
    throw new ApiError(412, 'Reconnect Google account', { code: 'GOOGLE_AUTH_EXPIRED' });
  }
  throw new ApiError(502, 'Google Drive unavailable', { code: 'GOOGLE_API_ERROR' });
}
```

### Lazy Drive Folder Initialization
Per-event Drive folders are created on first use, not eagerly:
```typescript
// In EventService
async ensureEventFolders(eventId: string, userId: string) {
  const event = await this.getEvent(eventId, userId);
  if (event.driveEventFolderId && event.driveImagesFolderId) return event;
  // create folders, persist ids on the event...
}
```

### Ownership Checks
Always verify user can access resource before operating:
```typescript
const resource = await repo.findById(id);
if (!resource) throw ApiError.notFound('...');
if (resource.ownerUserId.toString() !== userId) throw ApiError.forbidden('...');
```

### Google API Client Pattern
Isolate Google API operations in `src/shared/google/` clients:
- **oauth.client.ts**: OAuth2Client creation and ID token verification
- **drive.client.ts**: File operations and permissioning in Google Drive

Services call `createOAuthClient(user.googleRefreshToken)` to get an authenticated client, pass to the Drive client, never expose refresh tokens or raw googleapis calls outside the service layer.

## Deployment

### Backend Build & Deployment
- Build with `npm run build` (TypeScript compiled to dist/)
- Start with `npm start` (or `npm run prod` for production mode)
- Ensure all env vars set in production (see .env.production.example)
- MongoDB connection must be secure (TLS)
- JWT_SECRET must be strong random string (min 32 chars)
- Google OAuth credentials scoped to needed APIs (drive.file, spreadsheets)
- Backend serves static frontend from `public/` directory

### Frontend Build & Deployment
**Two deployment modes via Vite:**

1. **Bundled with backend** (default):
   - Build: `npm run build` in frontend dir
   - Output: `../public/` (relative to frontend)
   - Frontend files served by Node backend at `/`
   - Backend starts with `npm start`, serves both API and frontend

2. **Static site deployment** (separate CDN/static host):
   - Build: `VITE_BUILD_TARGET=static npm run build` in frontend dir
   - Output: `dist/` directory
   - Deploy `dist/` contents to CDN or static host
   - Set `VITE_API_URL` to point to backend API

**Frontend npm install note:**
- Frontend has peer dependency conflicts (vite@8 vs plugin-react peer versions)
- Use `npm install --legacy-peer-deps` in frontend directory
- Render deploys: ensure `--legacy-peer-deps` is set in build commands

## Known Issues & Workarounds

- **Google API types conflict**: Version mismatch between googleapis and google-auth-library. Workaround: use `auth as any` when passing OAuth2Client to `google.drive(...)` methods.
- **Frontend npm install**: vite@8 has unmet peer dependencies with @vitejs/plugin-react. Workaround: use `npm install --legacy-peer-deps` in frontend directory.
- **Vite build output**: Frontend can be built for two targets—embedded with backend (default) or as static site. Use `VITE_BUILD_TARGET=static` env var to change output directory. This is important for Render and other static-site deployments.
