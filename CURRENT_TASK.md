# Current Task

## Accepted slice: TR2 — Humanized runner refinement

Branch: `codex/temple-run`

Status: accepted. Candidate `c5b3db041175c19c71bd0086baf1e034fc97caf0` passed independent QA in log-only commit `b974810fc4b0ba93fb5ed7d6012e22c67b0606a5` and was integrated by the coordinator.

The next visual-restart activity is design-only. It may study and prototype a more distinctive mobile-first presentation, runner gait, pursuer pressure, obstacle language, HUD, and milestone composition, but it has no authority to modify production code until its design candidate is reviewed and a bounded implementation slice is approved.

### Required outcome

Refine the existing complete third-person runner without changing its clean-room boundary:

- deterministic procedural course generation and replayable simulation state
- continuous acceleration and three-lane movement
- jump, slide, correct/incorrect 90-degree turns, gaps, blockers, pickups, and shield
- fair generation with reaction-distance validation
- distance, score, shards, multiplier, best score, pause, restart, and game over
- fixed-step runtime and smooth interpolated Three.js presentation
- runner animation, chase pressure, camera follow, turn camera, impacts, and procedural audio
- keyboard, real one-finger swipe, and visible accessible controls
- responsive desktop, portrait, and landscape layouts
- reduced motion, high contrast, audio toggle, and lifecycle cleanup
- unit tests, deterministic replay tests, build, browser interaction, screenshots, and performance evidence
- canonical visible pursuit pressure, 250 m milestone events, score-first HUD hierarchy, articulated gait, organic ruin palette, and distinct obstacle silhouettes
- recoverable non-gap stumbles that deterministically close pursuit distance, with repeated misses leading to a reachable pursuer capture
- milestone, close-chase, beam, ring, column, and gap QA states reproduced exclusively from public command traces
- browser assertions for exact HUD values, pursuer clipped bounds/area, and per-kind obstacle clipped bounds

### Non-goals

- copied Temple Run branding, characters, monsters, art, music, UI, screenshots, or source
- shops, ads, accounts, purchases, online leaderboards, unlock trees, or multiple environments
- importing implementation from `codex/tetris`
- shipping another game mode before TR1 acceptance

### Completion gate

TR2 is complete only after typecheck, one final full test suite, production build, desktop keyboard play, mobile touch/swipe play, pause/blur/visibility checks, deterministic chase/milestone/turn/jump/slide/collision scenarios, screenshot review, console inspection, resource cleanup, and performance evidence pass.

### Completion evidence

- Final typecheck passed: `npm.cmd run typecheck`.
- Final Vitest suite passed: 11 files, 47 tests.
- Production build passed: `npm.cmd run build`. Vite emitted only its non-blocking 500 kB chunk advisory.
- Official Chrome 150.0.7871.115 evidence pass recorded 23 records in `docs/qa/temple-browser-evidence.json`, with 19 final screenshots, zero console/page errors, zero WebGL context losses, one canvas, zero gameplay DOM entities, and no horizontal overflow.
- The command-derived milestone state replayed to `78bd1dc3` at 250.0899 m with score 5,101, floored HUD distance 250, flow 2, one shard, and the visible `250 m` callout. The command-derived close chase replayed to `fa85830e` with `chaseGap` 1.194 m and pursuer clipped area 64,374.2 CSS px².
- Command-derived beam/ring/column/gap previews replayed to their recorded hashes with positive clipped areas of 18,510.5 / 25,497.2 / 2,952.2 / 29,607.6 CSS px². Each record retains its full accepted public-command trace and matching replay hash.
- Scene preparation benchmarks: desktop p95 0.10 ms (limit 8 ms), mobile p95 0.10 ms (limit 12 ms). Real keyboard left/jump/pause and real DPR3 touch swipe each produced one semantic action trace.
- Visual review completed against `milestone.png`, `chase-close.png`, `gap-preview.png`, and `ring-preview.png` under `docs/screenshots/temple/final/`. They show the canonical HUD, visible close pursuers, readable gap lips/far edge, and mobile ring silhouette.
- Independent QA reproduced the clean install, typecheck, complete 11-file / 47-test Vitest suite, and production build; independently audited all 23 evidence records and all 19 committed PNG hashes; and accepted the rule, input, cleanup, reduced-motion, canonical replay, pursuer, HUD, and obstacle gates. Its isolated fresh capture attempt produced no new artifacts after one safe retry, so the accepted QA log records that environment limitation rather than overstating fresh-capture coverage.
