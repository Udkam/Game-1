# Tetris T5 Frontend Workstream Log

## 2026-07-16 — QUEUED

- Task: `TETRIS-T5-FRONTEND-001`
- Branch: `codex/tetris-recovery`
- Visual direction: `青流蓝图 / Aqua Blueprint`.
- Scope: mode home, all-available Puzzle library, new game composition, light
  cyan/light-blue tokens, new Pixi cell language, accessibility and responsiveness.
- Exact path boundary: the Frontend paths listed in `CURRENT_TASK.md` plus this log.
- Forbidden: core rules/definitions, T3/T4 evidence, coordinator docs, changelog,
  commit/push.
- Blocker: waits for the T5 Core candidate and independent core QA.
- Next: remain read-only until coordinator authorization.

## 2026-07-17 — CANDIDATE READY

- Task: `TETRIS-T5-FRONTEND-001`
- Branch: `codex/tetris-recovery`
- Writer intake HEAD: `72f584183a8dae90195748b9436dda788c9df55b`
- Coordinator documentation commits received while the writer was active:
  - `336a89c` removed `index.html` from the writer boundary after the user directed
    that the existing Vite entry remain unchanged.
  - `8c3a78b` clarified that delivery remains a browser HTML page, not a native app,
    PWA wrapper, or installable package.
- Final parent HEAD before this candidate: `8c3a78beb5cbe92cbf95f5b97b85297928cc0525`.

### Exact changed paths

- `src/App.tsx`
- `src/styles.css`
- `src/puzzleProgress.ts`
- `src/puzzleProgress.test.ts`
- `src/game/render/theme.ts`
- `src/game/render/TetrisRenderer.ts`
- `src/game/render/presentation.ts`
- `src/ui/ActionSheet.tsx`
- `docs/workstreams/tetris-t5-frontend/THREAD_LOG.md`

`index.html`, package manifests/locks, Core rules/definitions/fixtures, runtime,
coordinator documents, changelog, T3/T4 evidence, and QA archives have no writer diff.

### Delivered behavior

- Replaced the always-mounted legacy composition with three explicit page states:
  mode home → Puzzle library → game. Home and library mount no runtime or canvas;
  game mounts exactly one, and confirmed exit destroys it before the destination page
  appears.
- Added three original, full-size mode entrances under the player-facing `青流方阵`
  identity. Race copy is exactly endless acceleration/endurance semantics and its HUD
  contains score, lines, and speed tier with no 20-line target or remaining-line value.
- Made all six Puzzle rows enabled. The library shows only name, board-empty goal,
  continuous seven-bag input, and optional completion state; no difficulty, lock,
  budget, remaining-piece value, or suggested solution is exposed.
- Migrated local presentation progress to completion-only schema v2 at
  `qingliu:puzzle-completion:v2`. Strict parsing orders/deduplicates known IDs, malformed
  data fails closed, and legacy v1 highest-unlocked data migrates only the completions
  that necessarily preceded that marker. Availability never depends on progress.
- Rebuilt the page as the original Aqua Blueprint system: light cyan/blue surfaces,
  AA-oriented dark text/actions, clipped corners, blueprint ticks, and one offset cyan
  route line. The old warm mineral/shadow/inset language is absent.
- Replaced minos with seven cool flat planes sharing a deep-cyan outline and one clipped
  corner. Active outlines are stronger, locked cells remain flat, Next reuses the same
  primitive, and ghost cells contain only four corner brackets.
- Added accessible pause, exit-confirmation, and result ActionSheets with labelled
  dialogs, initial focus, Tab/Shift+Tab trapping, Escape/cancel, and opener focus
  restoration. Escape propagation is intentionally stopped inside a sheet so it cannot
  also toggle the runtime pause binding.
- All visible buttons are at least 44 × 44 CSS px; the canvas has a 3 px focus ring.
  The live `prefers-reduced-motion` media-query listener calls
  `GameRuntime.setReducedMotion` in place and preserves canonical state.
