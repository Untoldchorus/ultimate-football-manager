# Ultimate Football Manager — Cutscene & 3D Engine Status

**Last Updated**: 2026-11-13  
**Environment Blocker**: `godot` / `godot4` binary and Web export templates are **not installed** on this Windows machine (`godot --version` not found). Offline Movie Maker rendering (`--write-movie`) and Godot Web `.wasm`/`.pck` export must be run on a machine with Godot 4.3 + ffmpeg installed.

## Phase Progress
- [x] **Phase 0/1 — Audit & Docs**: Inspected `CutsceneType`, `CutsceneModal.tsx`, `CutsceneDirector.gd`, `project.godot`, `export_presets.cfg`. Created `docs/CUTSCENES.md`, `docs/DECISIONS.md`, `docs/ASSETS.md`, `docs/STATUS.md`.
- [x] **Phase 2 — Shared Shaders**: Created `grass_stripe.gdshader`, `kit_colour.gdshader`, `crowd_sway.gdshader` in `godot/assets/shaders/`.
- [x] **Phase 3 — CutsceneDirector & CutsceneBase**: Implemented `CutsceneBase.gd`, upgraded `CutsceneDirector.gd` (state machine + queue + cues + cleanup), and created `godot/tools/render_cutscene.gd`.
- [x] **Phase 6 — Path A Render Pipeline & Manifest**: Created `tools/render_cutscenes.ps1`, `tools/render_cutscenes.sh`, and `public/cutscenes/manifest.json` (13 canonical cutscenes).
- [x] **Phase 7 — React Integration & Triggers**: Unified `CutsceneType` (13 canonical `snake_case` IDs + `camelCase` aliases), created `CutsceneTriggerService` (throttling, priority queue, fallback resolver) and `GodotCutsceneHost.tsx`.
- [x] **Phase 8 — Tests & Verification**: Added unit tests for manifest, trigger mapping, throttling, priority queue, and fallback resolver.
