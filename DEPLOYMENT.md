# Deployment Guide for Astrova Frontend

## SPA Routing Fix for Render

This guide explains how the SPA (Single Page Application) routing issue has been resolved for the Astrova frontend deployed on Render.

### Problem

When users visit URLs like `https://astrova-frontend.onrender.com/planet-transits` directly (via bookmark, refresh, or sharing), they receive a 404 error because:

1. The server tries to find a file at `/planet-transits`
2. No such file exists - it's a client-side route handled by React Router
3. The server doesn't know to serve `index.html` for client-side routes

### Solution

The fix involves multiple layers to ensure SPA routing works correctly:

#### 1. Render Configuration (`render.yaml`)

Added the crucial `routes` section to the frontend service:

```yaml
routes:
  - type: rewrite
    source: /*
    destination: /index.html
```

This tells Render to serve `index.html` for any route that doesn't match an existing file.

#### 2. Build Process Enhancement

- **Modified `package.json`**: Added `build:spa` script that includes SPA-specific build steps
- **Created `scripts/postbuild.js`**: Automatically creates `404.html` as a fallback identical to `index.html`

#### 3. Fallback Files

- **`build/404.html`**: Created automatically during build as a backup fallback
- **`public/404.html`**: Manual fallback with redirect script (backup)

### Files Modified

1. **`render.yaml`**: Added routes configuration for SPA routing
2. **`package.json`**: Added `build:spa` and `postbuild` scripts
3. **`scripts/postbuild.js`**: New file for build-time SPA setup
4. **`public/_redirects`**: Disabled (Netlify-specific, not needed for Render)
5. **`public/404.html`**: Added as manual backup

### Deployment Process

To deploy with SPA routing support:

```bash
# Local testing
npm run build:spa
npm run serve

# Or for Render (handled automatically via render.yaml)
git push origin main
```

### Verification

After deployment, test these scenarios:

1. **Direct URL access**: Visit `https://astrova-frontend.onrender.com/planet-transits`
2. **Page refresh**: Navigate to a route and refresh the page
3. **Bookmark/share**: Bookmark a page and open it in a new tab

All should load the correct page without 404 errors.

### Technical Details

- **React Router**: Uses `BrowserRouter` with HTML5 history API
- **Vite Build**: Outputs to `./build` directory
- **Render Hosting**: Static site with rewrite rules for SPA routing
- **Fallback Strategy**: Multiple layers (Render routes → 404.html → redirect)

### Troubleshooting

If routing issues persist:

1. Check Render deployment logs for build errors
2. Verify `build/404.html` exists and matches `build/index.html`
3. Test locally with `npm run serve` after `npm run build:spa`
4. Ensure `render.yaml` routes section is properly formatted

### Alternative Solutions

If the current setup doesn't work, consider:

1. **Hash Router**: Switch from `BrowserRouter` to `HashRouter` (less SEO-friendly)
2. **Manual redirect**: Add server-side redirects in hosting configuration
3. **Subdirectory deployment**: Deploy to a subdirectory instead of root domain

---

Last updated: July 12, 2025
