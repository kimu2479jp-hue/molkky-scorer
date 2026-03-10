# CLAUDE.md - Molkky Scorer

## Project Overview
Molkky (Finnish skittle throwing game) score management PWA.
See `DESIGN_PHILOSOPHY.md` for comprehensive design rationale, screen-by-screen specs, and all confirmed decisions.

## Tech Stack
- React 18 (Vite 5) - single page app
- Inline styles (no CSS-in-JS libraries)
- State management: useReducer
- Persistence: IndexedDB (stats, replays, AI analysis cache), localStorage (favorites, progress, settings)
- Backend: Supabase free tier (cloud sync/storage)
- Hosting: Vercel (with serverless API routes in /api)
- AI Analysis: Anthropic API via /api/analyze.js (model: claude-sonnet-4-5-20250929)

## Project Structure
```
src/App.jsx      - Main application (single file, keep it that way)
src/main.jsx     - Entry point
src/styles.css   - Global styles (iOS Safari fixes, CSS variables, animations)
api/analyze.js   - Vercel serverless: Anthropic API proxy for AI analysis
api/sync.js      - Vercel serverless: Supabase proxy for cloud sync + admin PIN
public/          - Static assets, manifest, icons
DESIGN_PHILOSOPHY.md - Comprehensive design philosophy and specs (READ THIS)
```

## Critical Constraints
- **DO NOT modify game logic**: reducer, adv, scoreOf, failsOf, getPI, and related functions must remain unchanged
- **ASCII only in code**: No smart quotes or special characters (curly quotes, em-dashes in code). Em-dashes in comments are acceptable.
- **Single file**: App.jsx must remain a single file - do not split into components
- **iPhone Safari PWA**: Must work correctly as an installed PWA on iOS Safari
- **Team-specific colors (C array .bg/.ac/.nm) are NOT used in GameScreen during active match display**. They remain in use for SetupScreen, GameResult, ShuffleAnimation, and canvas image export.
- **No output length restrictions**: Do not self-impose character or word limits. Provide full, comprehensive output. The previous "1200 chars per output" rule from the Pro plan era has been permanently removed.
- **Staged large changes**: Large modifications should still be broken into phases for safety, but each phase can be as detailed as needed.

## Available Libraries
- lucide-react (icons)
- recharts (charts)
- @supabase/supabase-js

## Build
```bash
npx vite build
```

## Design Philosophy

### What This Scorer Solves
Molkky is a time-limited competition. The scorer operator and surrounding players must read and judge multiple pieces of information simultaneously within a few seconds per turn:
- Read opponent scores from the score table
- Know remaining points to reach 50
- Identify opponent finishing opportunities
- Read score trends to gauge opponent form
- Judge miss frequency

Decisions happen within tens of seconds per turn. "Readable" is not enough -- the information design must enable instant, accurate situational awareness at a glance. Visibility (instant correct comprehension) is the most important quality standard.

### Core Design Nucleus
The UI must enable instant, error-free recognition of "the current situation":
1. Current game number and turn number
2. Which team is currently active
3. Who is the current player
4. Current score
5. Miss count and status

### Screen-by-Screen Priorities
- **GameScreen** (in-match) = Most important. Visibility (rapid, accurate situation reading) is the absolute priority. Function over aesthetics.
- **Stats screens** = Aesthetics and polish. Viewed at leisure after matches.
- **SetupScreen** = Ease of operation. Quick, intuitive pre-match configuration.

## Target Environment

### Tablet (iPad) = Primary Reference
- **Conditions:** Direct sunlight, iPad portrait, tripod at 1.5m height, up to 3m viewing distance, 8-10 people viewing simultaneously
- **Final standard:** Multiple people up to 3m away must instantly grasp the current situation even in direct sunlight
- **Priority when in doubt:** Group visibility > Instant readability > Error resistance > Contrast in sunlight > Elegance

### Smartphone (iPhone)
- **Conditions:** Single user, close-range operation
- **Final standard:** Comfortable, intuitive operation with immediate information access

### Adoption Checklist for Tablet Improvements
1. Can primary information be read when contrast drops in direct sunlight?
2. Can the active team be identified at a glance from up to 3m away?
3. Are team name, current player name, score, and miss count visible as a coherent information block?
4. Does the layout hold up with 3 or 4 teams?
5. Has visibility been sacrificed for the sake of aesthetics?

All 5 must be satisfied for an improvement to be adopted.

## UI Design Principles

### Active/Inactive Color System
Team-specific colors are removed from GameScreen match display. Teams are distinguished by active/inactive state only.

