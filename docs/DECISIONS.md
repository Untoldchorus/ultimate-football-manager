# Architecture & Technical Decisions

## 1. Dual Render Path (Path A: Cinematic HD + Path B: Live WebGL2)
- **Decision**: Support two render paths from one set of Godot 4.3 scenes:
  - **Path A (Cinematic HD)**: Offline Movie Maker (`--write-movie`) using Forward+ at `1920x1080` (30 fps), encoded via `ffmpeg` to VP9 `.webm` + H.264 `.mp4` + `.jpg` poster under a **12 MB** per-clip budget, indexed in `public/cutscenes/manifest.json`.
  - **Path B (Live)**: Godot 4.3 Web export using `gl_compatibility` (WebGL2) with Low/Medium/High quality ladder.
- **Fallback Chain in React**: `Cinematic (pre-rendered video)` → `Live (Godot WebGL2)` → `Lightweight static-art + HTML/CSS CutsceneModal`.

## 2. Single-Threaded Godot Web Export (No COOP/COEP Required)
- **Decision**: Keep `variant/thread_support=false` in `godot/export_presets.cfg`.
- **Rationale**: Multi-threaded Godot Web exports require `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` headers, which would block third-party open-licensed Wikimedia Commons player photos in `PlayerAvatar`. Single-threaded export works cleanly on Vercel without breaking external images.

## 3. Canonical `snake_case` Cutscene IDs with `camelCase` Aliases
- **Decision**: Standardize all cutscene IDs to `snake_case` (`manager_intro`, `stadium_entrance`, `tunnel_walkout`, `pre_match_talk`, `goal_celebration`, `half_time_talk`, `red_card_reaction`, `missed_penalty`, `full_time`, `player_signing`, `trophy_presentation`, `league_championship`, `career_milestone`) while preserving `camelCase` aliases in TypeScript (`CutsceneType` / `LEGACY_CUTSCENE_ALIAS_MAP`) so existing saves and UI calls never break.

## 4. Dynamic Overlays in HTML/CSS
- **Decision**: Never bake player names, scores, minutes, or subtitles into pre-rendered videos. Render them as synchronized HTML/CSS overlays in `CutsceneModal.tsx` driven by `cues` in `public/cutscenes/manifest.json`.
