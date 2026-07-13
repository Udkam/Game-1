# Changelog

## 2026-07-13 — TIDE//RELAY branch initialized

- Began the second game only after the Tetris branch was completed and pushed.
- Selected React, TypeScript, Vite, and Three.js for a real third-person WebGL runner rather than a DOM or flat-card imitation.
- Froze the clean-room product boundary, deterministic runner rules, original tidal-observatory visual system, responsive input contract, and browser acceptance matrix.
- Kept the branch independent from `codex/tetris` and the archived recursive-puzzle study.

## 2026-07-13 — TIDE//RELAY vertical slice completed

- Implemented a deterministic 60 Hz runner simulation with replay hashing, bounded catch-up, three-lane motion, jump, slide, 90-degree turns, gaps, beams, rings, columns, pickups, shields, scoring, multiplier, pause, restart, and game-over rules.
- Added seeded course generation with authored onboarding, reaction-distance fairness checks, deterministic fallback templates, and repeatable QA scenarios.
- Built the original storm-observatory presentation in Three.js: instanced causeways, turn platforms, meridian seams, readable lane guides, procedural obstacles, a rigged runner, chase pressure, particles, fog, responsive cameras, and reduced-motion/high-contrast variants.
- Added smooth lane interpolation, ballistic jump motion, dedicated slide/collision poses, a distance-derived Bezier turn path shared by the runner and camera, impact feedback, and procedural audio with autoplay-safe activation.
- Made post-corner lane changes continuous by applying interpolated lane displacement along the active turn yaw and returning to the canonical path without a stale endpoint frame.
- Made frozen QA frames render the canonical endpoint at alpha 1, and made reduced-motion mode freeze runner core, shield, pickup, mist, impact, camera-FOV, and decorative rotations.
- Added a React shell and accessible HUD for ready, running, paused, and failed states, including persisted best distance/score, audio/contrast settings, keyboard controls, pointer swipes, and responsive portrait/landscape layouts.
- Added strict-mode-safe lifecycle cleanup for animation frames, events, WebGL resources, audio voices, blur/visibility pause, and a development-only structured QA surface.
- Fixed late audit findings: all-lane obstacle geometry now matches collision rules; QA captures render canonical state endpoints; keyboard controls no longer swallow button activation; audio only primes from a user gesture; grounded footsteps exclude jumps/slides; horizon and turn geometry follow the route; mobile composition preserves forward visibility.
- Added a reproducible browser evidence script with a locked `playwright-core` driver and fail-closed assertions for canvas/DOM boundaries, console health, DPR caps, runner visibility, render budgets, deterministic hashes, real keyboard/touch input, turn continuity, and scene-preparation performance.
- Final verification passed: clean install of 65 locked packages; typecheck; 9 Vitest files / 37 tests; production build; 13 screenshots; 17 browser evidence records; zero console problems; zero WebGL context losses; 0.10 ms desktop and 0.20 ms mobile-context scene-preparation p95.

## 2026-07-14 — TR2 runner refinement accepted

- Reworked non-gap collisions into deterministic recoverable stumbles that close the canonical chase gap, while keeping gaps and invalid turns immediately fatal and making repeated misses reach a reproducible pursuer capture.
- Added command-derived milestone, close-chase, beam, ring, column, and gap QA scenarios with canonical replay hashes; no scenario mutates the simulation state directly.
- Refined the articulated runner, visible pursuer pressure, score-first HUD, 250 m milestone, organic ruin palette, and distinct obstacle silhouettes across desktop, portrait, landscape, high-contrast, and reduced-motion evidence.
- Extended browser evidence to 23 structured records and 19 hashed screenshots with exact HUD/state comparison, positive pursuer and per-obstacle clipped bounds, one canvas, zero gameplay DOM entities, zero console/page errors, and zero WebGL context losses.
- Final implementation verification passed: typecheck, 11 Vitest files / 47 tests, and production build; the only build advisory remains Vite's non-blocking chunk-size warning.
- Independent QA accepted candidate `c5b3db041175c19c71bd0086baf1e034fc97caf0` in log-only commit `b974810fc4b0ba93fb5ed7d6012e22c67b0606a5`. QA independently reproduced the clean install and code gates and matched every committed screenshot hash. A fresh isolated browser capture did not produce artifacts after one safe retry, so that limitation remains explicitly documented rather than hidden.
- Opened a separate design-only visual-restart study for a more distinctive mobile-first presentation. TR2 acceptance freezes the current rules and engine; it does not pre-approve those future visual changes.