**Active team:**
- Header band: dark navy (#14365a) with white text
- Left accent bar: yellow (#ffc107)
- Player name: yellow (#ffc107) for emphasis
- Score table header: dark navy

**Inactive team(s):**
- Header band/row: low-saturation dark background (#1a2a3e) with white text
- Score table header: gray (#6b7280)

**Common:**
- Color palette limited to 5 families: dark navy, yellow/amber, gray, white, black
- No mid-tones, light gradients, or semi-transparent colors
- Input area maintains current style (bright background base, already good)

### Information Block Concept
Team name + player name + score + misses are displayed as a meaningful unit (information block), not as scattered individual values. Information blocks take priority over isolated large numbers.

### Visual Hierarchy Through Layout
The primary tool for eye guidance is layout, position, and size. Color contrast serves as a supporting reinforcement, not the primary mechanism.

### Elegance Through Structure
Elegance is expressed through whitespace, alignment, information hierarchy, and color count control. Mid-tones, light gradients, semi-transparent effects, and weak borders are removed as means of expressing elegance.

### Background Direction
- Full dark background is retired
- Content and input areas shift to bright backgrounds
- Dark navy is reserved for headers and active emphasis only
- Goal: "high visibility with structural elegance", not "pale and refined"

### Player Name Display
- Full names shown without truncation as a rule
- Never sacrifice font size or weight for full display if it hurts outdoor visibility
- Absorb long names through layout adjustments first
- Active player name is one of the most important pieces of information

### Input Area Constraints
- Button sizes must not exceed the current isTablet logic upper limits

## Confirmed Code Decisions (Latest)

### Immediate TODO
- **console.log cleanup**: Remove all `console.log` statements. Keep `console.error` (useful for debugging).
- **Score table display fix**: When a player is disqualified (3 consecutive misses) AND had a fault reset (37+ points), do NOT display "F↓" in the score table. Disqualification takes visual priority. Show the disqualification marker only.

### Intentional Design Decisions (Do Not Change)
- **MAX_SYNC_CODES=1**: Intentional. Prevents unauthorized sync codes from consuming Supabase free tier storage. Will be expanded when needed.
- **Progress save in localStorage**: The in-progress game snapshot (`mk-game-progress`) remains in localStorage intentionally. Migration to IndexedDB is planned after the court-count feature is complete.
- **DEV_MASTER_LIST hardcoding**: Developer-only feature for SmartFavPicker. Acceptable for personal project.
- **Team color array (C) retention**: The color array remains for ScoreTable, RadarChart, and other non-GameScreen contexts. GameScreen uses active/inactive distinction only.

### Security Awareness (Known, Accepted for Now)
- Admin PIN stored in plaintext on Supabase (acceptable for personal project; hash when sharing with others)
- Sync code "MolkkyFuji223" hardcoded in source (public repo; move to env var when needed)
- CORS set to `*` on both API endpoints (restrict to molkky-scorer.vercel.app when ready for distribution)
- Current assessment: **not ready for distribution to others**. Security hardening required before sharing.

## Completed Features (Do Not Re-implement)
The following have been fully implemented and merged to main:

- ✅ UI Visibility Redesign (active/inactive color system, header cards, animations)
- ✅ ShuffleAnimation bug fix (revealPos useRef, safety valve, try-catch)
- ✅ ShuffleAnimation visual improvements (3D card flip, deck stack, random deal order, simple team reveal)
- ✅ IndexedDB migration (100K game capacity, in-memory cache, localStorage migration)
- ✅ Supabase cloud sync (server-wins for favorites, union merge for stats/replays)
- ✅ Admin/Member PIN system (server-side verification, lockout logic)
- ✅ AI Analysis overhaul (manual trigger only, IndexedDB cache with 32-day expiry)
- ✅ Calendar UI (full calendar with date/range modes, year picker, month toggle)
- ✅ Recent games tab (30 games, pagination, range filter buttons)
- ✅ Radar chart 7-axis (win rate added)
- ✅ First/last move win rate in detail metrics
- ✅ Score distribution analysis (sv field, ScoreDistribution component)
- ✅ Favorite player limit (99 max)
- ✅ iPhone copy-paste corruption fix (workflow moved to Claude Code)
- ✅ iOS Safari fixes (touch-action, overscroll, safe-area-inset, contextmenu)
- ✅ FavDropdown dynamic positioning (viewport-aware)

## Upcoming / Planned
- Court count feature (multiple courts per session)
- Progress save migration to IndexedDB (after court count)
- Security hardening (PIN hashing, CORS restriction, env var for sync code)
- console.log cleanup
- F↓ display fix for disqualification edge case

## Critical Scope Rules
All UI changes must stay isolated from core game logic.

Do not change:
- reducer
- adv
- scoreOf
- failsOf
- getPI
- existing score rules
- existing match result logic
- existing persistence behavior unless absolutely necessary

## Collaboration Instructions for Claude Code
When working on this project:
- **No output length restrictions.** Provide full, comprehensive responses.
- Make changes in logical phases for safety, but each phase can be as detailed as needed
- Verify build passes after each change
- Request real-device confirmation from the user before proceeding to next change
- Do not rewrite unrelated parts of the app
- Preserve existing constraints from this CLAUDE.md file
- When uncertain, favor maintainability plus polish over complexity for its own sake
- Read DESIGN_PHILOSOPHY.md for detailed rationale behind design decisions

### Lessons from Previous Failures
1. Claude AI artifact previews cannot verify correct display (styles.css CSS variables are not loaded). Always confirm on real device after Vercel deploy.
2. Do not make "lightening" an end in itself. Bright gray backgrounds + gray text caused contrast failures before. The goal is high contrast readability, not brightness.
3. Do not break what already works well. Dark background + white text for inactive rows was rated positively -- maintain that direction.
4. Confirm visual direction with mockups before writing code.
5. iPhone Safari copy-paste corrupts code (smart quotes, unicode ellipsis, en-dashes). Never edit files via GitHub Web UI on iPhone. Always use Claude Code for git operations.
6. ShuffleAnimation bugs can cause full-screen black lockout. Always include safety valve (auto-close on stall) and try-catch wrapper around the entire return.

## Vercel Configuration
- Active project: `molkky-scorer` (team slug: `kimu2479jp-hues-projects`)
- Production URL: `molkky-scorer.vercel.app`
- Required env vars: `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- Supabase anon key format: `sb_publishable_...` (not the legacy `eyJhbG...` format)
