# Tetris T4 Workstream Log

## 2026-07-15 — STARTED

- Task: `TETRIS-T4-LAYOUT-001`
- Base: `4c8582854088695ebac90467842dc2bc0cef3a20`
- Branch: `codex/tetris-recovery`
- Repository: `E:\Proj\Game-1-tetris`
- Scope: desktop/mobile presentation geometry only; accepted core rules and Puzzle data
  are frozen.
- Evidence required: targeted tests while editing, then coordinator-owned final
  typecheck/full suite/build/browser pass after the final source change.
- Blocker: none.
- Next: implement the bounded board-first layout correction.

## 2026-07-15 12:39:50 +08:00 — CANDIDATE_READY

- Task: `TETRIS-T4-LAYOUT-001`
- Base/HEAD: `4c8582854088695ebac90467842dc2bc0cef3a20` / `4c8582854088695ebac90467842dc2bc0cef3a20`
- Candidate: uncommitted bounded working-tree candidate; coordinator owns final gates,
  commit, and push.
- Exact write scope: `src/styles.css`, `src/App.tsx`, and this `THREAD_LOG.md`.
- Preserved dirty paths: coordinator-owned `AGENTS.md`, `DESIGN.md`,
  `CURRENT_TASK.md`, and `progress.md` were read but not edited by this task.
- Implementation: replaced the 718 px/306 px desktop caps with a viewport-height
  board scale; the measured board is 380 × 760 at 1440 × 900 and 460 × 920 at
  2048 × 1152. Desktop context/side rails and gaps scale with the cluster, the three
  complete Chinese mode names use a single non-wrapping typographic rail, and the
  five controls use a stacked glyph/label layout with 380–460 px total width.
- Responsive preservation: 390 × 844 remains 266 × 532 with 53.19 × 50 minimum
  controls; 844 × 390 remains 156 × 312 with 60 × 50 controls. The portrait control
  rail ends at 838.78 CSS px and is not clipped by the 844 px viewport.
- QA assertion correction: `pauseStripRatio` now measures
  `pause.height / board.height`; the browser probe reports 0.0711 and confirms the
  strip is inside the board. The prior area ratio was not the documented height gate.
- Commands actually run: Node `develop-web-game` client availability probe (blocked
  because this repository intentionally has no Node Playwright dependency); bounded
  Python Playwright/Chrome geometry and screenshot probes against local Vite on 5174;
  `npm.cmd run typecheck`; `git diff --check -- src/styles.css src/App.tsx`.
- Targeted evidence: all probed states report board ratio 2, one canvas, zero gameplay
  DOM cells, zero structural intersections, no viewport overflow, and zero captured
  console/page errors. Temporary screenshots are outside the repository under
  `C:\Users\Alex Chen\AppData\Local\Temp\tetris-t4-layout-targeted\` and are not
  formal candidate evidence.
- Deliberately not run: full Vitest, build, or formal browser evidence; the coordinator
  requested those once after the combined final source change.
- Visual risk: mode-switch, Puzzle select/play, terminal strips, reduced motion, and
  DPR 3 are not formalized by this targeted pass and still require the coordinator's
  final multi-state browser matrix.
- Blocker: none within the bounded layout slice.
- Next: coordinator reviews this working-tree candidate and runs the one final combined
  verification/evidence pass if accepted.

## 2026-07-15 12:47:30 +08:00 — READY_FOR_QA

- Task: `TETRIS-T4-LAYOUT-001`.
- Base: `4c8582854088695ebac90467842dc2bc0cef3a20` on
  `codex/tetris-recovery` in `E:\Proj\Game-1-tetris`.
- Exact product delta: `src/styles.css` and `src/App.tsx`; repository contracts,
  this log, `progress.md`, one repeatable T4 capture wrapper, and T4 evidence are
  the only supporting paths.
- Final gates run exactly once after the last product change:
  `npm.cmd run typecheck` passed; `npm.cmd run test` passed 36 files / 234 tests;
  `npm.cmd run build` passed; `git diff --check` passed.
- Final browser pass: `docs/qa/evidence/tetris-t4/browser-evidence.json` reports
  19 captures across 1440 × 900, 2048 × 1152, 390 × 844 DPR3,
  844 × 390 DPR3, and 360 × 800 DPR3. It covers ready, playing, paused,
  mode-switch, Puzzle select/play/success/failure, malformed progress, keyboard,
  touch, and canonical unlock behavior.
- Geometry: board sizes are 380 × 760 at 1440 × 900, 460 × 920 at
  2048 × 1152, 266 × 532 in portrait, and 156 × 312 in landscape. All captures
  report one canvas, zero gameplay DOM cells, zero structural intersections,
  no overflow, no captured console/page errors, and board ratio 2.
- Pause: `pauseStripRatio` is now the documented height ratio; measured values
  are 0.0711 at 1440, 0.0587 at 2048, and below the 0.18 gate in portrait.
- Manual screenshot review: the uploaded tiny 306 × 612 desktop composition is
  replaced by a board-first 380/460 px desktop composition; complete Chinese
  mode/control labels no longer overlap. The intentionally restrained Mineral
  Shelf art direction remains; this slice does not claim a new visual theme.
- Blocker: none. The candidate still requires an independent read-only QA verdict
  before changelog integration and push.
- Next: create the candidate SHA and route that exact SHA to independent QA.
