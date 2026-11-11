# Ultimate Football Manager

A complete, deterministic, browser-based football management simulation built with **Next.js (App Router)**, **React 19**, **TypeScript (strict)**, **Tailwind CSS**, **Zustand**, and **Three.js / React Three Fiber**.

Designed for zero-config deployment on **Vercel** with full local **IndexedDB** persistence (autosave + 3 manual save slots + JSON export/import) and optional **Supabase** cloud sync.

---

## Key Features (M1–M6 Complete)

1. **Deterministic Pure-TypeScript Simulation Engine (`/src/engine`)**
   - Uses a seeded `mulberry32` PRNG (`src/engine/rng.ts`) with zero `Math.random` or `Date.now` calls.
   - `simulateMatch(input, seed)` generates a deterministic `MatchResult` and ordered `MatchEvent[]`.
   - Calibrated and verified against 1,000-match realism targets (2.5–3.0 goals/match, 43–47% home win, 24–28% draw, 27–31% away win, 10–14 shots/team, ~35% on target, 3–5 yellow cards/match, <0.12 red cards/match, +10 OVR advantage with ~12% upset rate).
2. **World & Data Generation**
   - 2 divisions of 10 fictional clubs (20 clubs total), 500 senior players + youth academy prospects, 24 technical/physical/mental/goalkeeping attributes (1–100), and documented position-weighted overall ratings.
3. **Squad & Tactical Management**
   - Interactive pitch supporting 7 formations (`4-3-3`, `4-2-3-1`, `4-4-2`, `3-5-2`, `3-4-3`, `4-1-4-1`, `5-3-2`), drag-and-drop + tap-to-swap, and real-time lineup validation (11 starters, 1 GK, no duplicates).
   - Full tactical controls (mentality, attacking style, pressing intensity, defensive line, width, tempo, directness, counter-pressing, offside trap).
4. **Single-Timeline Match Viewer (Text, 2D Pitch, 3D Stadium)**
   - **Text Mode**, **2D Top-Down SVG Pitch**, and **3D React Three Fiber Stadium** all replay the exact same `MatchEvent[]` timeline and produce identical scorelines.
   - Live touchline mentality changes and substitutions during playback re-simulate only the remaining minutes (`resimulateFromMinute`) while preserving all prior events.
   - 3D viewer includes 4 camera presets (`Broadcast`, `Tactical Overhead`, `Follow-Ball`, `Goal Replay`), graphics quality settings (`Low`, `Medium`, `High`), floodlights, stands, and instanced crowd.
5. **Deep Club Management & Multi-Season Progression**
   - **Transfer Market**: Search/filter 500+ players, shortlist, fee & wage negotiations, loans, and weekly AI club transfers.
   - **Training, Scouting & Youth Academy**: Weekly training calendar with capped seasonal growth (`+5 OVR`), scout assignments & dossiers, and youth prospect promotion.
   - **Finances & Board Confidence**: Cash ledger, gate receipts, sponsor income, wage budgets, board expectations, promotion/relegation between Division 1 and Division 2, National Challenge Cup, Continental Champions Cup, and full multi-season rollover.
6. **Cinematic Cutscenes & Procedural Web Audio**
   - Skippable event-triggered cutscenes (Manager Intro, Team Talks, Player Signing, Trophy Presentation, League Championship).
   - 100% procedural Web Audio API sound synthesiser (crowd cheers, referee whistles, ball kicks, UI clicks) with volume & mute sliders.

---

## Getting Started

### 1. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 2. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 3. Run Quality Gates (Typecheck, Unit/Realism Tests, Production Build)
```bash
npm run lint      # Strict TypeScript check
npm test          # Vitest unit, determinism, 1,000-match realism & 3-season simulation tests
npm run build     # Next.js production build
npm run test:e2e  # Playwright end-to-end browser smoke test
```

---

## Deploying to Vercel

1. Push this repository to GitHub.
2. Import the repository into [Vercel](https://vercel.com/new).
3. Framework Preset: **Next.js** (detected automatically).
4. Click **Deploy** — no environment variables are required! The game runs 100% in the browser using IndexedDB persistence by default.
5. *(Optional)* To enable Supabase cloud saves, create a free project at [Supabase](https://supabase.com), run `supabase/migrations/001_initial_schema.sql` and `supabase/seed.sql` in the SQL Editor, and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in your Vercel project settings (or use free alternatives such as Neon PostgreSQL / Turso / local JSON export).
