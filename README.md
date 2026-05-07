# Meet Sync

Production-ready Node.js + TypeScript backend.

## Prerequisites

- Node 20+
- MongoDB 5.0+
- npm or yarn

## Setup

```bash
npm install
```

Copy `.env.example` to `.env` and fill in required values:

- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for signing JWT tokens (use strong random string in production)
- `JWT_EXPIRES_IN`: Token expiration (default: 7d)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`: OAuth2 credentials
- `ANTHROPIC_API_KEY`: Anthropic API key
- `LOG_LEVEL`: Logging level (debug, info, warn, error)

## Running

Development:
```bash
npm run dev
```

Production:
```bash
npm run build
npm start
```

## Scripts

- `npm run dev` - Start dev server with auto-reload
- `npm run build` - Compile TypeScript
- `npm start` - Run production server
- `npm run lint` - Run ESLint
- `npm run format` - Format with Prettier
- `npm run typecheck` - Run TypeScript type checker

## API Documentation

Swagger docs available at `http://localhost:3000/docs`

## Health Check

`GET /health` - Returns service status and uptime
