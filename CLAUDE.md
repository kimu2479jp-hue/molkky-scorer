# CLAUDE.md - Molkky Scorer

## Project Overview
Molkky (Finnish skittle throwing game) score management PWA.

## Tech Stack
- React 18 (Vite 5) - single page app
- Inline styles (no CSS-in-JS libraries)
- State management: useReducer
- Persistence: IndexedDB
- Backend: Supabase (sync/storage)
- Hosting: Vercel (with serverless API routes in /api)

## Project Structure
```
src/App.jsx      - Main application (single file, keep it that way)
src/main.jsx     - Entry point
src/styles.css   - Global styles
api/analyze.js   - Vercel serverless function
api/sync.js      - Vercel serverless function (Supabase sync)
public/          - Static assets, manifest, icons
```

## Critical Constraints
- **DO NOT modify game logic**: reducer, adv, scoreOf, failsOf, getPI, and related functions must remain unchanged
- **ASCII only**: No smart quotes or special characters (curly quotes, em-dashes, etc.)
- **Single file**: App.jsx must remain a single file - do not split into components
- **iPhone Safari PWA**: Must work correctly as an installed PWA on iOS Safari

## Available Libraries
- lucide-react (icons)
- recharts (charts)
- @supabase/supabase-js

## Build
```bash
npx vite build
```
