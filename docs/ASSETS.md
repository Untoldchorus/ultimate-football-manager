# Asset & Licensing Registry (`ASSETS.md`)

All visual, 3D, and audio assets in **Ultimate Football Manager** are 100% original, procedural, or open-source MIT/CC0:

## 1. Club Names, Badges, Stadiums & Players
- **Licence**: 100% Original Fictional Content (Created specifically for this project).
- **Details**: All 20 clubs (`Northgate Albion`, `Port Royale Athletic`, `Vulcan United`, etc.), stadium names, kit hex colours, and the 500+ deterministically generated player names are fictional and free of any third-party trademarks or real-world football licences.

## 2. 2D & 3D Stadium & Player Models
- **Licence**: 100% Original Procedural Geometry (`/src/components/match/Pitch2DViewer.tsx` and `/src/components/match3d/Pitch3DViewer.tsx`).
- **Details**:
  - 2D pitch markings, player tokens, and ball trajectories are rendered using native SVG elements.
  - 3D stadium turf, stands, floodlight towers, goal nets, instanced crowd, and articulated low-poly player meshes are constructed procedurally at runtime via Three.js primitives configured by `/src/components/match3d/playerModelConfig.ts`.

## 3. Audio & Sound Effects
- **Licence**: 100% Original Procedural Web Audio API Synthesis (`/src/lib/audio.ts`).
- **Details**:
  - Referee whistles, ball kicks, stadium crowd goal cheers, and menu clicks are synthesized in real-time using `AudioContext` oscillators and bandpass-filtered noise buffers. No external `.mp3` or `.wav` files are bundled.

## 4. Icons
- **Library**: `lucide-react` (`0.475.0`)
- **Licence**: ISC / MIT Open Source Licence.