- Added read-only `window.render_game_to_text` plus deterministic `window.advanceTime`
  forwarding in DEV for the prescribed web-game smoke loop. No state replacement,
  replay injection, or fabricated browser setup was added.

### Commands and evidence actually run

- Initial `npm.cmd run typecheck` — PASS.
- Initial targeted
  `npm.cmd run test -- src/puzzleProgress.test.ts src/game/render/presentation.test.ts`
  — PASS, 6 files / 22 tests.
- Final targeted
  `npm.cmd run test -- src/puzzleProgress.test.ts src/game/render/presentation.test.ts src/game/runtime/GameRuntime.test.ts`
  — PASS, 9 files / 33 tests.
- After the final source change, final `npm.cmd run typecheck` — PASS.
- After the final source change, final `npm.cmd run test` — PASS,
  37 files / 237 tests.
- After the final source change, final `npm.cmd run build` — PASS; Vite transformed
  739 modules.
- Ran the prescribed `develop-web-game` Playwright client with the supplied
  `action_payloads.json`; it drove real left/hard-drop bursts, wrote state JSON, and
  produced screenshots that were opened and visually inspected. The existing local
  Playwright 1.61.1 npm cache was exposed through ignored temporary `node_modules`
  junctions only; no dependency or lockfile changed, and no temporary capture is part
  of the candidate.
- Inspected the mode home, all-level Puzzle library, Marathon board, graphical Next,
  and a 390 × 844 DPR3 Level 6 Puzzle after three visible hard-drop button clicks.
  Text state and canvas agreed on mode, level, piece count, active piece, and Next.
- Browser matrix at 1440 × 900, 2048 × 1152, 390 × 844 DPR3, 844 × 390 DPR3, and
  360 × 800 passed with one canvas, zero DOM cells, exact viewport-sized gameplay
  documents, 1:2 board geometry, minimum 44 × 44 buttons, and zero board overlap with
  stats, Next, or touch controls. No console/page error was recorded.
- Pause/resume, focus trap, keyboard and button Escape paths, exit cancel/confirm,
  home → game → home canvas teardown, three consecutive Puzzle locks, and live reduced
  motion changes were exercised. Reduced-motion toggles preserved a frozen canonical
  state byte-for-byte.
- `git diff --check` — PASS before candidate staging; line-ending notices only.

### Handoff

- Blocker: none.
- Push: not performed; coordinator owns integration and push decisions.
- Next: create one bounded writer candidate commit, then route its exact SHA to
  independent read-only final QA before changelog integration.

## 2026-07-17 — CLEAN `TETRIS` REDESIGN CANDIDATE READY

- Task: `TETRIS-T5-FRONTEND-REDESIGN-002`
- Branch: `codex/tetris-recovery`
- Base SHA: `137ff47a44036201a893af4f69f907bc29cf384d`
- Candidate identity: the bounded writer commit created from this recorded tree; its
  exact SHA is returned to the coordinator with this log.

### Exact changed paths

- `src/App.tsx`
- `src/App.test.ts`
- `src/styles.css`
- `src/game/render/theme.ts`
- `src/game/render/TetrisRenderer.ts`
- `src/ui/ActionSheet.tsx`
- `docs/workstreams/tetris-t5-frontend/THREAD_LOG.md`

No writer diff exists in `index.html`, dependencies/configuration, Core/Puzzle data,
`GameRuntime`, input/audio/storage, `puzzleProgress.ts`, `presentation.ts`, coordinator
documents, changelog, historical evidence, or committed T5 evidence.

### Delivered behavior

- Replaced the rejected `青流方阵` / Aqua Blueprint page with plain-text `Tetris`, a
  quiet light cyan/light-blue surface system, and three compact rounded horizontal
  mode bands. Removed the glyph, English subtitle, route/coordinate/grid/tick language,
  clipped corners, decorative numbering, and oversized marketing statement.
- Kept the conditional home → Puzzle library → game lifecycle and all existing test
  IDs. Home/library mount zero canvases; game mounts exactly one runtime/canvas.
