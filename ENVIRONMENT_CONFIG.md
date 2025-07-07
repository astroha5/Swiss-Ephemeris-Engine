# Environment Configuration

This document explains how the Astrova frontend is configured to use different API backends in different environments.

## Overview

The frontend automatically switches between local and production backends based on the environment:

- **Development**: Uses `http://localhost:3001` (local backend)
- **Production**: Uses `https://astrova-backend.onrender.com` (deployed backend)

## Environment Files

| File | Purpose | Backend URL |
|------|---------|-------------|
| `.env` | Base configuration | `http://localhost:3001` |
| `.env.local` | Local development override | `http://localhost:3001` |
| `.env.development` | Development mode | `http://localhost:3001` |
| `.env.production` | Production builds | `https://astrova-backend.onrender.com` |

## Vite Environment Loading Order

Vite loads environment files in this order (later files override earlier ones):

1. `.env` - Base configuration
2. `.env.local` - Always loaded (for local development)
3. `.env.[mode]` - Mode-specific (`.env.development` or `.env.production`)
4. `.env.[mode].local` - Mode-specific local overrides

## How It Works

### Development Mode (`npm start`)
```bash
# Loads in order:
1. .env (VITE_API_URL=http://localhost:3001)
2. .env.local (VITE_API_URL=http://localhost:3001) ✅ Final value
3. .env.development (VITE_API_URL=http://localhost:3001)

# Result: Uses localhost:3001
```

### Production Build (`npm run build`)
```bash
# Loads in order:
1. .env (VITE_API_URL=http://localhost:3001)
2. .env.local (VITE_API_URL=http://localhost:3001)
3. .env.production (VITE_API_URL=https://astrova-backend.onrender.com) ✅ Final value

# Result: Uses https://astrova-backend.onrender.com
```

## API Configuration Code

The API base URL is configured in `src/services/api.js`:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.PROD 
    ? 'https://astrova-backend.onrender.com' 
    : 'http://localhost:3001'
);
```

## Debugging

The application logs the current API configuration on startup. Check the browser console for:

```
🔗 API Configuration: {
  baseURL: "http://localhost:3001",
  environment: "development",
  isProduction: false,
  isDevelopment: true
}
```

## Development Setup

1. **Start local backend**: `cd backend && npm start`
2. **Start frontend**: `npm start`
3. **Verify**: Check console logs for API configuration

## Production Deployment

1. **Build**: `npm run build` (uses `.env.production`)
2. **Deploy**: Upload `build/` directory to hosting service
3. **Verify**: Check deployed app console logs for API configuration

## Troubleshooting

### Network Errors in Development
- Ensure local backend is running on port 3001
- Check `.env.local` has correct URL
- Verify `vite.config.mjs` proxy is configured

### Network Errors in Production
- Verify `.env.production` has correct production URL
- Check production backend is accessible
- Ensure CORS is configured on backend for frontend domain
