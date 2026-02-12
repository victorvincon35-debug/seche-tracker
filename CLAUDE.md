# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sèche Tracker is a gamified 30-day fitness/diet tracking PWA (Progressive Web App) themed around a Paris → Rome road trip. Built as a single-page React app with Vite. All app logic lives in a single file: `src/App.jsx`.

## Commands

- `npm run dev` — Start dev server (Vite, http://localhost:5173)
- `npm run build` — Production build
- `npm run preview` — Preview production build locally

No test framework or linter is configured.

## Architecture

**Single-component app**: The entire application is in `src/App.jsx` (~505 lines). There are no separate component files, no router, and no state management library.

**Key patterns:**
- State is managed via `useState` hooks in the root `App` component
- Data is persisted to `localStorage` (offline-first) and synced to Supabase in the background
- Deep cloning with `JSON.parse(JSON.stringify(data))` before mutations
- Tab-based navigation (dashboard, habits, food, supps, health, rewards, stats, weight) rendered conditionally in a single return block

**Authentication & Sync** (`src/supabase.js`):
- Supabase Auth with email/password — login screen gates the app
- Data stored as a single JSONB blob in Supabase `user_data` table (mirrors localStorage)
- localStorage remains primary source (offline-first PWA); Supabase syncs in background
- `save()` writes to localStorage immediately, then debounced push (800ms) to Supabase
- On app load: compares local vs remote timestamps, newest wins
- On `online` event: pushes queued local changes to Supabase
- Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (in `.env`, gitignored)

**Data model** (stored in localStorage):
- `days[dateKey]` — daily check-ins: `habits`, `meals`, `supps`, `temp` (temperature readings)
- `weeks[wN]` — weekly data: `symptoms` (0-10 scores), `naturo` (naturopathy notes)
- `weight[wN]` — weekly body measurements (poids, taille_tour, bras, cuisses, photos)
- `totalXP` — cumulative XP from checking items; drives avatar progression and city unlocks
- `bestStreak`, `seenRewards` — gamification state

**Configuration constants** (top of App.jsx): `CITIES`, `AVATAR_STAGES`, `WEEKLY_REWARDS`, `HABITS`, `MEALS`, `SUPPS`, `SYMPTOMS`, `NATURO`, `ACHIEVEMENT_REWARDS` — these define all trackable items, XP values, and reward conditions.

**Sub-components** (defined in same file): `AvatarSVG` (animated body SVG), `MapSVG` (route map), `RewardCard`, `LoginScreen`.

## Tech Stack

- React 18, Vite 5, Recharts (charts: LineChart, RadarChart, AreaChart)
- Supabase (`@supabase/supabase-js`) for auth + database
- PWA via `vite-plugin-pwa` with Workbox (offline support, installable)
- No CSS framework — all styles are inline with CSS-in-JS objects + a `<style>` tag for animations/classes
- Google Fonts: Outfit (UI) and Space Mono (numbers)

## Customization Points

- `START_DATE` and `TOTAL_DAYS` control the challenge period
- Color scheme: `#e94560` (accent red), `#0a0a1a` (dark bg), `#ffeb3b` (gold), `#4caf50` (green)
- All trackable items (habits, meals, supplements) are defined as arrays of `{ id, label, emoji, xp }` objects