- Rebuilt Puzzle selection as six compact enabled rows plus one desktop detail panel.
  At mobile width the selected row expands its own in-flow detail and start action;
  there is no sticky/fixed selection surface or overlap.
- Rebuilt gameplay as one coherent board/right-rail surface on desktop and a compact
  statistics/Next band above the board on mobile. The right rail owns statistics,
  factual mode copy, one graphical Next, and keyboard help; Pixi no longer duplicates
  a `NEXT` title.
- Replaced cut-corner, shared-dark-outline cells with per-hue rounded ceramic tiles:
  a colored face, same-hue lower edge, and restrained top highlight. Board and Next
  share the primitive; ghost cells use a complete rounded outline. Board CAD ticks and
  route marks were removed.
- Mapped canvas keyboard focus to the board frame rather than outlining the whole
  transparent canvas. Restored the existing HTML skip link's intended off-screen-until-
  focus behavior without changing `index.html`.
- Changed the renderer canvas label and startup live message to plain `Tetris`.
- `__TETRIS_D4_QA__.collect().state` now returns a structured clone. The direct test
  mutates snapshot `status`, `active.x`, `queue[0]`, and `board[0][0]`, proves the
  canonical state is byte-for-byte unchanged, and proves active/queue/board/row nested
  identities are detached.
- Existing accessible ActionSheet focus trap, Escape/cancel, focus restoration,
  reduced-motion listener, pointer capture, keyboard/touch controls, all-level access,
  endless Race copy/rules, and continuous Puzzle semantics remain unchanged.

### Commands and evidence actually run

- First `npm.cmd run test -- src/App.test.ts` — FAIL because the new test used the
  non-production ID `broken-weir`; corrected to production level `t3r-shaft-01` without
  touching Puzzle definitions.
- Re-run `npm.cmd run test -- src/App.test.ts` — PASS, 1 file / 1 test.
- Targeted `npm.cmd run test -- src/App.test.ts src/game/render/presentation.test.ts src/game/runtime/GameRuntime.test.ts`
  — PASS, 7 files / 24 tests.
- Intermediate `npm.cmd run typecheck` — PASS.
- After the final source change, final `npm.cmd run typecheck` — PASS.
- After the final source change, final `npm.cmd run test` — PASS, 38 files / 238 tests.
- After the final source change, final `npm.cmd run build` — PASS; Vite transformed
  739 modules.
- Ran the required `develop-web-game` Playwright client from the installed skill with
  its supplied `action_payloads.json`. It entered Marathon through the visible mode
  control, performed real left/hard-drop input bursts, produced matching
  `render_game_to_text` state, and captured canvas screenshots that were opened and
  visually inspected before and after the focus-ring correction.
- Ran a temporary Playwright page-smoke harness at 1440 × 900, 390 × 844, 360 × 800,
  and 844 × 390. It used visible mode/level/start/touch controls and screenshots were
  opened at every requested portrait/desktop size plus landscape. Final results:
  console/page errors `[]`; no horizontal overflow; all three home entries fully
  visible at 1440 × 900 and 390 × 844; home/library canvas count 0; game canvas count
  1; gameplay minimum button size 44 × 44; board ratio exactly 1:2; mobile selected
  detail gap 0 with normal in-flow expansion.
- The temporary Playwright script, screenshots, output JSON, and dependency junctions
  lived only under verified workspace path `.local/t5-redesign-smoke` and were removed
  after inspection. No package manifest or lockfile changed.
- `git diff --check` — PASS; Git line-ending notices only.

### Handoff

- Blocker: none.
- Push: not performed.
- Next: coordinator routes the exact candidate SHA to independent read-only visual,
  lifecycle, snapshot-isolation, and scope QA before replacing obsolete T5 evidence.

## 2026-07-17 — CLEAN `TETRIS` REDESIGN REJECTED

