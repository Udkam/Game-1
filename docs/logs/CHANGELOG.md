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
