# TIDE//RELAY Acceptance Matrix

## Rules

- Same seed produces identical sections, turns, events, RNG state, and replay hash.
- Lane changes remain in bounds and turn-window priority prevents accidental lane movement.
- Jump arc rises, peaks, falls, and lands exactly; beam and gap thresholds agree with posture.
- Slide duration and collision volume agree; rings are safe only during the active slide.
- Columns require another lane.
- Correct turns advance once; wrong or missing turns fail with the correct reason.
- Shards and shields collect once; a shield absorbs exactly one hazard.
- Pause freezes all canonical state; restart resets clocks, input, score, consumed events, and course.
- Generator fairness checks reject impossible patterns.

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
- Console errors, unhandled rejections, and WebGL context loss count are zero.
- Every screenshot has seed, tick, viewport, DPR, state/render snapshot, and SHA-256 evidence.
- Scene-preparation CPU p95 is below 8 ms desktop and 12 ms mobile.

## Verified result

Result: **passed for the scoped single-environment vertical slice**.

- Clean install: `npm.cmd ci --no-audit --no-fund` installed 65 locked packages successfully.
- Typecheck: passed after the clean install.
- Tests: 9 files / 37 tests passed.
- Production build: passed. Vite reports a non-blocking large-chunk advisory for the Three.js application bundle.
- Browser: Chrome 150.0.7871.115, 17 evidence records.
- Visual captures: 13/13 passed at desktop DPR1, mobile DPR3 portrait/landscape, high contrast, reduced motion, exact lane endpoint, and outgoing-turn lane change.
- DOM: one WebGL canvas, zero gameplay DOM entities, zero horizontal overflow in every capture.
- Runtime: zero console warnings/errors, zero page errors, and zero WebGL context losses.
- Render budget: 28–31 draw calls and 5,390–5,914 triangles across the captured scenes.
- Scene preparation desktop: 180 samples, 0.045 ms mean, 0.10 ms p95, 0.30 ms max on the verification machine.
- Scene preparation mobile context: 180 samples, 0.078 ms mean, 0.20 ms p95, 0.60 ms max.
- Input: real keyboard left/jump/pause and a real CDP-dispatched DPR3 touch swipe produced the expected canonical state and one-event semantic traces.
- Determinism: the same fixed running scenario retained one simulation hash across desktop, portrait, landscape, and reduced-motion contexts.
- Presentation integrity: every frozen capture records seed `1414087749`, canonical/previous distances, `presentationAlpha=1`, renderer options, safe-area rectangles, and matching canonical/presented lane values. Lane endpoint error is 0.

Evidence manifest: `docs/qa/temple-browser-evidence.json`.

Representative captures:

- `docs/screenshots/temple/final/ready-desktop.png`
- `docs/screenshots/temple/final/running-desktop.png`
- `docs/screenshots/temple/final/turn-mid.png`
- `docs/screenshots/temple/final/turn-lane-change.png`
- `docs/screenshots/temple/final/lane-end.png`
- `docs/screenshots/temple/final/mobile-portrait.png`
- `docs/screenshots/temple/final/collision.png`

The result intentionally does not claim Temple Run's full commercial content set. It validates the classic third-person endless-runner grammar, a deterministic fair course, complete obstacle/turn/input rules, and the original TIDE//RELAY presentation specified by this branch.