- Task: `TETRIS-T5-FRONTEND-REDESIGN-002`
- Candidate: `c9135f3252abfa3bd6d7e94c5eb2e11fc3c72a18`.
- Result: the user rejected the complete presentation. It is not a pending polish
  candidate and no narrow font/copy fix is authorized against its visual system.
- Independent review additionally recorded 8–11 px mobile statistic text and legacy
  `路线` copy. They are replacement-slice regression requirements, not permission to
  retain the rounded mode bands or ceramic cell material.
- Retained behavioral baseline: conditional lifecycle, exact canvas teardown,
  accessibility and input behavior, rule binding, and detached nested QA snapshots.
- Push: not performed.
- Next: visual authority transfers to Slice E after the coordinator contract commit.

## 2026-07-17 — LIGHT NEO-TECH MINIMAL SLICE QUEUED

- Task: `TETRIS-T5-FRONTEND-TECH-MINIMAL-003`.
- Product baseline: `c9135f3252abfa3bd6d7e94c5eb2e11fc3c72a18`.
- Direction: original light cyan/light-blue neo-tech minimal interface, one continuous
  1+2 mode surface, one-shot phase seam, coherent Puzzle/game surfaces, and flat
  edge-lit plate Board/Next cells.
- Exact allowed and forbidden paths are frozen in `CURRENT_TASK.md` Slice E.
- Status: waits for the coordinator documentation commit; no source edit or push is
  authorized before that commit.
- Next: one bounded writer implements Slice E and records exact final gates/evidence.

## 2026-07-17 — LIGHT NEO-TECH MINIMAL CANDIDATE READY

- Task: `TETRIS-T5-FRONTEND-TECH-MINIMAL-003`.
- Branch: `codex/tetris-recovery`.
- Base SHA: `368d9d80445e35fa2e1098f259c8f50c51e591a8`.
- Intake: branch and HEAD matched the coordinator instruction and the working tree was
  clean before the first source edit.
- Candidate identity: the single bounded writer commit created from this recorded
  tree; its exact SHA is returned to the coordinator with this log.

### Exact changed paths

- `src/App.tsx`
- `src/styles.css`
- `src/game/render/theme.ts`
- `src/game/render/TetrisRenderer.ts`
- `docs/workstreams/tetris-t5-frontend/THREAD_LOG.md`

There is no writer diff in `index.html`, package/dependency/build configuration,
`src/main.tsx`, Core, runtime, input, audio, Puzzle definitions/progress,
leaderboard, renderer presentation, coordinator documents, changelog, or any evidence
directory. `src/App.test.ts` and `src/ui/ActionSheet.tsx` remain byte-for-byte at the
accepted `c9135f3` behavioral baseline.

### Delivered interface and preserved behavior

- Replaced the rejected rounded-band page with an original light neo-tech minimal
  system named only `Tetris`. The home is one continuous surface: a functional current
  selection view and one grouped 1+2 mode deck. Hover/focus updates the current mode;
  the mode button still enters immediately through the existing visible control.
- Added exactly one real `phase-seam` element. It is 2 px high and 72 px idle; focus
  changes the selected mode and extends it once over 220 ms. It never loops and the
  existing reduced-motion override makes its state change immediate.
- Kept the exact Race rule copy visible: continuous acceleration, no finish, and only
  explicit exit or top-out as termination. All player-visible `路线` wording was
  removed and Puzzle now describes multiple possible `解法`.
- Rebuilt Puzzle selection as one six-row all-enabled surface plus one selected detail
  region. The selected original starting board is derived read-only through
  `createInitialState` and drawn as one SVG/path; it is not a DOM cell grid and does
  not copy or redefine Puzzle data. The mobile selected detail expands in normal flow
  with no sticky/fixed overlap.
- Rebuilt gameplay as one bounded continuous surface containing the dominant board,
  flat information dock, graphical Next, and one shared-edge five-key control deck.
  Mobile stats show labels at 14 px and values at 18 px, including the complete Puzzle
  level name; touch labels are 12 px.
