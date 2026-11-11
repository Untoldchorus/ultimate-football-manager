# System Architecture (`ARCHITECTURE.md`)

## 1. Directory Structure

```text
/
├── docs/
│   ├── ARCHITECTURE.md       # System design, core types, MatchEvent schema, save format
│   ├── ASSETS.md             # Licensing & procedural asset registry
│   ├── DECISIONS.md          # Autonomous engineering decisions log
│   ├── DEPENDENCIES.md       # Pinned dependencies with 1-line justifications
│   ├── PLAN.md               # Milestone checklist (M1–M6)
│   └── STATUS.md             # Current milestone status & resumption guide
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql  # 18 tables + Row-Level Security (RLS)
│   └── seed.sql              # Optional initial seed data for Supabase
├── src/
│   ├── engine/               # Pure TypeScript (NO React, NO DOM, NO Math.random, NO Date.now)
│   │   ├── types.ts          # Core domain types, MatchEvent, GameState, SaveEnvelope
│   │   ├── rng.ts            # Seeded mulberry32 PRNG utilities
│   │   ├── ratings.ts        # Position-specific OVR calculation & lineup validation
│   │   ├── generator.ts      # Deterministic generator (20 clubs, 500 players, staff, youth)
│   │   ├── fixtures.ts       # Double round-robin & knockout cup fixture generator
│   │   ├── standings.ts      # League table calculation & tie-breakers
│   │   ├── matchEngine.ts    # simulateMatch(input, seed) & mid-match re-simulation
│   │   ├── commentary.ts     # Template-based commentary generator from MatchEvent[]
│   │   ├── transfers.ts      # Valuation, wage/offer negotiation, weekly AI transfer market
│   │   ├── training.ts       # Weekly training sessions, attribute growth caps, fatigue/injury
│   │   ├── scouting.ts       # Scout assignments & report accuracy/potential ranges
│   │   ├── youth.ts          # Youth academy intake, development, promotion
│   │   ├── finances.ts       # Weekly income/expenses, budgets, prize money
│   │   ├── board.ts          # Board objectives, confidence rating, player morale & expectations
│   │   ├── season.ts         # Weekly advance loop, cup draws, promotion/relegation, rollover
│   │   └── migrations.ts     # Save version schema validation & migration functions
│   ├── workers/
│   │   └── simWorker.ts      # Web Worker wrapper for multi-match/season & AI transfer simulation
│   ├── services/
│   │   ├── saveRepository.ts # SaveRepository interface, IndexedDB & optional Supabase adapters
│   │   └── workerClient.ts   # Async client for Web Worker with synchronous fallback for tests
│   ├── store/
│   │   └── useGameStore.ts   # Zustand state store synced with SaveRepository autosave
│   ├── lib/
│   │   └── audio.ts          # Web Audio API procedural sound effects & crowd synth
│   ├── components/
│   │   ├── layout/           # AppShell, Sidebar, TopBar, ErrorBoundary, CutsceneModal
│   │   ├── squad/            # InteractivePitch, PlayerList, PlayerDetailModal
│   │   ├── match/            # MatchCenter, TextCommentaryView, Pitch2DCanvas, LiveTacticsPanel
│   │   └── match3d/          # Pitch3DCanvas (R3F), StadiumScene, PlayerMesh, playerModelConfig.ts
│   └── app/                  # Next.js App Router pages & layouts
└── tests/
    ├── unit/                 # Vitest unit & 1,000-match realism suites
    └── e2e/                  # Playwright browser smoke & walkthrough tests
```

---

## 2. Core Types & `MatchEvent` Schema

All match simulations produce a deterministic `MatchResult` containing an ordered `MatchEvent[]`:

```ts
export type MatchEventType =
  | 'kickoff'
  | 'pass'
  | 'throughBall'
  | 'cross'
  | 'shot'
  | 'save'
  | 'goal'
  | 'tackle'
  | 'interception'
  | 'foul'
  | 'yellowCard'
  | 'redCard'
  | 'corner'
  | 'freeKick'
  | 'penalty'
  | 'injury'
  | 'substitution'
  | 'halfTime'
  | 'fullTime';

export interface Vector2D {
  x: number; // 0..100 (left to right pitch length, 0 = home goal, 100 = away goal)
  y: number; // 0..100 (top to bottom pitch width, 50 = center)
}

export interface PlayerPositionSnapshot {
  playerId: string;
  teamId: string;
  x: number;
  y: number;
  action?: 'idle' | 'walk' | 'run' | 'sprint' | 'pass' | 'shoot' | 'tackle' | 'header' | 'dive' | 'celebrate';
}

export interface MatchEvent {
  id: string;
  minute: number;
  second: number;
  type: MatchEventType;
  teamId: string;
  playerId?: string;
  secondaryPlayerId?: string;
  ballPosition: Vector2D;
  playerPositions?: PlayerPositionSnapshot[];
  outcome: 'success' | 'fail' | 'neutral';
  metadata?: {
    commentary?: string;
    homeScore?: number;
    awayScore?: number;
    xg?: number;
    onTarget?: boolean;
    cardReason?: string;
    injuryWeeks?: number;
    subInId?: string;
    subOutId?: string;
  };
}
```

### Single Source of Truth Viewing Rule
- `simulateMatch(input, seed)` generates the entire match timeline (`MatchEvent[]`) and final score once.
- **Text Mode**, **2D Mode**, and **3D Mode** strictly replay `MatchEvent[]` up to the current playback clock `(minute, second)`.
- Live tactical changes or substitutions during playback invoke `resimulateMatchFromMinute(...)`, which freezes events before `currentMinute` and deterministically simulates the remaining minutes using the modified tactics/lineup.

---

## 3. Save Format & Migration Architecture

```ts
export const CURRENT_SAVE_VERSION = 1;

export interface SaveEnvelope {
  saveVersion: number;
  slotId: 'autosave' | 'slot1' | 'slot2' | 'slot3';
  savedAtIso: string; // Passed from UI layer at save time
  managerName: string;
  clubName: string;
  seasonYear: number;
  currentWeek: number;
  state: GameState;
}
```
- `migrateSaveState(raw: unknown): GameState` inspects `saveVersion` and applies sequential pure migration functions (`v0 -> v1`, etc.) so older browser saves never crash newer builds.

---

## 4. Web Worker Usage
- `/src/workers/simWorker.ts` runs background computations off the main UI thread:
  - Simulating AI vs AI matches on matchday
  - Running weekly AI transfer market activity
  - Running full-season bulk simulations
- `/src/services/workerClient.ts` dispatches messages to the Web Worker when running in the browser and falls back cleanly to direct execution in Node/Vitest environments.
