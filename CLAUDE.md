# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Meet Sync** is a production-ready Node.js + TypeScript backend for event management with Google Sheets integration. It handles booth management at events with OCR scanning and voice note capabilities.

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
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` - OAuth2 credentials with scopes: `drive.file`, `spreadsheets`
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
2. **event** - Event CRUD with lazy Google Sheets creation (sheet created on first booth scan)
3. **booth** - Booth entry logging with lazy sheet initialization

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
Three client classes in `src/shared/google/`:
1. **oauth.client.ts** - Creates OAuth2Client from user's refresh token; used to verify ID token
2. **sheets.client.ts** - Append/read Google Sheets operations
3. **drive.client.ts** - File creation in user's Drive (available for future use)

### Sign-In Flow
1. User visits `/auth.html` → clicks "Sign in with Google"
2. Redirects to `/auth/google` → Google OAuth consent screen
3. User grants permissions (userinfo.profile, userinfo.email, drive.file, spreadsheets)
4. Google redirects to `/auth/google/callback?code=...`
5. Server exchanges code for tokens
6. ID token decoded with `verifyIdToken()` to extract user info
7. User created if new (email + name from ID token, random password hash)
8. Google refresh token saved to User.googleRefreshToken
9. JWT generated and returned to client

### Lazy Sheet Creation Pattern
Sheets are created on-demand when first needed (on first booth scan), not on event creation:
1. Event created → saved metadata, `sheetCreated: false`
2. First booth created → calls `EventService.ensureSheetCreated(eventId, userId)`
3. Check `event.sheetCreated` flag
4. If false: create sheet "{eventName} - Booth Log", add headers, set flag to true, save sheetId/sheetUrl
5. Append booth data to sheet
6. Subsequent booths skip creation check and append directly

This pattern reduces API calls and avoids empty Google Sheets.

### Key Pattern
Services call `createOAuthClient(user.googleRefreshToken)` → pass to `SheetsClient` → use `.spreadsheets.values.append()` etc.

- Refresh token stored in User.googleRefreshToken (select: false for security)
- Sheets titled "{eventName} - Booth Log" with predefined header row
- All Sheets operations happen in service layer; controllers never call APIs directly

### Error Cases
- No refresh token: 412 Precondition Failed ("Reconnect Google account")
- Token expired (invalid_grant): 502 Service Unavailable
- Other API errors: 502 Service Unavailable

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
sheetId (string, optional - set on first booth creation)
sheetUrl (string, optional - set on first booth creation)
sheetCreated (boolean, default: false - tracks if Google Sheet has been created)
boothCount (number, default 0, denormalized for fast listing)
timestamps
```

**Note**: Google Sheet is created lazily on first booth scan, not on event creation. This reduces unnecessary API calls and avoids empty sheets.

### Booth
```
ownerUserId (ref User, indexed)
eventId (ref Event, indexed)
boothName (optional)
scanCount (number, default 0)
hasVoiceNote (boolean, default false)
sheetRowNumber (number)
timestamps (no updatedAt needed)
```

**Note**: Booth stores no PII from scans; raw OCR and extracted fields go only to Google Sheet.

## Booth Sheet Schema
One row per booth visit. Columns:
1. Timestamp
2. Booth Name
3. Scan Count
4. Names (joined with "; ")
5. Phones (joined)
6. Emails (joined)
7. Companies (joined)
8. Raw OCR JSON (stringified array)
9. Voice Transcript
10. Image URLs (joined)

## API Endpoints

### Auth
- `GET /auth/google` - Initiate Google OAuth2 flow (redirects to Google consent screen)
- `GET /auth/google/callback` - OAuth2 callback handler (creates user if new, returns JWT)
- `POST /auth/logout` - Logout user (requires auth)

Public UI: `GET /auth.html` - OAuth sign-in page + JWT display

### Events
- `GET /api/v1/events` - List user's events (requires JWT)
- `POST /api/v1/events` - Create event metadata (requires JWT, does NOT create sheet yet)
- `GET /api/v1/events/:id` - Get single event (requires JWT)
- Nested: `/api/v1/events/:eventId/booths` (see below)

### Booths
- `POST /api/v1/events/:eventId/booths` - Create booth entry (requires JWT, triggers sheet creation if first booth)

Routes mounted in `src/app.ts` at `/api/v1/events`.

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

## Common Patterns

### Adding a New Feature
1. Create `src/features/{name}/` directory
2. Implement in order: model → schema → repository → service → controller → routes
3. Mount routes in `src/app.ts` or nest under existing feature
4. Add Swagger annotations to route definitions
5. Use existing patterns: service calls google APIs, handles auth checks, throws ApiError

### Handling Google API Errors
```typescript
try {
  // Google API call
} catch (error) {
  if (error instanceof Error && error.message.includes('invalid_grant')) {
    throw new ApiError(502, 'Google Sheets unavailable', { code: 'GOOGLE_AUTH_EXPIRED' });
  }
  throw new ApiError(502, 'Google Sheets unavailable', { code: 'GOOGLE_API_ERROR' });
}
```

### Lazy Resource Initialization
For expensive operations (Google Sheets creation), defer until first use:
```typescript
// In EventService
async ensureSheetCreated(eventId: string, userId: string) {
  const event = await this.getEvent(eventId, userId);
  if (event.sheetCreated) return event;
  
  // Create sheet only once
  const { sheetId, sheetUrl } = await sheetsClient.createSheet(...);
  return this.repository.updateEvent(eventId, { sheetId, sheetUrl, sheetCreated: true });
}

// In BoothService
const eventWithSheet = await this.eventService.ensureSheetCreated(eventId, userId);
// Now safe to use eventWithSheet.sheetId
```

### Ownership Checks
Always verify user can access resource before operating:
```typescript
const resource = await repo.findById(id);
if (!resource) throw ApiError.notFound('...');
if (resource.ownerUserId.toString() !== userId) throw ApiError.forbidden('...');
```

## Deployment Notes

- Build with `npm run build` (outputs to dist/)
- Start with `npm start` or `node dist/server.js`
- Ensure all env vars set in production
- MongoDB connection must be secure (TLS)
- JWT_SECRET must be strong random string (min 32 chars)
- Google OAuth credentials scoped to needed APIs (drive.file, spreadsheets)

## Known Issues & Workarounds

- Google API types have version conflicts in dependencies (googleapis vs google-auth-library). Workaround: use `auth as any` when passing OAuth2Client to google.sheets/drive methods.