- Replaced ceramic/jelly cells with one Board/Next `edge-lit plate` primitive: 2.5–4 px
  radii, a bounded same-hue diagonal gradient, fine same-hue outer and inner edges,
  and only a low-intensity active outline. Locked cells are flat; Ghost uses a complete
  fine outline with at most 6% fill. The white highlight bar, lower lip, shared dark
  outline, cut corner, bracket ghost, detached unit shadow, and board grid are absent.
- Preserved the conditional `home → puzzle-library → game` lifecycle, `GameSession`
  key, asynchronous mount disposal guard, media-query cleanup, pointer capture,
  keyboard/touch controls, accessible action sheets, exact runtime/canvas teardown,
  endless Race, continuous Puzzle play, and the detached nested `structuredClone` QA
  snapshot regression.
- Retained the existing `enter-*`, `level-row`, `board-frame`, `stats`, `next-slot`,
  and `touch-rail` test IDs. Added stable `phase-seam`,
  `start-selected-puzzle`, and `start-selected-puzzle-mobile` selectors without
  changing evidence scripts.

### Commands and results actually run

- Targeted `npm.cmd run test -- src/App.test.ts` — PASS, 1 file / 1 test.
- Targeted
  `npm.cmd run test -- src/App.test.ts src/game/runtime/GameRuntime.test.ts` — PASS,
  4 files / 12 tests; this compiled and exercised the renderer/runtime integration.
- After the final product source change, exactly one final
  `npm.cmd run typecheck` — PASS.
- After the final product source change, exactly one final `npm.cmd run test` — PASS,
  38 files / 238 tests.
- After the final product source change, exactly one final `npm.cmd run build` — PASS;
  Vite transformed 739 modules.
- Ran the prescribed `develop-web-game` Playwright client against the frozen source,
  with the supplied `action_payloads.json`, the visible `enter-marathon` control,
  three iterations, and intentional pauses. Real left/hard-drop bursts produced a
  visible three-piece stack and matching text state: Marathon, playing, score 106,
  placed pieces 3, active Z, Next L. Final `shot-2.png` and all earlier shots/states
  were opened or read; no console/page error was emitted.
- Ran one final visible page smoke over 11 scenarios covering 1440 × 900,
  2048 × 1152, 390 × 844 DPR3, 360 × 800 DPR3, and 844 × 390 DPR3. It exercised
  home, the Puzzle library, Marathon keyboard input, and Puzzle selection/start plus
  three real `touch-hard-drop` clicks.
- Final matrix result for every scenario: console/page errors `[]`, no horizontal or
  accidental vertical overflow, and zero gameplay DOM cells. Home/library contained
  zero canvases; gameplay contained exactly one. All three home modes were fully
  inside every required home viewport.
- Computed final browser values: minimum visible button 44 × 44 px in gameplay and
  library; mobile/landscape statistic labels 14 px, statistic values 18 px, and all
  five touch labels 12 px. The idle phase seam measured 72 × 2 px; a dedicated focus
  check found exactly one seam, selected view transitions
  `马拉松 → 竞速 → 解谜`, and one 220 ms extension to 132 px at mobile width.
- The final 390 × 844 Puzzle state and screenshot agreed on canonical level
  `t3r-shaft-01` / visible `青脊回旋`, `placedPieces = 3`, active T, and Next J.
- Actual final captures opened and inspected included `desktop-home.png`,
  `wide-home.png`, `portrait-home.png`, `narrow-home.png`, `landscape-home.png`,
  `desktop-library.png`, `portrait-library.png`, `desktop-marathon.png`,
  `portrait-marathon.png`, `landscape-marathon.png`, and
  `portrait-puzzle-three-locks.png` under the ignored temporary
  `.local/t5-tech-writer-smoke/pages/` directory. They showed the expected geometry,
  readable exact copy, full level name, Board/Next material match, and no overlap.

### Handoff

- Blocker: none.
- Push: not performed; the coordinator owns QA routing, integration, and push.
- Next: independent read-only visual and functional QA audits the exact candidate SHA
  before the coordinator regenerates T5 evidence or updates the changelog.
