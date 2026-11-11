# Ultimate Football Manager — Milestone Plan

This document tracks the project roadmap and milestone checklist from M1 through M6.

## Operating Loop & Gate Criteria
- Inspect workspace & maintain `docs/PLAN.md`, `docs/STATUS.md`, `docs/DECISIONS.md`, `docs/ARCHITECTURE.md`, and `docs/DEPENDENCIES.md`.
- Every milestone must pass:
  1. `npm run lint`
  2. `npm test`
  3. `npm run build`
  4. Real browser walkthrough & verification
  5. Git commit for the milestone

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
- [x] Procedural low-poly articulated players with animation states (`idle`, `walk`, `run`, `sprint`, `pass`, `shoot`, `tackle`, `header`, `dive`, `celebrate`) swappable via a single config file (`src/components/match3d/playerModelConfig.ts`)
- [x] 4 Camera angles: Broadcast, Tactical Overhead, Follow-Ball, Goal Replay
- [x] Graphics quality settings: Low / Medium / High, lazy-loaded 3D canvas, proper disposal to prevent memory leaks
- [x] Driven strictly by `MatchEvent[]` snapshots & interpolation (never re-rolls outcome)

## M5: Cutscenes and Audio
- [x] Skippable, event-triggered cinematic overlays/scenes: Goal celebration, Full-time whistle, Trophy presentation, Player signing, Manager introduction, Tunnel walkout, Pre-match talk, Half-time dressing room, Red card & Missed penalty reactions, League championship celebration
- [x] Web Audio API procedural sound synthesiser (crowd roar, goal cheer, referee whistle, ball kick, menu clicks) activated strictly after user interaction, with master volume, mute, and category sliders
- [x] `docs/ASSETS.md` documenting 100% original / procedural / CC0 assets

## M6: Hardening and Release
- [x] Responsive layout pass for Desktop, Tablet, and Mobile (touch-friendly navigation & controls)
- [x] Accessibility: keyboard navigation, ARIA labels, high contrast, `prefers-reduced-motion` support
- [x] Error boundaries, loading skeletons, and pagination for large player tables
- [x] Supabase optional cloud persistence adapter + `supabase/migrations/001_initial_schema.sql` (18 tables with RLS) + `supabase/seed.sql` + `.env.example`
- [x] Comprehensive `README.md` with architecture, controls, testing, and Vercel deployment instructions
