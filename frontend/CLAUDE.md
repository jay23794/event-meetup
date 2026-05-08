# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Meet Sync Frontend** is a React TypeScript web application for booth management and OCR-based contact scanning at events.

- **Language**: TypeScript (strict mode)
- **Framework**: React 18 + Vite
- **Build Tool**: Vite (dev server on port 5173, opens automatically)
- **UI Library**: Chakra UI
- **State Management**: Zustand (auth), React Query (server state)
- **Forms**: React Hook Form + Zod
- **Routing**: React Router DOM
- **HTTP Client**: Axios (with JWT auth interceptor)

## Development Workflow

### Setup
```bash
npm install
cp .env.example .env  # Set VITE_API_URL (default: http://localhost:3000/api/v1)
npm run dev          # Start Vite dev server (opens http://localhost:5173)
```

### Key Commands
- `npm run dev` - Start dev server with hot module reload
- `npm run build` - TypeScript compile + Vite build (outputs to dist/)
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint on TypeScript/TSX files
- `npm run typecheck` - Run TypeScript type checker (--noEmit)

## Architecture

### Feature-Based Structure
```
src/
  app/
    App.tsx          - Root component + route setup
    providers.tsx    - BrowserRouter, Chakra, QueryClient wrappers
    routes.tsx       - Route definitions
    theme.ts         - Chakra theme customization
  features/
    {feature}/
      api/           - API calls (axios wrapped)
      hooks/         - Custom React hooks (useQuery wrappers, feature logic)
      pages/         - Page-level components (routed)
      components/    - Feature-scoped components
      types.ts       - Feature-specific TypeScript interfaces
  shared/
    api/             - Axios instance, QueryClient setup
    components/      - Reusable UI components (Header, Layout, etc.)
    hooks/           - Shared hooks (useToast, etc.)
    types/           - Global types (ApiResponse, User, etc.)
    utils/           - Utility functions
```

### Current Features
1. **auth** - Google OAuth2 sign-in, JWT token/user storage, logout
2. **events** - Event CRUD (list, create, detail)
3. **booths** - Booth entry creation, booth data display
4. **scan** - OCR image scan review, contact extraction, voice notes

### Data Flow
```
Component → Custom Hook (useQuery/useState) → API Function → 
  Axios (adds JWT) → Backend → Zod validation (if forms) → State update → Re-render
```

## Key Patterns

### Authentication Flow
- User signs in via `/signin` → redirected to Google OAuth consent screen
- Callback handler receives code, exchanges for tokens
- JWT token and user data stored in Zustand `authStore` (persists to localStorage)
- Axios request interceptor adds JWT to all API calls: `Authorization: Bearer {token}`
- Response interceptor catches 401 → clears auth, redirects to `/signin`
- Protected routes wrapped in `<ProtectedRoute>` component

### Server State Management (React Query)
- Data fetching via `useQuery` hooks (example: `useEvents()`)
- Query keys: `['events']`, `['booths', eventId]`, etc.
- Stale time: 5 minutes (data refetches if older)
- Mutations use `useMutation` for POST/PATCH/DELETE

```typescript
function useEvents() {
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['events'],
    queryFn: eventsApi.listEvents,
    staleTime: 5 * 60 * 1000,
  })
  return { events: data, isLoading, error }
}
```

### Client State Management (Zustand)
- Auth state only: token, user, setToken, setUser, logout
- Persisted to localStorage (keys: `meet_sync_token`, `meet_sync_user`)
- Accessed directly via `authStore.getState()` in interceptors or components

```typescript
const token = authStore.getState().token
authStore.getState().setToken(newToken)
```

### Form Handling
- React Hook Form for state management
- Zod for schema validation + TypeScript inference
- Example: contact form validation in scan feature

```typescript
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(mySchema),
})
```

### API Calls
- Files in `features/{feature}/api/` wrap axios calls
- Normalize backend responses: map `_id` to `id` if needed (MongoDB ID normalization)
- TypeScript types for request/response shapes

