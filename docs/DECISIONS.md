# Architectural & Product Decisions (`DECISIONS.md`)

This log records key technical and design decisions made autonomously during the development of **Ultimate Football Manager**.

## 1. Framework & Vercel Compatibility
- **Decision**: Use Next.js (App Router) with static/client-heavy rendering for the game shell and zero server-side state requirements by default.
- **Why**: The game must deploy seamlessly on Vercel out-of-the-box with zero required environment variables, while supporting optional Supabase cloud saves when configured.

## 2. Deterministic Simulation Engine (`/src/engine`)
- **Decision**: Isolate all football rules, data generation, match simulation, transfer AI, training, and season progression inside `/src/engine` as pure TypeScript functions using `mulberry32` seeded PRNG.
- **Why**: Guarantees 100% determinism (`simulateMatch(input, seed)` always produces the exact same `MatchResult` and `MatchEvent[]`), enables fast unit testing (1,000+ matches in seconds in Vitest), and allows running heavy seasonal calculations inside a Web Worker without blocking the UI.

## 3. Event-Driven Match Viewing (Text, 2D, 3D)
- **Decision**: `simulateMatch` computes the full `MatchEvent[]` timeline upfront (including dense keyframe coordinates `ballPosition` and `playerPositions` snapshots for all 22 players on pitch). Text mode, 2D Canvas mode, and 3D React Three Fiber mode are pure consumers/interpolators of `MatchEvent[]`.
- **Why**: Ensures the scoreline and events are identical whether watched in Instant, Text, 2D, or 3D mode. When a manager makes a live substitution or tactical change at minute `M`, `resimulateFromMinute(input, seed, existingEventsUpToM, minuteM, updatedConfig)` preserves all events up to `M` and deterministically simulates minutes `M..90` using a derived seed `seed ^ (minuteM * 2654435761)`.

## 4. Persistence Architecture (`SaveRepository`)
- **Decision**: Implement `SaveRepository` with two adapters:
  1. `IndexedDBSaveRepository` (default, zero-config, supports `autosave` + 3 manual slots + JSON file export/import).
  2. `SupabaseSaveRepository` (automatically enabled if `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are provided, falling back gracefully to IndexedDB if offline or unconfigured).
- **Why**: Satisfies the requirement that career progress never lives solely in React state and persists across browser reloads without requiring external keys.

## 5. Procedural Web Audio & Low-Poly 3D Assets
- **Decision**: Build a procedural Web Audio API synthesizer (`/src/lib/audio.ts`) for crowd ambience, goal roars, referee whistles, ball kicks, and UI clicks, and procedural articulated low-poly 3D player meshes configurable via `/src/components/match3d/playerModelConfig.ts`.
- **Why**: Eliminates broken external asset links, guarantees 100% CC0/original licensing compliance, keeps bundle size fast for Vercel deployment, and allows swapping character meshes via a single configuration file.
