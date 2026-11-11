# Ultimate Football Manager — Milestone Plan

This document tracks the project roadmap and milestone checklist from M1 through M6, plus the **v2.0 Design & Gameplay Upgrade (Sections A–N)**.

## Operating Loop & Gate Criteria
- Inspect workspace & maintain `docs/PLAN.md`, `docs/STATUS.md`, `docs/DECISIONS.md`, `docs/ARCHITECTURE.md`, and `docs/DEPENDENCIES.md`.
- Every milestone must pass:
  1. `npm run lint`
  2. `npm test`
  3. `npm run build`
  4. Real browser walkthrough & verification
  5. Git commit for the milestone & Vercel deployment

---

## M1: Foundation and Playable Text-Mode Season
- [x] Project setup (Next.js App Router, React, TypeScript strict, Tailwind CSS, Zustand, Vitest, Playwright)
- [x] Design system: dark navy/charcoal (`#0b0f19` / `#111827`), pitch-green accent (`#10b981`), trophy gold (`#f59e0b`), game typography & distinct sports-management UI
- [x] Navigation shell: Home, My Club, Squad, Tactics, Transfers, Scouting, Training, Fixtures, Competitions, Finances, Youth Academy, Club History, Settings
- [x] Career creation flow: Manager name, nationality, tactical style, club selection (Division 1 & Division 2), difficulty, starting challenge
- [x] Deterministic data generator (seeded `mulberry32`): 2 divisions of 10 clubs (20 clubs), 25 players per club (500 players), fictional names by nationality, hand-written club names, colours, stadiums, attributes (1–100), position-weighted overall rating
- [x] Squad screen: interactive pitch, formations (`4-3-3`, `4-2-3-1`, `4-4-2`, `3-5-2`, `3-4-3`, `4-1-4-1`, `5-3-2`), Starting XI, 7 subs, reserves, drag-and-drop + tap-to-swap, lineup validation (1 GK, 11 starters, no duplicates)
- [x] Tactics screen: attacking style, pressing, defensive line, width, tempo, directness, mentality, counter-pressing, offside trap
- [x] Match engine v1 (`simulateMatch(input, seed)`): pure TS, seeded RNG, outputs deterministic `MatchEvent[]`, template-based commentary, uses attributes, form, fitness, morale, formation, tactics, home advantage, fatigue, injuries, substitutions
- [x] Fixtures & League table: double round-robin (18 matchdays per 10-team division), 3/1/0 points, GD, GS
- [x] Persistence (`SaveRepository`): IndexedDB primary implementation (autosave + 3 manual slots) + JSON export/import + schema version migrations
- [x] M1 Automated Tests: determinism, 1,000-match realism targets, fixtures generator, league table maths, lineup validation, save/load round-trip, Playwright smoke test

## M2: Management Systems
- [x] Transfer market: search & filters (position, age, OVR, value, nationality), shortlist, transfer offers & counter-offers, contract & wage negotiations, loans, selling players, weekly AI club transfers
- [x] Weekly training calendar: attacking, defending, passing, shooting, fitness, goalkeeping, tactical focuses; gradual attribute growth, fatigue & injury risk
- [x] Scouting system: assign scouts by region/position, generate scouting reports with potential & value estimates
- [x] Youth academy: generated youth prospects, development rate, promote to senior squad, loan out, release
- [x] Finances: transfer & wage budgets, matchday revenue, sponsorship, prize money, staff & stadium maintenance, weekly ledger
- [x] Board & Morale: board objectives, confidence rating (with dismissal protection/warning & sack condition), player morale, playing-time expectations, contract dissatisfaction, transfer requests
- [x] Multi-competition & Multi-season loop: Division 1 & Division 2 promotion/relegation (top 2 promoted, bottom 2 relegated), Domestic Cup (knockout), Continental Champions Cup & Super Cup, full season rollover (ageing, development, retirements, contract expiries, trophies, Club History page)
- [x] M2 Automated Tests: finance ledger consistency, per-season attribute growth cap, AI squad size minimum (>=18 players), 3 full seasons simulated without errors

## M3: 2D Match Viewer
- [x] Top-down HTML5 Canvas / SVG pitch replaying `MatchEvent[]` with smooth interpolated player & ball positions
- [x] Playback controls: Pause, Resume, 1x, 2x, 4x speed, Skip to End
- [x] Live tactical adjustments & live substitutions that re-simulate only the remaining minutes from the current match state deterministically
- [x] M3 Automated Tests: identical final score across Instant, Text, and 2D replay modes; mid-match re-simulation integrity

## M4: 3D Match Viewer
- [x] React Three Fiber (`@react-three/fiber`, `@react-three/drei`, `three`) stadium scene: pitch markings, goals, nets, stands, floodlights, instanced crowd, ad boards, technical areas
- [x] Procedural articulated human-proportioned 3D players with animation states (`idle`, `walk`, `run`, `sprint`, `pass`, `shoot`, `tackle`, `header`, `dive`, `celebrate`) swappable via a single config file (`src/components/match3d/playerModelConfig.ts`)
- [x] 4 Camera angles: Broadcast, Tactical Overhead, Follow-Ball, Goal Replay
- [x] Graphics quality settings: Low / Medium / High, lazy-loaded 3D canvas
- [x] Driven strictly by `MatchEvent[]` snapshots & interpolation (never re-rolls outcome)

