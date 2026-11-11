# Dependencies (`DEPENDENCIES.md`)

Every production and development dependency is pinned to an exact version with a one-line justification:

## Production Dependencies
- `next` (`15.2.3`): React framework with App Router optimized for Vercel deployment.
- `react` (`19.0.0`): Core declarative UI library for component rendering.
- `react-dom` (`19.0.0`): DOM bindings for React components.
- `zustand` (`5.0.3`): Lightweight state management store connecting UI to the deterministic engine and `SaveRepository`.
- `lucide-react` (`0.475.0`): Clean, open-source vector icons for sports management navigation and pitch controls.
- `three` (`0.173.0`): Core WebGL 3D rendering engine for the M4 3D stadium and match viewer.
- `@react-three/fiber` (`9.0.4`): Declarative React renderer for Three.js scene graphs in M4.
- `@react-three/drei` (`10.0.4`): Utility helpers (cameras, perspective controls, environment) for React Three Fiber in M4.
- `@supabase/supabase-js` (`2.49.1`): Optional client for cloud save persistence when Supabase credentials are configured.

## Development Dependencies
- `typescript` (`5.8.2`): Strict static typing across `/src/engine` and UI layers.
- `@types/node` (`22.13.10`): TypeScript definitions for Node.js tooling and config files.
- `@types/react` (`19.0.10`): TypeScript definitions for React 19.
- `@types/react-dom` (`19.0.4`): TypeScript definitions for React DOM 19.
- `@types/three` (`0.173.0`): TypeScript definitions for Three.js 3D types.
- `tailwindcss` (`3.4.17`): Utility-first CSS framework for the custom dark navy, pitch-green, and trophy-gold design system.
- `postcss` (`8.5.3`): CSS transformation pipeline required by Tailwind CSS.
- `autoprefixer` (`10.4.21`): Adds vendor prefixes automatically during CSS builds.
- `eslint` (`9.22.0`): Static code analysis to catch bugs and enforce code quality.
- `eslint-config-next` (`15.2.3`): Official Next.js ESLint ruleset.
- `vitest` (`3.0.8`): Fast unit testing runner for `/src/engine` determinism and 1,000-match realism suites.
- `@playwright/test` (`1.51.0`): End-to-end headless browser testing for walkthrough gates and smoke tests.
- `fake-indexeddb` (`6.0.0`): In-memory IndexedDB polyfill for testing `IndexedDBSaveRepository` round-trips in Vitest.
