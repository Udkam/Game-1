# TIDE//RELAY Acceptance Matrix

## Rules

- Same seed produces identical sections, turns, events, RNG state, and replay hash.
- Lane changes remain in bounds and turn-window priority prevents accidental lane movement.
- Jump arc rises, peaks, falls, and lands exactly; beam and gap thresholds agree with posture.
- Slide duration and collision volume agree; rings are safe only during the active slide.
- Columns require another lane.
- Correct turns advance once; wrong or missing turns fail with the correct reason.
- Shards and shields collect once; a shield absorbs exactly one non-gap obstacle and applies deterministic recovery/chase pressure.
- Pause freezes all canonical state; restart resets clocks, input, score, consumed events, and course.
- Generator fairness checks reject impossible patterns.
- Safe travel opens the bounded canonical pursuer gap; shielded and unshielded non-gap stumbles close it; repeated misses can reach a command-reproducible capture at the threshold.
- Every 250 m milestone emits once, displays the canonical whole-meter boundary, and never alters replay determinism.
- Stored QA traces retain their accepted public-command sequence and replay hash. The milestone, close-chase, beam, ring, column, and gap records must expose that proof alongside the rendered canonical snapshot.

## Runtime and input

- Fixed-step simulation is independent of display refresh rate and caps catch-up work.
- Real keyboard and touch gestures each emit one semantic action.
- CSS-pixel swipe thresholds behave identically at DPR1 and DPR3.
- UI button presses cannot leak into the gesture surface.
- Blur and hidden documents pause active play without resuming an already-paused run.
- Unmount removes listeners, animation frames, WebGL resources, and audio voices.

## Visual evidence

- 1440 x 900 DPR1 ready screen.
- 1440 x 900 running scene with readable three-lane route and HUD.
- Lane-change midpoint, jump apex, slide midpoint, and turn midpoint.
- Real collision/game-over and pause/high-contrast states.
- 390 x 844 DPR3 portrait touch run.
- 844 x 390 DPR3 landscape touch run.
- Reduced-motion run with setting still enabled.

## Browser hard gates

- Exactly one WebGL canvas and zero gameplay DOM entities.
- No horizontal overflow; HUD and controls remain inside safe areas.
- Runner lane endpoint error is at most 0.01 world unit.
- Turn midpoint shows both incoming and outgoing route geometry.
- Obstacles remain visually distinct in normal, mobile, and high-contrast contexts.
- The HUD's structured score, floored distance, shards, and flow values exactly equal the canonical snapshot values.
- The close-chase scenario reports clipped pursuer bounds with meaningful positive visible area, not only an in-viewport center point.
- Beam, ring, column, and gap evidence each reports the expected canonical kind and positive clipped CSS-pixel bounds; the combined fixed desktop/mobile/high-contrast matrix proves all four silhouettes.
- Milestone, close-chase, and hazard-preview evidence states replay from real public commands to the recorded canonical hash; direct state fabrication is a hard failure.
- The milestone scenario visibly renders both the exact canonical score and `250 m`.
- The articulated runner retains readable leg/arm action under normal motion and semantic jump/slide poses under reduced motion.
- Console errors, unhandled rejections, and WebGL context loss count are zero.
- Every screenshot has seed, tick, viewport, DPR, state/render snapshot, and SHA-256 evidence.
- Scene-preparation CPU p95 is below 8 ms desktop and 12 ms mobile.

## Current result

Result: **TR2 accepted.**

- Final verification: `npm.cmd run typecheck`, `npm.cmd run test` (11 files / 47 tests), and `npm.cmd run build` passed. The build's only advisory is Vite's non-blocking 500 kB chunk warning.
- Official Chrome 150.0.7871.115 evidence pass produced 23 records and 19 screenshots. Every capture recorded one canvas, zero gameplay DOM entities, no horizontal overflow, zero console/page errors, zero context losses, and render budgets no higher than 56 draw calls / 9,040 triangles.
- Exact HUD comparison passed for every capture. The 250 m milestone record has replay hash `78bd1dc3`, score 5,101, distance 250.0899 m, flow 2, one shard, and a visible `250 m` callout.
- The public-command close-chase record has replay hash `fa85830e`, canonical `chaseGap` 1.194 m, and pursuer clipped visible area 64,374.2 CSS px². Beam/ring/column/gap previews expose matching canonical kinds and positive clipped areas of 18,510.5 / 25,497.2 / 2,952.2 / 29,607.6 CSS px².
- Desktop and mobile scene-preparation p95 values are both 0.10 ms, within the 8 ms and 12 ms limits. Keyboard and DPR3 CDP touch evidence each show one semantic input event.
- Evidence manifest: `docs/qa/temple-browser-evidence.json`; reviewed captures: `docs/screenshots/temple/final/milestone.png`, `docs/screenshots/temple/final/chase-close.png`, `docs/screenshots/temple/final/gap-preview.png`, and `docs/screenshots/temple/final/ring-preview.png`.

TR1 evidence remains historical only; this candidate's counts, screenshots, command traces, and hashes are the sole TR2 evidence.

Independent QA accepted candidate `c5b3db041175c19c71bd0086baf1e034fc97caf0` in log-only commit `b974810fc4b0ba93fb5ed7d6012e22c67b0606a5`. QA reproduced clean install, typecheck, the complete 11-file / 47-test suite, and build; matched all 19 PNG hashes; and independently audited the 23 structured browser records, rules, public-command traces, canonical HUD, pursuer visibility, obstacle bounds, cleanup, input, and reduced-motion behavior. Its isolated fresh-capture attempt generated no artifacts after one safe retry; that environment-only limitation is recorded in the QA log and is not presented as fresh browser evidence.

Acceptance freezes this commit as the stable TR2 rules/engine baseline. It does not approve the separate visual-restart design work or authorize production visual changes.