## M5: Cutscenes and Audio
- [x] Skippable, event-triggered cinematic overlays/scenes: Goal celebration, Full-time whistle, Trophy presentation, Player signing, Manager introduction, Tunnel walkout, Pre-match talk, Half-time dressing room, League championship celebration
- [x] Web Audio API procedural sound synthesiser (crowd roar, goal cheer, referee whistle, ball kick, menu clicks) activated strictly after user interaction, with master volume, mute, and category sliders
- [x] `docs/ASSETS.md` documenting 100% original / procedural / CC0 assets

## M6: Hardening and Release
- [x] Responsive layout pass for Desktop, Tablet, and Mobile (touch-friendly navigation & controls)
- [x] Accessibility: keyboard navigation, ARIA labels, high contrast, `prefers-reduced-motion` support
- [x] Error boundaries, loading skeletons, and pagination for large player tables
- [x] Supabase optional cloud persistence adapter + `supabase/migrations/001_initial_schema.sql` (18 tables with RLS) + `supabase/seed.sql` + `.env.example`
- [x] Comprehensive `README.md` with architecture, controls, testing, and Vercel deployment instructions

---

## v2.0 Design & Gameplay Upgrade (Sections A–N)
- [x] **A. Complete Visual Redesign**: Stadium floodlight backdrop, heraldic SVG club crests (`ClubCrest`), deterministic player portraits (`PlayerAvatar`), dark navy/charcoal & pitch-green/trophy-gold hierarchy (`src/components/ui/FootballVisuals.tsx`).
- [x] **B. Home Dashboard Redesign**: Large stadium hero banner, club crest & stadium capacity, manager profile, next match preview with opponent crest, last 5 match results, league position, recent form, transfer budget, board confidence, star player spotlight, club news, upcoming fixtures, club objectives, prominent `Play Matchday` button (`src/components/layout/HomeDashboard.tsx`).
- [x] **C. Player Profiles**: Detailed player profile modal (`src/components/ui/PlayerProfileModal.tsx`) with portrait, shirt number, position, nationality, age, OVR, POT, market value, weekly salary, contract expiry, fitness, morale, form, 6-axis hexagonal attribute radar chart (`HexRadarChart`), and side-by-side player comparison tool.
- [x] **D. Squad & Tactics**: Upgraded tactical pitch (`src/components/squad/SquadScreen.tsx`) with realistic pitch markings, player portrait cards, shirt numbers, drag-and-drop + tap-to-swap, player squad role selector (`star`, `starter`, `rotation`, `prospect`), team strength ratings (ATT / MID / DEF), tactical chemistry %, and preserved lineup validation.
- [x] **E. Transfer Market**: Upgraded transfer hub (`src/components/management/TransfersScreen.tsx`) with player portraits, club crests, scouting dossier badges, contract durations, interested clubs, immersive negotiation room, and completed transfer history feed.
- [x] **F. Matchday Experience**: Pre-match presentation sheet (stadium, weather & turf condition, match importance, starting lineups, tactical comparison), broadcast scoreboard with club crests, live player ratings panel, goal replay timeline, and upgraded 2D pitch viewer (`src/components/match/MatchdayScreen.tsx`, `src/components/match/Pitch2DViewer.tsx`).
- [x] **G. Realistic 3D Football**: Human-proportioned articulated 3D footballers (head, hair cap, neck, jersey torso, shorts, shoulder/elbow arm rigs, hip/knee leg rigs, socks, boots) with skeletal limb animations (`idle`, `walk`, `run`, `sprint`, `pass`, `shoot`, `tackle`, `header`, `dive`, `celebrate`), full 3D pitch markings, cylindrical goalposts with nets, multi-tier roofed stands, dugouts, floodlights, and instanced crowd (`src/components/match3d/Pitch3DViewer.tsx`, `src/components/match3d/playerModelConfig.ts`).
- [x] **H. Cinematic Cutscenes**: Rich animated SVG/canvas stage scenes (`src/components/layout/CutsceneModal.tsx`) for manager unveiling, player signing (held-up jersey & flashbulbs), stadium tunnel walkout, dressing room tactical board talk, goal celebration, full-time whistle, and trophy podium with confetti.
- [x] **I. Fixtures & Competitions**: Club crests in league tables & fixtures, promotion/qualification & relegation zone highlights, and competition leaderboards (Top Scorers, Assist Leaders, Clean Sheets, Highest Avg Rating) (`src/components/management/ClubFinanceHistorySettingsScreens.tsx`).
- [x] **J. Loading & Error Recovery**: 3.5-second IndexedDB timeout guard, loading progress bar, retry button, automatic save-slot fallback, and fresh career recovery (`src/store/useGameStore.ts`, `src/app/page.tsx`).
