# SimSync Vercel Deployment Fix

## Problem
The 404 error on `/login` was occurring because **Vercel didn't have the proper configuration to handle Single Page Application (SPA) routing**. When users visit `/login` directly (especially on mobile), Vercel tries to serve a file at that path, but it doesn't exist - only `index.html` exists.

## Solution
Added `vercel.json` configuration files to handle SPA routing properly.

## Changes Made

1. **Added `vercel.json`** at root level - Configures Vercel to build from the frontend subdirectory
2. **Added `vercel.json`** in frontend folder - Fallback configuration
3. **Updated CORS settings** in backend to allow simsync.dev domain
4. **Reverted backend changes** - Since frontend is hosted separately on Vercel

## Root `vercel.json` Configuration

```json
{
  "buildCommand": "cd simsync/frontend && npm install && npm run build",
  "outputDirectory": "simsync/frontend/dist", 
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This tells Vercel:
- Build the frontend from the subdirectory
- Serve all routes through `index.html` (SPA routing)
- Let React Router handle client-side routing

## How It Works

1. **All routes redirect to `index.html`** - Whether someone visits `/login`, `/dashboard`, or any other route
2. **React Router takes over** - The frontend app handles routing client-side
3. **Mobile and direct links work** - No more 404 errors on direct navigation

## Deployment

1. **Commit and push** the `vercel.json` files to your repository
2. **Vercel will automatically redeploy** with the new configuration
3. **Test the fix** by visiting `https://simsync.dev/login` directly

The `/login` route should now work properly on both desktop and mobile!