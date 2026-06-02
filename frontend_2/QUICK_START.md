# Quick Start Guide

## 🚀 Get Up & Running in 5 Minutes

### Prerequisites

```bash
# Check Node.js version (requires 18+)
node --version
npm --version
```

### Installation

```bash
# 1. Navigate to frontend_2 directory
cd frontend_2

# 2. Install dependencies
npm install

# 3. Start development server
npm start
```

The application will open at **http://localhost:4200**

## 📝 Default Credentials

The app uses JWT authentication with Google OAuth2 integration. You can:

1. **Sign in with Google** - Click "Sign in with Google" button
2. **Local Development** - Configure a local API endpoint in `src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000', // Your backend API
};
```

## 🗂️ Project Structure at a Glance

```
frontend_2/
├── src/
│   ├── app/
│   │   ├── core/              ← Services, guards, models
│   │   ├── shared/            ← Reusable components
│   │   ├── features/          ← Feature modules
│   │   ├── layouts/           ← Layout components
│   │   ├── app.routes.ts      ← Main routing
│   │   └── app.component.ts   ← Root component
│   ├── styles.scss            ← Global styles
│   ├── main.ts                ← Entry point
│   └── index.html
├── angular.json               ← Angular config
├── tsconfig.json              ← TypeScript config
├── tailwind.config.js         ← Tailwind config
└── README.md                  ← Full documentation
```

## 🔑 Key Features

### ✅ Authentication
- JWT-based with Google OAuth2
- Auto-logout on unauthorized access
- Token management in localStorage

### ✅ Routing
- Lazy-loaded feature routes
- Protected routes with auth guard
- Separate layouts for auth & main

### ✅ State Management
- Angular Signals for local state
- Services with reactive patterns
- RxJS for async operations

### ✅ UI Components
- Angular Material (Toolbar, Cards, Tables, Forms, Dialogs)
- Tailwind CSS for responsive design
- Reusable shared components

### ✅ HTTP Layer
- Centralized API service
- 3 Interceptors: Auth, Error, Loading
- Typed responses with interfaces

## 🛠️ Common Commands

```bash
# Development
npm start              # Start dev server (port 4200)

# Building
npm run build          # Build for development
npm run build:prod    # Build for production

# Code Quality
npm run lint          # Run ESLint
npm run format        # Format with Prettier
npm run type-check    # Check TypeScript types

# Testing
npm test              # Run unit tests
```

## 📱 Features Implemented

### 🔐 Auth Module
- Sign-in page with Google OAuth
- JWT token management
- Auto-logout on unauthorized

### 🏠 Home Module
- Dashboard with activity stats
- Recent activity feed
- Quick navigation to features

### 📊 Exhibitor Module
- Create and manage events
- Event list with pagination
- Event CRUD operations

### 👥 Visitor Module
- View scanned booths history
- Mark visits at booths
- Multi-step visitor form

## 🎯 Next Steps

### 1. Connect Backend API

Update `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000', // Your backend URL
};
```

### 2. Implement Additional Features

- Create new components in `src/app/features/`
- Add services in `src/app/core/services/`
- Update routes in `src/app/app.routes.ts`

### 3. Customize Styling

- **Tailwind**: Edit `tailwind.config.js`
- **Material**: Configure in `src/styles.scss`
- **Component Styles**: Use SCSS in component files

### 4. Add More Interceptors

Create new interceptors in `src/app/core/interceptors/` and add to `src/main.ts`:

```typescript
withInterceptors([authInterceptor, errorInterceptor, loadingInterceptor])
```

## 🔍 File Locations

### Services
- `src/app/core/services/` - All application services

### Components
- `src/app/shared/components/` - Reusable components
- `src/app/features/*/` - Feature components

### Models & Types
- `src/app/core/models/` - Data models
- `src/app/shared/interfaces/` - API interfaces

### Routes
- `src/app/app.routes.ts` - Main routing config
- `src/app/layouts/` - Layout routing

## 🚨 Troubleshooting

### Port Already in Use

```bash
# Use different port
ng serve --port 4201
```

### Module Not Found

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Issues

```bash
# Check types
npm run type-check

# Clear Angular cache
rm -rf .angular
npm start
```

## 📖 Full Documentation

- **README.md** - Complete documentation
- **ARCHITECTURE.md** - Architecture & patterns
- **Angular Docs** - https://angular.io
- **Material Docs** - https://material.angular.io
- **Tailwind Docs** - https://tailwindcss.com

## 🆘 Need Help?

### Check These Files

1. **Types not working?** → `tsconfig.json`
2. **Routes not found?** → `src/app/app.routes.ts`
3. **API calls failing?** → `src/app/core/services/api.service.ts`
4. **Styles broken?** → `src/styles.scss` or `tailwind.config.js`

### Common Solutions

**Q: Button styling looks wrong?**  
A: Check if Material import is in `src/styles.scss` and Tailwind is configured.

**Q: API calls not authenticated?**  
A: Check `src/app/core/interceptors/auth.interceptor.ts` and ensure token is stored.

**Q: Routes not working?**  
A: Verify `src/app/app.routes.ts` and check browser console for errors.

## ✨ Tips & Tricks

### Use Path Aliases

Instead of: `import { User } from '../../../core/models/user.model'`  
Use: `import { User } from '@core/models/user.model'`

Configured in `tsconfig.json`:
```json
"paths": {
  "@core/*": ["src/app/core/*"],
  "@shared/*": ["src/app/shared/*"],
  "@features/*": ["src/app/features/*"]
}
```

### Format Code Before Commit

```bash
npm run format
```

### Check Type Safety

```bash
npm run type-check
```

---

**You're all set!** 🎉 Start building your Angular app. Refer to ARCHITECTURE.md for detailed patterns and best practices.
