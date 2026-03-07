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

## Current Branch Goal
This branch is dedicated to redesigning the shuffle animation into a high-polish dealer animation sequence.

Branch name:
feature/dealer-animation

Primary goal:
Replace the current simple shuffle animation with a more premium visual sequence in which an original casino dealer style character naturally shuffles and deals cards to each team.

## Design Direction for Dealer Animation
The desired direction is not "fastest implementation" but "highest visual quality that can still be maintained safely in the existing app".

Target experience:
- A casino dealer style original character appears during the shuffle/deal sequence
- The character performs a natural looking shuffle motion
- The character then deals cards to teams in a clean and elegant motion
- Cards should look closer to real playing cards, not plain rectangles with names only
- Card frames should feel like trump or casino cards, while still keeping team and player names readable
- The animation should feel stylish, polished, and premium
- Motion should avoid looking robotic, abrupt, or cheap

## Critical Scope Rules
The dealer animation work must stay isolated from core game logic.

Do not change:
- reducer
- adv
- scoreOf
- failsOf
- getPI
- existing score rules
- existing match result logic
- existing persistence behavior unless absolutely necessary

The animation redesign must be treated as a presentation layer upgrade, not a game logic rewrite.

## Implementation Strategy
Use a staged approach.

Preferred order:
1. Define art direction
2. Define animation behavior and timing
3. Define card visual rules
4. Build a static visual mock inside the app
5. Build a temporary animated prototype
6. Replace temporary motion with polished production animation
7. Test layout and behavior on existing target devices

Do not jump straight into complex animation without first establishing visual structure.

## Character Direction
The dealer must be an original character, not a copy of any existing copyrighted character.

Character direction:
- casino dealer inspired outfit
- elegant and readable silhouette
- suitable for web animation
- visually clear at mobile and tablet sizes
- hands and arms must be designed with animation in mind
- expression should feel confident, calm, and professional
- avoid overly noisy costume details that become unreadable on smaller screens

The character design must prioritize animation usability, not just still-image beauty.

## Animation Direction
Animation quality is very important.

Required motion qualities:
- natural anticipation before movement
- smooth hand and arm motion
- believable dealing rhythm
- clean card travel paths
- visually readable pauses between shuffle and deal phases
- no sudden snapping unless intentionally stylized
- no motion that blocks important UI text
- no motion that makes team assignment unclear

The sequence should feel deliberate and elegant.

Suggested animation states:
- idle
- intro
- shuffle_start
- shuffle_loop
- draw_card
- deal_team_1
- deal_team_2
- deal_team_3
- deal_team_4
- finish

State names may change if needed, but the sequence must remain understandable.

## Card Design Direction
Cards must be visually upgraded.

Required card design goals:
- playing card inspired outer frame
- premium card look rather than plain name tag
- team and player names must remain easy to read
- card face must work well in motion
- border and corner treatment should feel intentional
- avoid overly detailed decoration that reduces readability

The card design should balance theme and usability.

## Layout and Responsiveness
The animation must work within the existing app without harming usability.

Requirements:
- preserve readability on iPhone Safari PWA
- preserve usability on tablet sized screens
- do not cover critical score controls for too long
- do not create layout jumps that feel broken
- keep animation visually centered and intentional
- maintain graceful behavior across different team counts if the dealing pattern depends on active teams

## Code Architecture Guidance
Keep the existing project stable.

Preferred engineering approach:
- isolate dealer animation related code as much as possible
- keep changes easy to review
- keep fallback behavior possible
- avoid large unrelated refactors
- avoid changing stable code unless required by the animation feature

If a risky approach and a safer approach both exist, prefer the safer one unless visual quality would clearly suffer.

## Asset Pipeline Guidance
Before final implementation, define the asset pipeline clearly.

Expected asset categories:
- dealer character art
- card face design
- card back design if needed
- motion mock assets
- effect assets such as shadows or subtle flourishes

All assets should use clear names and consistent organization.

## Review Standard
Every major visual step should be reviewed against these questions:
- Does it look more premium than the current shuffle?
- Does the motion read clearly at a glance?
- Does the dealing sequence feel natural?
- Are names still readable on cards?
- Is the experience compatible with the current app layout?
- Did we preserve all existing game logic constraints?

If the answer to any of these is no, revise before moving forward.

## Collaboration Instructions for Claude Code
When working on this branch:
- explain changes in small reviewable steps
- prefer safe incremental edits
- describe which files were changed and why
- do not rewrite unrelated parts of the app
- preserve existing constraints from this CLAUDE.md file
- when making animation related proposals, separate visual ideas from actual implemented code
- when uncertain, favor maintainability plus polish over complexity for its own sake

## Branch Specific Deliverable Goal
The final deliverable for this branch should be a polished dealer themed shuffle and dealing experience that:
- looks clearly better than the current version
- preserves the existing game system
- is suitable for the current Molkky Scorer app
- can be reviewed and merged without risking unrelated regressions