# Configuration & Setup Guide

Complete setup steps to get the application running with full event/booth functionality.

## Prerequisites
- Node.js 20+
- MongoDB 5.0+ (local or cloud instance)
- Google Cloud Project with OAuth2 credentials
- npm or yarn

## Step 1: Environment Variables

Copy the example file and fill in your configuration:

```bash
cp .env.example .env
```

### Required Variables

#### Basic Server Config
```
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
```

#### Database
```
MONGODB_URI=mongodb://localhost:27017/meet-sync
```

For MongoDB Atlas cloud:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/meet-sync?retryWrites=true&w=majority
```

#### JWT Configuration
```
JWT_SECRET=your-long-random-string-min-32-chars
JWT_EXPIRES_IN=7d
```

Generate a secure JWT_SECRET:
```bash
openssl rand -base64 32
```

#### Google OAuth2 (See Step 2 for setup)
```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

#### Anthropic API
```
ANTHROPIC_API_KEY=your-anthropic-api-key
```

---

## Step 2: Google Cloud OAuth2 Setup

### 2.1 Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable APIs:
   - Google Sheets API
   - Google Drive API

### 2.2 Create OAuth2 Credentials

1. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
2. Choose **Web application**
3. Configure Authorized JavaScript origins:
   ```
   http://localhost:3000
   ```
4. Configure Authorized redirect URIs:
   ```
   http://localhost:3000/auth/google/callback
   ```
5. Copy **Client ID** and **Client Secret** to your `.env` file

### 2.3 Configure Scopes

The application requires these scopes (already configured in code):
- `https://www.googleapis.com/auth/drive.file` - Create/modify sheets in user's Drive
- `https://www.googleapis.com/auth/spreadsheets` - Read/write Google Sheets

These are automatically requested during OAuth flow.

---

## Step 3: MongoDB Setup

### Option A: Local MongoDB
```bash
# macOS with Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Verify connection
mongo mongodb://localhost:27017/meet-sync
```

### Option B: MongoDB Atlas (Cloud)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Create a database user
4. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/meet-sync`
5. Add connection string to `.env` as `MONGODB_URI`

### Option C: Docker
```bash
docker run -d \
  -p 27017:27017 \
  --name mongo \
  -e MONGO_INITDB_DATABASE=meet-sync \
  mongo:latest
```

---

## Step 4: Install Dependencies

```bash
npm install
```

---

## Step 5: Verify Setup

### Check Environment Variables
```bash
npm run typecheck  # Should pass with no errors
```

### Start Development Server
```bash
npm run dev
```

Expected output:
```
[server] Server running on port 3000
[db] Connected to MongoDB at mongodb://localhost:27017/meet-sync
```

### Test Health Endpoint
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "uptime": 123.45,
    "db": "connected"
  },
  "message": "Success"
}
```

### View API Documentation
Open [http://localhost:3000/docs](http://localhost:3000/docs) in your browser to see Swagger UI with all endpoints.

---

## Step 6: Testing the Flow

### 6.1 Create a Test User (Auth Required)

You'll need to implement user registration/login first. This is scaffolded but not yet implemented. For now, we'll use JWT tokens manually.

**Option 1: Generate a test JWT manually**

```bash
node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { 
    id: '507f1f77bcf86cd799439011', 
    email: 'test@example.com', 
    name: 'Test User',
    role: 'user'
  },
  'your-jwt-secret-min-32-chars-long',
  { expiresIn: '7d' }
);
console.log('Token:', token);
"
```

Copy the generated token - you'll use this in all requests.

### 6.2 Create an Event

```bash
curl -X POST http://localhost:3000/api/v1/events \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech Conference 2024",
    "startDate": "2024-06-01T09:00:00Z",
    "endDate": "2024-06-02T17:00:00Z"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "event": {
      "_id": "...",
      "ownerUserId": "507f1f77bcf86cd799439011",
      "name": "Tech Conference 2024",
      "sheetId": "1abc...xyz",
      "sheetUrl": "https://docs.google.com/spreadsheets/d/1abc...xyz/edit",
      "boothCount": 0,
      "createdAt": "2024-05-07T10:00:00Z",
      "updatedAt": "2024-05-07T10:00:00Z"
    }
  },
  "message": "Event created"
}
```

**Note:** This will create a real Google Sheet in your Drive. Check your Google Drive!

### 6.3 List Events

```bash
curl http://localhost:3000/api/v1/events \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 6.4 Create a Booth Entry

```bash
curl -X POST http://localhost:3000/api/v1/events/{eventId}/booths \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "boothName": "Google Booth",
    "scans": [
      {
        "ocrText": "John Doe, Google, john@google.com",
        "extractedFields": {
          "name": "John Doe",
          "company": "Google",
          "email": "john@google.com",
          "phone": "+1-555-123-4567"
        },
        "imageUrl": "https://example.com/image.jpg"
      }
    ]
  }'
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "boothId": "...",
    "sheetRowNumber": 2
  },
  "message": "Booth created"
}
```

**Check the Google Sheet:** A new row will be appended with the booth data!

### 6.5 Get an Event

```bash
curl http://localhost:3000/api/v1/events/{eventId} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Troubleshooting

### "Google Sheets unavailable" (502)
- Check Google credentials in `.env`
- Verify APIs enabled in Google Cloud Console
- Check application has Drive & Sheets scopes

### "Reconnect Google account" (412)
- User doesn't have a refresh token stored
- This happens if auth hasn't been completed yet (auth feature not fully implemented)
- Workaround: For testing, manually add a refresh token to the User document:
  ```
  db.users.updateOne(
    { _id: ObjectId("...") },
    { $set: { googleRefreshToken: "your-refresh-token" } }
  )
  ```

### MongoDB connection fails
- Check `MONGODB_URI` is correct
- If local: `brew services start mongodb-community`
- If cloud: verify IP whitelist in Atlas includes your machine

### "Invalid or expired token" (401)
- Generate a new JWT token with correct secret
- Ensure token is in `Authorization: Bearer {token}` format
- Tokens expire after `JWT_EXPIRES_IN` (default 7d)

### Port 3000 already in use
- Change `PORT` in `.env` to another port (e.g., 3001)
- Or kill existing process: `lsof -ti:3000 | xargs kill -9`

---

## Next Steps

Once the flow is tested:

1. **Implement Auth Feature** - Register/login endpoints to issue real JWTs
2. **Add Tests** - Unit tests for services, integration tests for APIs
3. **Production Deployment** - Set secure env vars, enable HTTPS, etc.
4. **Frontend Integration** - Build UI to consume these APIs

---

## Useful Commands

```bash
# Start dev server with auto-reload
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Format code
npm run format

# Type check
npm run typecheck

# View MongoDB collections
mongosh mongodb://localhost:27017/meet-sync
  db.events.find()
  db.booths.find()
  db.users.find()
```

---

## Architecture Quick Reference

```
Request Flow:
User → Controller (parse input) 
      → Service (auth check, Google API calls) 
      → Repository (database) 
      → MongoDB

Event Creation:
1. Controller validates JWT
2. Service fetches user's Google refresh token
3. Service creates OAuth2 client from refresh token
4. Service calls Google Sheets API to create sheet
5. Service saves event to MongoDB
6. Google Sheet is now linked to event

Booth Creation:
1. Controller validates JWT & event ownership
2. Service fetches event from DB
3. Service appends row to event's Google Sheet
4. Service saves booth metadata to MongoDB
5. event.boothCount incremented
6. Sheet row number returned to client
```