```typescript
export const eventsApi = {
  listEvents: async (): Promise<Event[]> => {
    const response = await axios.get<ApiResponse<{ events: EventResponse[] }>>(
      '/events'
    )
    return response.data.data.events.map(mapEventResponse)
  },
}
```

### Error Handling
- API errors caught by Axios response interceptor
- 401: logout + redirect to signin
- 412: missing Google refresh token (user must reconnect)
- Other errors: surface to user via toast notifications or error component
- Zod validation errors displayed inline in forms

### Components & Reusability
- Chakra UI for all UI components
- Shared components in `src/shared/components/`: Layout, Header, ProtectedRoute, ErrorMessage, LoadingSpinner, EmptyState, PageContainer
- Feature-scoped components stay in feature directory
- Props typed with TypeScript interfaces

## Environment Variables

- `VITE_API_URL` - Backend API base URL (default: `http://localhost:3000/api/v1`)
- Accessed via `import.meta.env.VITE_API_URL`

## TypeScript Configuration

- `strict: true`, `noImplicitAny: true`, `noUncheckedIndexedAccess: true`
- Target: ES2020, modules: ESNext
- JSX: react-jsx (automatic runtime, no import React needed)
- Type checking before build: `npm run typecheck`

## Vite Configuration

- Dev server: http://localhost:5173 (opens automatically)
- HMR enabled (hot module reload)
- Production build: minified, sourcemaps disabled
- Plugin: @vitejs/plugin-react (JSX + refresh)

## Common Tasks

### Adding a New Feature
1. Create `src/features/{name}/` directory structure (api, hooks, pages, components, types.ts)
2. Define types in `types.ts`
3. Create API functions in `api/{name}.api.ts`
4. Create custom hooks in `hooks/use{Feature}.ts` (wrapping useQuery/useMutation)
5. Build page components in `pages/` (routed)
6. Add routes to `src/app/routes.tsx`
7. Integrate into app layout if needed

### Adding a New API Call
1. Define request/response types in feature `types.ts`
2. Create API function in `api/{feature}.api.ts` (map MongoDB _id to id)
3. Create custom hook in `hooks/` wrapping `useQuery` or `useMutation`
4. Use hook in component, handle isLoading/error states

### Adding a New Form
1. Define Zod schema (in `types.ts` or component)
2. Use `useForm` with `zodResolver`
3. Register inputs, display validation errors
4. Call API mutation on submit
5. Show success/error toast via `useToast()` hook

### Type Safety
- Extract types from Zod schemas: `z.infer<typeof schema>`
- Response types should match backend API response shape
- API functions are typed generically: `async (): Promise<T>`

## Testing & Linting

- ESLint configured for TypeScript/React
- No unit tests currently
- Run `npm run typecheck` to catch type errors
- Run `npm run lint` to check code style

## Deployment

- Build: `npm run build` (outputs to dist/)
- Serve dist/ via static hosting (Vercel, Netlify, etc.)
- Set `VITE_API_URL` in production environment
- Ensure backend is accessible from frontend domain (CORS configured on backend)

## Known Patterns & Conventions

### MongoDB ID Handling
- Backend sends `_id` (MongoDB ObjectId)
- Frontend maps to `id` in API response handlers
- Type safety: use `EventResponse` for raw API type, `Event` for normalized frontend type

### Token Expiry
- 401 response from API → interceptor logs out user and redirects to signin
- Frontend doesn't refresh tokens (backend should handle long-lived JWTs)

### Loading States
- Use `isLoading` from useQuery/useMutation
- Show `<LoadingSpinner>` or disable buttons while loading
- Avoid showing outdated data during refetch (React Query handles cache management)

### Toast Notifications
- Chakra's `useToast()` hook for user feedback
- Use for success/error messages after API calls
- Dismiss automatically after 5 seconds (Chakra default)
