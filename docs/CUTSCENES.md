# Ultimate Football Manager — Cutscenes Architecture & Shot Lists

## 1. Existing System Audit (Pre-Upgrade)
- **Next.js `CutsceneType`**: 11 `camelCase` types (`managerIntro`, `tunnelWalkout`, `preMatchTalk`, `goalCelebration`, `halfTimeTalk`, `redCardReaction`, `missedPenalty`, `fullTime`, `playerSigning`, `trophyPresentation`, `leagueChampionship`).
- **`CutsceneModal.tsx`**: Fullscreen React modal with SVG/CSS animations, skip button, and auto-close timer.
- **`CutsceneDirector.gd`**: Basic stub supporting `play_cutscene`, `pause_cutscene`, `resume_cutscene`, `skip_cutscene`.
- **`project.godot` & `export_presets.cfg`**: Godot 4.3 (`GL Compatibility`), `1920x1080`, single-threaded Web export targeting `../public/godot/match_viewer.html`.

## 2. Canonical Cutscene Registry (13 Scenes)

| Canonical ID | React Alias | Godot Alias | Trigger | Target Length |
|---|---|---|---|---|
| `manager_intro` | `managerIntro` | `manager_intro` | New career created | 12–15 s |
| `stadium_entrance` | *(new)* | `matchday_intro` | Matchday begins | 8–10 s |
| `tunnel_walkout` | `tunnelWalkout` | `matchday_intro` | Before kickoff | 10–12 s |
| `pre_match_talk` | `preMatchTalk` | *(new)* | Before kickoff, optional | 8–10 s |
| `goal_celebration` | `goalCelebration` | `goal_celebration` | `goal` MatchEvent | 4–6 s |
| `half_time_talk` | `halfTimeTalk` | `half_time` | `halfTime` event | 8–10 s |
| `red_card_reaction` | `redCardReaction` | *(new)* | `redCard` event | 4–5 s |
| `missed_penalty` | `missedPenalty` | *(new)* | Penalty saved/missed | 4–5 s |
| `full_time` | `fullTime` | `full_time` | `fullTime` event | 8–10 s |
| `player_signing` | `playerSigning` | `player_signing` | Transfer completed | 10–12 s |
| `trophy_presentation` | `trophyPresentation` | `trophy_ceremony` | Cup won | 12–15 s |
| `league_championship` | `leagueChampionship` | `trophy_ceremony` | League won at season end | 15–20 s |
| `career_milestone` | *(new)* | `career_milestone` | Achievements / milestones | 6–8 s |

## 3. Shot Lists (6 Priority Scenes + Remaining 7)

### `goal_celebration` (5.0 s)
1. **Shot 1 (0.0–1.5 s)**: Low-angle dolly-in on scorer performing knee slide (`knee_slide`). Audio: crowd roar + goal horn.
2. **Shot 2 (1.5–3.2 s)**: Orbiting medium shot as teammates sprint in (`hug`, `fist_pump`).
3. **Shot 3 (3.2–5.0 s)**: Wide crane shot up toward home stand with confetti/flares (`GPUParticles3D`).

### `full_time` (9.0 s)
1. **Shot 1 (0.0–2.5 s)**: Referee center-circle whistle blow (`whistle`).
2. **Shot 2 (2.5–5.5 s)**: Tracking shot of winning players applauding fans (`clap`, `fist_pump`) vs losing players (`disappointed`).
3. **Shot 3 (5.5–9.0 s)**: Wide stadium crane pull-back.

### `trophy_presentation` (13.5 s)
1. **Shot 1 (0.0–3.5 s)**: Dolly along podium as players receive medals (`handshake`).
2. **Shot 2 (3.5–7.5 s)**: Close-up crane on captain lifting trophy (`trophy_lift`).
3. **Shot 3 (7.5–13.5 s)**: Wide stadium orbit with confetti & fireworks (`GPUParticles3D`).

### `player_signing` (11.0 s)
1. **Shot 1 (0.0–3.5 s)**: Stadium exterior dolly-in.
2. **Shot 2 (3.5–7.5 s)**: Press room medium shot, player holding club shirt.
3. **Shot 3 (7.5–11.0 s)**: Close-up portrait flash & lower-third reveal.

### `manager_intro` (13.0 s)
1. **Shot 1 (0.0–4.0 s)**: Aerial stadium flyover (`PathFollow3D`).
2. **Shot 2 (4.0–8.5 s)**: Tunnel walkout to touchline.
3. **Shot 3 (8.5–13.0 s)**: Press conference podium shot.

### `tunnel_walkout` (10.5 s)
1. **Shot 1 (0.0–3.5 s)**: Atmospheric foggy tunnel tracking shot (`walk`).
2. **Shot 2 (3.5–7.0 s)**: Pitchside emerge into floodlights.
3. **Shot 3 (7.0–10.5 s)**: Lineup & handshake ceremony (`handshake`).
