# Deployment Guide

This guide covers running Meet Sync with environment-specific config and deploying to [Render](https://render.com).

---

## 1. Environment files

The server picks the env file based on `NODE_ENV`:

| `NODE_ENV`     | File loaded         |
| -------------- | ------------------- |
| `production`   | `.env.production`   |
| anything else  | `.env`              |

Loader: `src/config/load-env.ts` (runs before any module reads `process.env`). If the requested file is missing, it falls back to `.env`.

### Local files

| File                      | Purpose                              | Committed? |
| ------------------------- | ------------------------------------ | ---------- |
| `.env`                    | Local development                    | No         |
| `.env.production`         | Local production-mode testing        | No         |
| `.env.example`            | Template for development             | Yes        |
| `.env.production.example` | Template for production              | Yes        |

To create a local prod env:

```bash
cp .env.production.example .env.production
# fill in real values
```

### npm scripts

| Script           | Behavior                                                                       |
| ---------------- | ------------------------------------------------------------------------------ |
| `npm run dev`    | `tsx watch src/server.ts`, loads `.env`                                        |
| `npm run build`  | Compile TypeScript to `dist/` (type-check + emit)                              |
| `npm start`      | `tsx src/server.ts`, loads `.env`                                              |
| `npm run prod`   | `tsx src/server.ts` with `NODE_ENV=production`, loads `.env.production`        |

> The server runs through `tsx` (which handles ESM resolution at runtime). `tsc` is kept for type-checking and producing `dist/` artifacts. `tsx` is in `dependencies` so it's installed in production.

> `NODE_ENV=production tsx ...` uses POSIX shell syntax. On Windows, run via WSL or install `cross-env`.

---

## 2. Pre-deployment checklist

Before pushing to Render:

- [ ] **MongoDB Atlas** cluster created; connection string copied. In Network Access, allow `0.0.0.0/0` (Render IPs are dynamic).
- [ ] **Google Cloud Console** OAuth client has the production redirect URI added: `https://<your-app>.onrender.com/auth/google/callback`.
- [ ] **OAuth scopes** enabled on the consent screen: `userinfo.profile`, `userinfo.email`, `drive.file`, `spreadsheets`.
- [ ] **JWT_SECRET** generated as a strong random string (`openssl rand -base64 48`).
- [ ] `npm run build` succeeds locally.
- [ ] `npm run typecheck` and `npm run lint` pass.
- [ ] Repo pushed to GitHub.

---

## 3. Deploy to Render

### A. Create the Web Service

1. Sign in at <https://dashboard.render.com>.
2. **New + → Web Service**.
3. Connect the GitHub repo containing this project.
4. Fill in:
   - **Name**: `meet-sync` (or anything)
   - **Region**: closest to your users
   - **Branch**: `main` (or your deploy branch)
   - **Root Directory**: leave blank (project is at repo root)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run prod`
   - **Instance Type**: Starter (or higher)

### B. Set environment variables

In the **Environment** tab, add every variable from `.env.production.example` with real values:

| Key                    | Notes                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------- |
| `NODE_ENV`             | `production` (Render also sets this; explicit is fine)                             |
| `PORT`                 | Render injects `PORT` automatically — you can omit, the app reads `process.env.PORT` |
| `MONGODB_URI`          | Atlas SRV connection string                                                        |
| `JWT_SECRET`           | 32+ char random string                                                             |
| `JWT_EXPIRES_IN`       | e.g., `7d`                                                                         |
| `GOOGLE_CLIENT_ID`     | from Google Cloud Console                                                          |
| `GOOGLE_CLIENT_SECRET` | from Google Cloud Console                                                          |
| `GOOGLE_REDIRECT_URI`  | `https://<your-render-domain>/auth/google/callback`                                |
| `PUBLIC_APP_URL`       | `https://<your-render-domain>`                                                     |
| `ANTHROPIC_API_KEY`    | Anthropic console                                                                  |
| `LOG_LEVEL`            | `info` (or `warn` in prod)                                                         |

> Render's free tier sleeps after 15 min of inactivity. For an always-on backend, use a paid tier or add an external uptime ping.

### C. Set Node version

Render reads the Node version from one of:

- `engines.node` in `package.json`, **or**
- a `NODE_VERSION` env var.

Recommended: add to `package.json`:

```json
"engines": {
  "node": ">=20.0.0"
}
```

### D. Deploy

1. Click **Create Web Service**. Render runs the build, then starts the app.
2. Watch the **Logs** tab. On success you should see:
   ```
   Starting server  port: 3000  env: "production"
   Server running at http://localhost:3000
   ```
3. Open `https://<your-app>.onrender.com/docs` to verify Swagger loads.

### E. Post-deploy

- In Google Cloud Console, **add the production redirect URI** to the OAuth client (it must match `GOOGLE_REDIRECT_URI` exactly).
- Test the OAuth flow: `https://<your-app>.onrender.com/auth.html` → sign in → confirm JWT returned.
- Verify a booth-scan request creates the Google Sheet.

---

## 4. Frontend deployment (optional)

The `frontend/` directory is a separate Vite app. Deploy it as a **Static Site** on Render:

- **Build Command**: `npm install --legacy-peer-deps && npm run build`
- **Publish Directory**: `frontend/dist`
- Set the API base URL env var (e.g., `VITE_API_URL=https://<your-backend>.onrender.com`) before building.

Update CORS in the backend (`src/app.ts`) to allow the frontend domain.

---

## 5. Common issues

| Symptom                                          | Fix                                                                           |
| ------------------------------------------------ | ----------------------------------------------------------------------------- |
| `Environment validation failed` on boot          | A required env var is missing in Render's Environment tab.                    |
| `MongoServerSelectionError`                      | Atlas IP allowlist doesn't include `0.0.0.0/0`, or URI is wrong.              |
| Google OAuth `redirect_uri_mismatch`             | `GOOGLE_REDIRECT_URI` doesn't exactly match the URI registered in GCP.        |
| `invalid_grant` on Sheets calls                  | User's refresh token expired — they must sign in again.                       |
| First request after idle is slow (free tier)     | Render free instance cold-starts; upgrade tier or add a keepalive ping.       |
| Build fails on `sharp`                           | Ensure Render runtime is `Node` (not Docker custom); `sharp` ships prebuilds. |

---

## 6. Updating the deployment

Render auto-deploys on every push to the connected branch. To deploy a fix:

```bash
git push origin main
```

Manual redeploy: Render dashboard → service → **Manual Deploy → Deploy latest commit**.
