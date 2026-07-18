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

## 2026-07-17 — LIGHT NEO-TECH MINIMAL QA FIX CANDIDATE READY

- Task: `TETRIS-T5-FRONTEND-TECH-MINIMAL-FIX-004`.
- Branch: `codex/tetris-recovery`.
- Base SHA: `f66c118fd93eb95e752fd4335801b7d268938655`.
- Intake: branch and HEAD matched the coordinator instruction and the working tree was
  clean before the first source edit.
- Independent QA findings: three mobile home labels computed at 10–11 px, and the
  844 × 390 Puzzle library required root-page scrolling to reach all levels/actions.

### Exact changed paths

- `src/styles.css`
- `docs/workstreams/tetris-t5-frontend/THREAD_LOG.md`

No product or tracked documentation path outside this two-file boundary changed.
`App.tsx`, renderer/theme, tests, Core/runtime/Puzzle data, `index.html`, dependencies,
coordinator documents, changelog, and evidence directories have no writer diff.

### Delivered correction

- Raised the three `max-width: 599px` home labels — `当前选择`,
  `键盘与触控均可操作`, and `随时开始，也可随时退出` — to a computed 12 px.
- Added a height-bounded landscape Puzzle-library layout for widths at least 600 px
  and heights at most 520 px. At 844 × 390 it uses fixed header/intro rows, a
  min-height-zero content track, six equal 44 px-or-larger level tracks, and a compact
  detail/action column. The decorative starting-board silhouette is omitted only in
  this short landscape layout so the six choices and selected start action remain
  complete and actionable without root-page scrolling.
- Desktop library, portrait home, landscape home, and landscape gameplay structures
  remain unchanged outside those responsive overrides.

### Commands and evidence actually run

- Before final gates, ran a real Playwright targeted matrix against the Vite page.
  At both 390 × 844 DPR3 and 360 × 800 DPR3, all three named home labels computed at
  exactly 12 px, all three mode buttons were fully inside the first viewport, the
  document exactly matched the viewport, and console/page errors were `[]`.
- At 844 × 390 DPR3 Puzzle library, `scrollWidth = 844` and `scrollHeight = 390`.
  The six level-row vertical bounds were `108–153.65625`,
  `154.65625–200.328125`, `201.328125–247`, `248–293.65625`,
  `294.65625–340.328125`, and `341.328125–388` px; every row used horizontal bounds
  `11–542` px. The selected start action measured
  `x 557–819, y 336–380, 262 × 44` px, was enabled, and a real click entered the game.
  Minimum visible button height was 44 px and console/page errors were `[]`.
- The same targeted pass checked 1440 × 900 library plus 844 × 390 home/game with
  exact viewport-sized documents, no overflow, minimum 44 px buttons, and errors
  `[]`.
- Opened and visually inspected the actual `portrait-home.png`, `narrow-home.png`,
  `landscape-library.png`, `desktop-library.png`, `landscape-home.png`, and
  `landscape-marathon.png` captures under the existing ignored
  `.local/t5-tech-writer-smoke/pages/` directory. Essential copy, all six rows, the
  selected action, board, statistics, Next, and controls showed no clipping or overlap.
- After the final product source change, exactly one final
  `npm.cmd run typecheck` — PASS.
- After the final product source change, exactly one final `npm.cmd run test` — PASS,
  38 files / 238 tests.
- After the final product source change, exactly one final `npm.cmd run build` — PASS;
  Vite transformed 739 modules.
- Ran one affected-page smoke against the frozen production build after those gates.
  It reproduced the same home fonts and 844 × 390 library geometry, kept all tested
  documents within their viewports, recorded minimum button height 44 px and errors
  `[]`, and its six requested captures were opened and inspected again.

### Handoff

- Blocker: none.
- Push: not performed; the coordinator owns the push decision after QA.
- Next: create the bounded two-path candidate commit and route its exact SHA to
  independent read-only QA.

## 2026-07-17 — NARROW PUZZLE GOAL COPY FIX CANDIDATE READY

- Task: `TETRIS-T5-FRONTEND-NARROW-COPY-FIX-005`.
- Branch: `codex/tetris-recovery`.
- Base SHA: `5881692786cbd1a9d8bbcba41e2e85f0234b7533`.
- Intake: branch and HEAD matched the coordinator instruction and the working tree was
  clean before the first source edit.
- Bounded finding: at 360 × 800, the Puzzle target value did not fully preserve the
  exact canonical text `清空完整棋盘` in its statistics cell.

### Exact changed paths

- `src/styles.css`
- `docs/workstreams/tetris-t5-frontend/THREAD_LOG.md`

No tracked path outside this two-file boundary changed. `App.tsx`, renderer/theme,
tests, Core/runtime/Puzzle data, `index.html`, dependencies, coordinator documents,
changelog, and evidence directories have no writer diff.

### Delivered correction

- Added one `max-width: 365px` Puzzle-statistics grid override, assigning 40% to the
  level/cleared column and 60% to the placed/target column.
- Preserved the exact target copy, statistic-value size, component structure, and all
  wider portrait, landscape, desktop, home, and library layouts. No scaling, hiding,
  or font-size reduction was used.

### Commands and evidence actually run

- Ran the prescribed `develop-web-game` Playwright client against the Vite page with
  the supplied `action_payloads.json`, visible `enter-marathon` control, two
  iterations, and intentional pauses. It exited 0; the final state was Marathon,
  playing, score 74, placed pieces 2, active S, and Next Z. Opened and inspected the
  actual `shot-1.png`; the board, statistics, Next, and controls were visible.
- Ran a real visible-control Puzzle matrix at 360 × 800 DPR1, 390 × 844 DPR3, and
  844 × 390 DPR3. Each case selected and started `t3r-shaft-01`, then used a real
  `touch-hard-drop` action; console/page errors and assertion failures were `[]`.
- At 360 × 800 the target strong element reported exact text `清空完整棋盘`,
  `clientWidth = scrollWidth = 131`, `clientHeight = scrollHeight = 22`, and
  computed font size 18 px. At 390 × 844 it reported
  `clientWidth = scrollWidth = 122` and 18 px. At 844 × 390 it reported
  `clientWidth = scrollWidth = 113` and 18 px.
- Across all three viewports, statistic labels were 14 px, statistic values were
  18 px, all five touch labels were 12 px, the minimum visible button was 44 × 44 px,
  document overflow was zero, exactly one gameplay canvas was present, and gameplay
  DOM cells were zero. Board geometry remained 2:1: 266 × 532, 288 × 576, and
  129 × 258 px respectively.
- Opened and visually inspected the actual `narrow-puzzle.png`,
  `portrait-puzzle.png`, and `landscape-puzzle.png` captures under the ignored
  `.local/t5-narrow-slice/screenshots/` directory. The complete target copy was
  readable, and the board, statistics, Next, and controls showed no clipping or
  overlap.
- After the final product source change, exactly one final
  `npm.cmd run typecheck` — PASS.
- After the final product source change, exactly one final `npm.cmd run test` — PASS,
  38 files / 238 tests.
- After the final product source change, exactly one final `npm.cmd run build` — PASS;
  Vite transformed 739 modules.

### Handoff

- Blocker: none.
- Push: not performed; the coordinator owns the push decision after independent QA.
- Next: create the bounded two-path candidate commit and route its exact SHA to
  independent read-only QA.

## 2026-07-17 — FIFTEEN-LEVEL FRONTEND CANDIDATE READY

- Task: `TETRIS-T5-FRONTEND-CAMPAIGN-15-007`.
- Branch: `codex/tetris-recovery`.
- Base SHA: `05bb7dcd1bf667f899be1a91af06b857f369f38a`.
- Intake: branch and HEAD matched the coordinator instruction, the working tree was
  clean, and Slice G was already recorded as independently accepted before the first
  frontend edit.
- Skills followed: `frontend-design` preserved the accepted original light neo-tech
  minimal language and continuous surfaces; `develop-web-game` supplied the real
  input/screenshot loop. Its normal `progress.md` write was intentionally replaced by
  this authorized log because Slice H forbids `progress.md` changes.
- Candidate identity: the single bounded writer commit created from this recorded
  tree; its exact SHA is returned to the coordinator with this log.

### Exact changed paths

- `src/App.tsx`
- `src/App.test.ts`
- `src/styles.css`
- `src/game/render/theme.ts`
- new `src/game/render/theme.test.ts`
- `docs/workstreams/tetris-t5-frontend/THREAD_LOG.md`

No writer diff exists in Core or Puzzle definitions/references, `puzzleProgress.ts`,
`TetrisRenderer.ts`, presentation/runtime/input/audio, dependencies/build
configuration, `index.html`, coordinator documents, changelog, or formal evidence.

### Delivered frontend binding

- Replaced every player-visible and accessibility use of `马拉松` with `经典` while
  retaining the internal `marathon` mode key, `enter-marathon` selector, and existing
  CSS compatibility keys.
- Replaced the seven cool near-blue materials with the exact four-value
  mineral-signal palette frozen in `DESIGN.md`. Board, Next, active, locked, and Ghost
  rendering still share the existing `TetrisRenderer` edge-lit plate primitive; no
  renderer logic changed.
- Removed the `六关` / `六个` frontend constants. Home copy, library copy, and the
  library aria label derive their visible count from `CAMPAIGN_LEVELS.length`.
- Kept all fifteen `level-row` buttons mounted, enabled, keyboard/touch reachable,
  and equipped with stable `data-level-id` plus `aria-pressed`. The existing
  `puzzle-library`, `level-list`, `start-selected-puzzle`, and
  `start-selected-puzzle-mobile` selectors remain present.
- Rebuilt the continuous selector as a 3 × 5 matrix beside the existing detail/start
  region on desktop, 1024 × 768, and 844 × 390. The short-landscape layout fits all
  fifteen complete buttons and the 44 px start action in the first viewport.
- At 390 and 360 widths the selector is a two-column, eight-row matrix. Its selected
  detail is now a sibling after the complete level list in normal document flow, not
  content nested inside or overlaid on a level item; library scrolling remains
  allowed while gameplay remains viewport-bounded.
- Changed the canonical starting-board silhouette from one recolored occupancy path
  into at most one SVG path per present piece type. It reads the canonical board and
  shared theme only, creates no DOM gameplay grid, and shows all seven authored colors
  for the accepted fifteen-level boards.
- Added focused DOM binding tests for visible `经典` with the internal Marathon
  selector, fifteen enabled ordered rows, first/eighth/fifteenth selection, both start
  selectors, canonical initial active/Next state, and multi-color silhouettes. Added
  an exact-value theme regression for all 28 frozen palette values.

### Commands and results actually run

- Targeted
  `npm.cmd run test -- src/App.test.ts src/game/render/theme.test.ts` — PASS,
  2 files / 4 tests. It was rerun after the final test-helper type correction with the
  same result. jsdom printed only its non-failing Canvas `getContext()` diagnostic.
- The first attempted final `npm.cmd run typecheck` correctly found
  `src/App.test.ts(10,12) TS7017` for assigning the React act flag directly to
  `globalThis`. The test helper changed to typed `Object.assign`; final-gate counting
  was reset from the beginning.
- After the final source change, final `npm.cmd run typecheck` — PASS.
- After the final source change, final `npm.cmd run test` — PASS: 40 files total,
  39 passed / 1 skipped; 252 tests total, 251 passed / 1 skipped.
- After the final source change, final `npm.cmd run build` — PASS; Vite transformed
  739 modules.
- Ran the prescribed `develop-web-game` client with the supplied
  `action_payloads.json`, the visible `enter-marathon` selector, two iterations, and
  intentional pauses. Real left/hard-drop bursts reached score 38 / placed 1 / active
  O / Next S, then score 74 / placed 2 / active S / Next Z. Its two canvas captures
  under `.local/slice-h-writer/client/` were opened and inspected; no error artifact
  was emitted. The existing Playwright npm cache was exposed only through an ignored
  temporary junction and the junction was removed afterward with its path absent.
- An initial browser iteration found only a 6 px root-page overflow at 1024 × 768.
  The bounded library height budget was corrected, and the targeted rerun measured
  `rootWidth = 1024`, `rootHeight = 768`, no overflow, fifteen complete buttons, and a
  272 × 44 px selected start action.
- A production-preview browser attempt stopped at the expected DEV diagnostic
  boundary because `render_game_to_text` is not exposed in production. Two later
  `.local` harness assertions were corrected without product changes: canvas counting
  now waits for asynchronous Pixi mount, and the single-line name check uses
  horizontal width rather than subpixel line-height rounding. The successful final
  matrix ran against the exact frozen DEV source after the separate production build
  passed.
- Final fail-fast browser matrix covered 1440 × 900, 1024 × 768, 844 × 390 DPR3,
  390 × 844 DPR3, and 360 × 800 DPR3. Structured output is the ignored
  `.local/slice-h-writer/matrix/results.json`.

### Final browser evidence inspected

- Home at every viewport showed `经典`, Race, and Puzzle fully inside the first
  viewport, no visible `马拉松`, zero canvases, no root overflow, and exactly one
  72 × 2 px phase seam with the 220 ms transition.
- Library at 1440, 1024, and 844 used 3 columns × 5 rows with no page overflow.
  The 844 rows measured approximately 55 px and its selected start action measured
  262 × 44 px. Library at 390 and 360 used 2 columns × 8 rows, allowed only the
  intended vertical library scroll, and placed the visible selected detail after and
  outside `level-list`.
- Every library case had 15 enabled buttons, one pressed row, zero canvases, zero DOM
  gameplay cells, minimum visible button height 44 px, no clipped level name, and two
  canonical silhouettes containing seven piece-type paths each.
- Real UI selected and started the first, eighth, and fifteenth levels at every
  viewport. Canonical/visible pairs were:
  `t3r-shaft-01` / `青脊回旋` / active S / Next L;
  `t5r-drift-08` / `微澜错屿` / active T / Next O; and
  `t5r-horizon-15` / `远蓝合流` / active S / Next I.
  Every starting board exposed all seven locked piece types.
- Gameplay at every viewport had exactly one canvas, zero DOM cells, no horizontal or
  vertical overflow, statistics labels at least 14 px, values at least 18 px, touch
  labels at least 12 px, and buttons at least 44 px. `清空完整棋盘` was exact and
  unclipped: client/scroll widths were 193/193 desktop/tablet, 113/113 landscape,
  122/122 portrait, and 131/131 narrow.
- Desktop visible lifecycle measured one canvas after entry, zero after confirmed
  return home, and one after re-entry. Changing to reduced motion while paused left
  the detached canonical state byte-for-byte unchanged.
- Console/page error arrays were empty in every final scenario. The ten final
  `{desktop,tablet,landscape,portrait,narrow}-{library,level-08}.png` captures under
  `.local/slice-h-writer/matrix/` were individually opened at original detail. They
  showed complete names/copy, the continuous selector, separate mobile detail,
  multi-color Board, shared-material Next, complete goal, and non-overlapping controls.

### Handoff

- Blocker: none.
- Push: not performed; the coordinator owns independent QA routing and the push
  decision.
- Next: create the single bounded candidate commit and route its exact SHA to
  independent read-only frontend QA before any formal evidence or changelog update.

## 2026-07-17 — PREMIUM SPECTRAL SURFACE AND BRIGHT BLOCK CANDIDATE READY

- Task: `TETRIS-T5-PREMIUM-BRIGHT-BLOCKS-008`.
- Branch: `codex/tetris-recovery`.
- Writer base / final parent before candidate:
  `5114a08614e6b9c2b5c66923164f7c220143d3e8`.
- Intake: the branch matched the coordinator instruction. The coordinator committed
  the final spectral-glass contract while the writer's three bounded renderer/theme
  paths were dirty; those paths remained intact and no source collision occurred.
- Skills followed: `frontend-design` supplied the restrained spectral-glass hierarchy
  and continuous-surface polish. `develop-web-game` supplied the required original
  Playwright client and action payload. Its normal `progress.md` write was replaced by
  this authorized workstream log because Slice I forbids writer edits to
  `progress.md`.
- Candidate identity: the single bounded commit created from this recorded tree; its
  exact SHA is returned to the coordinator with this log.

### Exact changed paths

- `src/App.tsx`
- `src/App.test.ts`
- `src/styles.css`
- `src/game/render/theme.ts`
- `src/game/render/theme.test.ts`
- `src/game/render/TetrisRenderer.ts`
- `docs/workstreams/tetris-t5-frontend/THREAD_LOG.md`

No writer diff exists in Core/Puzzle definitions, references or routes,
`puzzleProgress.ts`, presentation/runtime/input/audio, dependencies or build config,
`index.html`, coordinator documents, changelog, or formal evidence.

### Delivered visual replacement

- Replaced all 28 muted material values with the exact bright luminous-spectrum table
  frozen in `DESIGN.md`. Theme regression now freezes every palette value plus the
  complete precision-slab style token object.
- Replaced the rounded double-outline plate with one Board/Next slab primitive:
  1.25–2.5 px radius, one 0.75–1.1 px same-hue dark edge, no locked inner perimeter,
  no highlight/lip/shadow, and no ceramic, candy, mineral, or plastic bevel.
- Added a separate active-aura layer using the material `innerEdge` as one low-alpha
  blurred fill behind the slab, so the active cue is soft rather than a second stroke.
  The layer follows mode-switch alpha and its Pixi filter is explicitly destroyed.
  Locked cells remain flat; the short lock pulse is the only other `innerEdge` use.
- Ghost uses one complete fine outline and a maximum configured 3% fill. At the
  production draw alpha its actual fill is 2.46%. Board and Next continue to share
  the same fill-gradient cache and exact drawing primitive.
- Rebuilt the selected-mode composition as at most one SVG path per present piece type
  and bound its fill, gradient, and edge directly to the bright shared material map.
  Canonical Puzzle silhouettes retain the same one-path-per-type rule and create no
  gameplay DOM cell grid.
- Applied the exact spectral-glass page tokens: ice `#F5F7FF`, ink `#081426`, muted
  `#52627A`, hairline `#B9CBE4`, cyan `#00BFC8`, cobalt `#4767F5`, violet
  `#8A5CF6`, and small coral `#FF5B7C`. The background contains only three broad
  low-opacity light fields and the phase seam is the single three-stop spectral rail.
- Kept the frozen bright accents as visual signals while deriving darker action
  tokens for white control text: cyan action `#087B88` measures 5.00:1, blue action
  `#3653C9` measures 6.49:1, and violet action `#6845CE` measures 6.30:1. The final
  CTA, pause, and active-touch gradients use those accessible action tokens rather
  than white text on the much lighter decorative accents.
- Preserved the light 1+2 mode structure while giving Classic cyan/cobalt, Race
  cobalt/violet, and Puzzle violet with restrained coral selection treatment. No dark
  neon, page grid, telemetry, marketing hero, external asset/font, or uncontrolled
  rainbow was added.
- Replaced the Puzzle table wall with an unboxed continuous 3 × 5 / 2-column selector,
  shorter one-line secondary copy, a clear coral selected rail, and a denser detail
  instrument. On 360/390 the fifteenth odd entry spans both columns and the selected
  detail remains a following sibling outside the list.
- The selected level uses a 3 px `#C62C50` inset rail whose contrast is approximately
  4.80:1–5.06:1 across the allowed soft selected backgrounds. Exact bright coral is
  limited to a 5 px signal dot, while 800-weight title text provides a non-color
  selection cue. Final compact-mode preflight also tightened the 390/360 home rows so
  all three mode entries fit the first viewport with no overflow.
- Unified statistics, Next, keyboard context, and the five ordered controls into one
  continuous instrument surface. Internal repeated card shadows/radii were removed;
  all stable selectors, labels, action order, complete goal, and responsive type/touch
  floors remain unchanged.

### Commands and results actually run

- Renderer/theme targeted
  `npm.cmd run test -- src/game/render/theme.test.ts src/game/runtime/GameRuntime.test.ts`
  — PASS, 4 files / 13 tests.
- Page/theme/runtime targeted
  `npm.cmd run test -- src/App.test.ts src/game/render/theme.test.ts src/game/runtime/GameRuntime.test.ts`
  — PASS, 5 files / 16 tests. jsdom printed only its known non-failing Canvas
  `getContext()` diagnostic.
- Intermediate `npm.cmd run typecheck` after the filtered-aura integration — PASS.
- Ran the prescribed original `develop-web-game` Playwright client with the supplied
  `action_payloads.json` after both renderer and complete page changes. The final
  three-iteration pass reached score 106 / placed pieces 3 / active Z / Next L; its
  final canvas capture was opened at original detail and no error artifact appeared.
- An earlier all-green gate set was treated as pre-final after subsequent compact
  mobile, action-contrast, and selected-state CSS corrections. The final-gate count
  was restarted after the actual last product-source change; no result from the
  earlier set is being claimed as final evidence.
- After the final product source change, exactly one final
  `npm.cmd run typecheck` — PASS.
- After the final product source change, exactly one final `npm.cmd run test` — PASS:
  40 files total, 39 passed / 1 skipped; 253 tests total, 252 passed / 1 skipped.
- After the final product source change, exactly one final `npm.cmd run build` — PASS;
  Vite transformed 739 modules.
- Final browser matrix covered 1440 × 900, 1024 × 768, 844 × 390 DPR3,
  390 × 844 DPR3, and 360 × 800 DPR3. Results are in ignored
  `.local/premium-writer/final-matrix/results.json`.
- The first combined-matrix attempt stopped only because its temporary harness used
  exact subpixel equality for mobile detail/list bounds. Direct measurement showed
  both at the same boundary; the ignored harness was corrected to prove DOM-following
  order plus a 1 px render tolerance. No product file changed, and the complete rerun
  passed.

### Final browser evidence inspected

- Every home showed all three mode controls inside the first viewport, visible
  `经典`, one 72 × 2 px / 220 ms phase seam, zero canvases, and no page overflow.
- At 390 × 844 and 360 × 800, the compact home stage measured 488 px and 476 px high
  respectively; all three mode rows remained fully visible in the first viewport.
- Libraries used 3 columns × 5 rows at 1440/1024/844 and 2 columns × 8 rows at
  390/360. All fifteen buttons were enabled, unclipped, and at least 44 px high;
  library-only portrait scroll was intentional. The fifteenth row spans both mobile
  columns, and selected detail is outside and after the list.
- Real visible controls selected and started the first, eighth, and fifteenth levels
  in all five viewports. Canonical IDs, names, active/Next values, and all seven locked
  colors matched; home/library had zero canvases and gameplay had exactly one canvas
  plus zero DOM cells.
- Gameplay had no horizontal or vertical overflow. Statistic labels were at least
  14 px, values at least 18 px, touch labels at least 12 px, and visible buttons at
  least 44 px. The complete `清空完整棋盘` measured client/scroll widths 195/195,
  115/115, 123/123, and 132/132 across the responsive cases.
- Desktop lifecycle remained one canvas → zero on confirmed home exit → one after
  re-entry. Live reduced-motion switching preserved the detached canonical state.
  All console/page error arrays were empty.
- All fifteen final PNGs — `{desktop,tablet,landscape,portrait,narrow}` ×
  `{home,library,level-08}` — under
  `.local/premium-writer/final-matrix/` were individually opened with original detail.
  They show the bright precision slabs, shared-material Next, complete mobile goal,
  unboxed selector, explicit selection, and non-overlapping continuous controls.
- This complete five-viewport matrix was rerun only after the corrected final source
  gates, regenerating `results.json` and all fifteen captures from the same frozen
  candidate tree.

### Handoff

- Blocker: none.
- Push: not performed; the coordinator owns QA routing, formal evidence, changelog,
  and push decisions.
- Next: create the single bounded candidate commit and route its exact SHA to
  independent read-only functional and visual QA.

## 2026-07-17 — DEEP MINERAL MINIMAL CANDIDATE READY

### Intake and ownership

- Task: `TETRIS-T5-DEEP-MINERAL-MINIMAL-010`.
- Branch: `codex/tetris-recovery`.
- Intake/base SHA: `fadc63eddab14732c3798f3e4aaa462c46bbca3f`.
- Intake status: clean.
- Writer boundary: sole frontend/render writer for the bounded deep-mineral visual,
  copy-reduction, responsive, and renderer-material slice. Core/Puzzle definitions,
  campaign references/routes, progress persistence, presentation/runtime/input/audio,
  dependencies, build config, coordinator documents, changelog, and formal evidence
  remained untouched.
- Required intake was read before implementation: root `AGENTS.md`, `DESIGN.md`,
  `CURRENT_TASK.md`, latest `docs/logs/CHANGELOG.md`, `docs/COMMIT_POLICY.md`, this
  workstream log, and `progress.md`.
- Applied `frontend-design` for the bounded original visual replacement and
  `develop-web-game` for the prescribed action-payload loop plus browser inspection.
  The latter skill's ordinary `progress.md` update was explicitly replaced by this
  authorized frontend workstream log to preserve the coordinator's exact allowlist;
  `progress.md` was not edited.

### Ordered product checkpoints

1. `5d572c5` — `feat(render): apply matte mineral cells`
   - `src/game/render/theme.ts`
   - `src/game/render/theme.test.ts`
   - `src/game/render/TetrisRenderer.ts`
2. `e5c1b7c` — `refactor(ui): reduce visible game copy`
   - `src/App.tsx`
   - `src/App.test.ts`
3. `0405266` — `style(ui): apply deep mineral surfaces`
   - `src/styles.css`
4. `1b1bfdb` — `fix(render): freeze ghost outline width`
   - `src/game/render/theme.ts`
   - `src/game/render/theme.test.ts`
   - `src/game/render/TetrisRenderer.ts`

Every checkpoint staged exact paths, inspected the cached path list/stat, passed
`git diff --cached --check`, and committed the first green reviewable claim before
the next concern. The CSS replacement was 151 insertions / 397 deletions; the large
diff is removal of the rejected spectral surface, not a bundled second subsystem.

### Delivered renderer and page contract

- Replaced the prior bright spectral renderer with the exact seven matte mineral
  materials, each frozen as `fillStart/fillEnd/edge/innerEdge`:
  `I AE4761/A1445A/542532/C78A99`,
  `O 3E988F/347F78/204944/80B9B4`,
  `T AD7D43/946C3C/503A22/C6A078`,
  `S 4F67B0/5264A2/283653/8795C2`,
  `Z 759A4C/637F43/3A4A2A/A0B584`,
  `J 8A53A2/835294/432A4D/AF8FBA`, and
  `L 43829D/386E86/244452/81AABB`.
- Board and Next retain one shared Pixi primitive. Locked cells use a quiet 135-degree
  material fill, radius at most 1.75 px, and edge at most 1 px. Active cells replace
  the dark edge with the restrained material signal edge; no aura/filter layer remains.
  Ghost is zero-fill with exact 1 px signal outline at maximum alpha 0.45. Lock response
  is a 90 ms / 0.12-alpha low fill rather than a glow or second perimeter.
- Applied the exact deep page system: page `#0B1422`, surface `#111D2E`, raised
  `#172538`, selected `#1D2D43`, well `#07101C`, ink `#EDF2F7`, muted `#AAB5C4`,
  line `#34445A`, edge `#566981`; mode signals `#5A918B/#6F87B7/#9A81A8`,
  selection `#B57686`, action `#365B8D`, hover `#426A9D`, focus `#9ABCE6`,
  success `#6F9A7D`, and danger `#B16A78`.
- The only gradient outside Pixi material fills is the exact 72 × 2 px phase seam
  `linear-gradient(90deg,#5a918b,#6f87b7,#9a81a8)`. There are no radial gradients,
  backdrop filters, ambient fields, glow shadows, or floating cards. Only the three
  main screen shells use `0 22px 60px rgba(2,7,14,.28)`.
- Home remains one 1+2 selector surface with visible copy limited to `Tetris`, one
  `选择模式`, the three names, `分数 · 消行 · 等级`, `速度递增 · 无终点`,
  `15 关残局 · 清空棋盘`, and their direct actions.
- Library exposes `解谜`, `← 返回`, fifteen ordinal/name rows with optional `已完成`,
  one selected silhouette/name/ordinal, `目标 清空棋盘`, and `开始`. Removed rule,
  queue, setup-board, current-selection, and repeated objective prose while retaining
  complete ARIA names and stable test IDs.
- Gameplay retains exactly one canvas, the Board/Next/stats/keyboard/touch instrument,
  concise pause/exit/result sheets, and the complete `清空棋盘` goal. No DOM cell grid,
  external art, commercial logo, trade dress, or copied visual asset was introduced.

### Commands and results actually run

- Renderer/theme targeted:
  `npm.cmd run test -- src/game/render/theme.test.ts src/game/runtime/GameRuntime.test.ts`
  — PASS, 4 files / 14 tests; checkpoint typecheck PASS.
- App targeted after copy change:
  `npm.cmd run test -- src/App.test.ts` — PASS, 1 file / 3 tests; checkpoint typecheck
  PASS. The first edit-loop run correctly caught a retained decorative chevron in row
  text; the chevron was removed and the same targeted suite passed.
- Page/theme/runtime targeted after final responsive CSS corrections:
  `npm.cmd run test -- src/App.test.ts src/game/render/theme.test.ts src/game/runtime/GameRuntime.test.ts`
  — PASS, 5 files / 17 tests; checkpoint typecheck PASS. jsdom printed only its known
  non-failing Canvas `getContext()` diagnostic.
- Exact ghost-width targeted rerun:
  `npm.cmd run test -- src/game/render/theme.test.ts src/game/runtime/GameRuntime.test.ts`
  — PASS, 4 files / 14 tests; checkpoint typecheck PASS.
- Static style audit found only the authorized phase `linear-gradient`, only the three
  authorized main-shell shadows, and only the frozen hex tokens plus authorized rgba
  scrim/shadow values. Final `git diff --check` passed with line-ending notices only.
- The first prescribed `develop-web-game` client attempt reported
  `ERR_MODULE_NOT_FOUND: Cannot find package 'playwright'` from the skill script's own
  module lookup. A verified temporary junction to the already-installed Playwright
  cache resolved that environment-only issue without dependency or product changes.
- After renderer/page changes, the prescribed original client and supplied
  `action_payloads.json` passed three iterations. After the final source checkpoint,
  one shell-quoting attempt supplied a malformed selector and stopped before gameplay;
  the corrected exact selector immediately passed. Final state was marathon/playing,
  score 106, 3 placed pieces, active Z, Next L. `final-client/shot-2.png` was inspected
  at original detail and no client error artifact exists.
- After the actual last product-source change, exactly one final
  `npm.cmd run typecheck` — PASS.
- After the actual last product-source change, exactly one final `npm.cmd run test`
  — PASS: 40 files total, 39 passed / 1 skipped; 255 tests total, 253 passed / 2 skipped.
- After the actual last product-source change, exactly one final `npm.cmd run build`
  — PASS; Vite transformed 739 modules.

### Final browser evidence inspected

- Final matrix covered 1440 × 900 DPR1, 2048 × 1152 DPR1, 390 × 844 DPR3,
  844 × 390 DPR3, and 360 × 800 DPR1. Results and sixteen captures are under ignored
  `.local/slice-k-writer/final-matrix/`; `results.json` records the complete assertions.
- Every home kept all three actions inside the first viewport, zero canvases, no page
  overflow, solid `rgb(11, 20, 34)` body, exactly one shell shadow, and the exact
  72 × 2 px seam. Forbidden verbose home copy was absent.
- Libraries used 3 × 5 at desktop/wide/landscape and 2 × 8 at portrait/narrow. All
  fifteen rows were enabled, unclipped, at least 44 px high, with exactly one visible
  selected silhouette and no horizontal overflow. Portrait/narrow library-only vertical
  scrolling is intentional.
- Real visible controls selected and started the first, eighth, and fifteenth levels in
  every viewport. Canonical bindings were respectively `t3r-shaft-01` S → L,
  `t5r-drift-08` T → O, and `t5r-horizon-15` S → I; each initial board exposed all
  seven locked types `IJLOSTZ`.
- Every game had exactly one canvas, zero DOM cells, no horizontal or vertical overflow,
  exact 2:1 board geometry, labels at least 14 px, values at least 18 px, touch labels at
  least 12 px, and buttons at least 44 px. Goal client/scroll widths were 195/195,
  195/195, 123/123, 115/115, and 132/132; `清空棋盘` never clipped.
- The desktop matrix drove the signed first-level reference route only through visible
  keyboard controls and reached the canonical success sheet: `棋盘已清空`,
  `35 方块 · 22 消行`. It also proved a paused reduced-motion state unchanged for
  250 ms, all five touch controls, restart to zero placed pieces, and canvas removal on
  confirmed unmount.
- Both formal-harness retries were test-script timing corrections only: first wait for
  React's read-only QA text after a public key action, then reread the finished state
  after the already-visible success heading. No product file changed. The complete
  final rerun passed with all console/page error arrays empty.
- All sixteen final PNGs — `{desktop,wide,portrait,landscape,narrow}` ×
  `{home,library,level-08}` plus `desktop-puzzle-clear.png` — were individually opened
  at original detail. They show the solid deep-mineral system, matte authored pieces,
  zero-fill ghost, shared-material Next, complete controls/goals, and no clipping or
  overlap requiring another product edit.

### Handoff

- Blocker: none.
- Push: not performed; coordinator owns independent QA, changelog, integration, and push.
- Next: independent read-only QA should audit ordered source range
  `5d572c5^..1b1bfdb` against this log and the ignored final matrix.

## 2026-07-17 — COHESIVE MINERAL / TYPE / DIVIDER REPAIR CANDIDATE READY

### Intake and ownership

- Task: `TETRIS-T5-MINERAL-TYPE-DIVIDER-011`.
- Branch: `codex/tetris-recovery`.
- Contract/base SHA: `41b29ab08a06bfb51ebdc80b054f625281876f6c`.
- Intake status: clean; the writer remained the sole owner of the bounded frontend and
  renderer repair paths.
- Product source is frozen at `e38c55c`; the ordered source range for independent QA is
  `41b29ab08a06bfb51ebdc80b054f625281876f6c..e38c55c`.
- `frontend-design` guided the restrained cohesive-mineral, typography, and continuous
  divider repair. `develop-web-game` supplied the prescribed action client and browser
  inspection loop. Its ordinary `progress.md` update was replaced by this authorized
  workstream log; `progress.md` was not edited.

### Ordered product checkpoints and exact changed paths

1. `2dfcee1` — `feat: render cohesive mineral tetrominoes`
   - `src/App.tsx`
   - `src/App.test.ts`
   - `src/game/render/TetrisRenderer.ts`
   - `src/game/render/presentation.ts`
   - `src/game/render/presentation.test.ts`
   - `src/game/render/theme.ts`
   - `src/game/render/theme.test.ts`
2. `e38c55c` — `fix: restore responsive type and panels`
   - `src/styles.css`

This log is the only post-source path. Core/Puzzle definitions, campaign
references/routes, progress persistence, runtime/input/audio, dependencies/build
configuration, coordinator documents, changelog, `progress.md`, and formal evidence
remain untouched. No generated browser artifact is part of the candidate.

### Delivered repair contract

- Added pure orthogonal component grouping and exposed-edge helpers, then used them for
  active, locked, Next, and Ghost presentation. Each tetromino now reads as one cohesive
  mineral silhouette with restrained directional relief and only faint internal joins;
  Board and Next continue to share the same material language.
- Ghost now draws only the complete exterior perimeter of the grouped piece. The
  nine-tick clear presentation keeps the locked stack coherent through the real
  `line-clear` phase and restores the fragmented post-clear board without detached
  cell-card treatment.
- Kept exactly one gameplay canvas and no DOM cell grid. The direct App regression and
  renderer presentation/theme tests freeze the cohesive silhouette, boundary grouping,
  Ghost perimeter, and clear-phase behavior without entering Core.
- Restored the exact Google CSS import for Space Grotesk and Noto Sans SC, followed by
  `Segoe UI`, `Microsoft YaHei UI`, `PingFang SC`, system UI, and sans-serif fallbacks.
  The same fallback stack remains readable when the Google request is deliberately
  blocked.
- Repaired the role-based continuous panel divider topology, the 4 px / 180 ms surface
  entrance, and compact game composition. Mobile and 844 × 390 landscape keep Next and
  keyboard context visible; the complete goal, controls, board, and responsive type
  no longer clip or overflow.

### Commands and results actually run

- Intermediate `npm.cmd run typecheck` — PASS.
- Targeted
  `npm.cmd run test -- src/App.test.ts src/game/render/theme.test.ts src/game/render/presentation.test.ts src/game/runtime/GameRuntime.test.ts`
  — PASS, 8 files / 31 tests.
- Ran the prescribed renderer action client with the installed skill's supplied
  `action_payloads.json`; the resulting real three-piece board was opened at original
  detail and passed coordinator visual review for cohesive active/locked/Next material,
  exterior-only Ghost, and restrained relief.
- After the actual last product-source change, exactly one final
  `npm.cmd run typecheck` — PASS.
- After the actual last product-source change, exactly one final `npm.cmd run test`
  — PASS: 40 files total, 39 passed / 1 skipped; 257 tests total,
  255 passed / 2 skipped. jsdom printed only its known non-failing Canvas
  `getContext()` diagnostic.
- After the actual last product-source change, exactly one final `npm.cmd run build`
  — PASS; Vite transformed 739 modules.
- Final prescribed action command:
  `node 'C:\Users\Alex Chen\.codex\skills\develop-web-game\scripts\web_game_playwright_client.js' --url http://127.0.0.1:4173/ --actions-file 'C:\Users\Alex Chen\.codex\skills\develop-web-game\references\action_payloads.json' --click-selector '[data-testid="enter-marathon"]' --iterations 3 --pause-ms 250 --screenshot-dir '.local\slice-kr-writer\final-action-client'`
  — PASS; final state was Marathon/playing, score 98, placed pieces 3, with no error
  artifact.
- Fresh loaded-font and blocked-font matrix commands used only the ignored harness:
  `node .local\slice-kr-writer\layout-preflight.mjs` and
  `node .local\slice-kr-writer\layout-preflight.mjs fallback` — PASS.
- All-level and real-clear command:
  `node .local\slice-kr-writer\all15-postclear.mjs` — final bounded rerun PASS. The
  first run reached and captured the real clear but the ignored harness read phase only
  after PNG encoding consumed the 200 ms Core clear interval (`actual 'active'`,
  `expected 'line-clear'`). It was corrected to retain the already-read locked state
  before capture; no product source changed.
- Every product checkpoint staged exact paths, inspected the cached path list, and
  passed `git diff --cached --check`. No push was performed.

### Final browser evidence inspected

- Loaded-font and blocked-font outputs are under ignored
  `.local/slice-kr-writer/layout-preflight/`, with `metrics.json` in each root and the
  blocked-font run under `fallback/`. The matrix covers 1440 × 900 DPR1,
  2048 × 1152 DPR1, 390 × 844 DPR3, 844 × 390 DPR3, and 360 × 800 DPR1 across home,
  library, Classic, Race, and Puzzle.
- All 15 gameplay rows in both font conditions had body/key/goal width overflow 0,
  exact 2:1 board geometry, one valid canvas, and unexpected errors `[]`. Loaded pages
  resolved Space Grotesk and Noto Sans SC in all 15 gameplay cases; fallback pages
  deliberately blocked all 15 Google CSS requests and remained geometrically and
  typographically valid.
- The final 844 × 390 keyboard panel measured scroll/client widths 265/265, the board
  measured 129 × 258, and Next remained visible at 67 × 72. The 360 Puzzle goal kept
  equal scroll/client widths at 18 px. Desktop and compact Classic/Race/Puzzle dividers
  had no doubled, half-width, or dangling boundary.
- The prescribed action artifacts are
  `.local/slice-kr-writer/final-action-client/shot-2.png` and `state-2.json`.
  The renderer review artifact is
  `.local/slice-kr-writer/renderer-client-game/shot-1.png`. Each relevant final capture
  was opened at original detail.
- All-level and real-clear outputs are under ignored
  `.local/slice-kr-writer/all15-postclear/`; `results.json` records the assertions.
  Desktop 1440 and mobile 390 DPR3 each selected and started all fifteen levels through
  visible controls. Every level matched its exact Puzzle ID and authored active/Next
  pair, exposed all seven locked types `IJLOSTZ`, used one canvas and zero DOM cells,
  kept exact 2:1 board geometry, had no overflow, and recorded errors `[]`.
- All thirty level PNGs were individually opened at original detail. They show varied
  authored stacks, cohesive locked/active/Next pieces, complete exterior Ghosts, and
  intact desktop/mobile controls and copy.
- The real Level 1 route reached its first clear at lock 1 on both sizes. Captured clear
  state was `phase = line-clear`, `lines = 0`, `placedPieces = 1`, `active = null`,
  `next = L`; post-clear state was `phase = active`, `lines = 1`,
  `placedPieces = 1`, `active = L`, `next = O`. Desktop and mobile line-clear/post-clear
  PNGs were opened at original detail and visibly agree with those canonical states.

### Handoff

- Blocker: none.
- Push: not performed; coordinator owns acceptance, changelog, and push.
- Next: independent read-only static/functional and visual QA audits exact source range
  `41b29ab08a06bfb51ebdc80b054f625281876f6c..e38c55c`; if accepted, the coordinator
  records the changelog disposition and pushes the branch.

## 2026-07-17 — SEMANTIC STATISTICS / LANDSCAPE ACTION REPAIR CANDIDATE READY

- Task: `TETRIS-T5-MINERAL-SEMANTIC-REPAIR-012`.
- Branch/base: `codex/tetris-recovery` at
  `bcc25d6ce8a9556f8471b67c8770a92ebd5123de`; intake was clean.
- Frozen product tip/range:
  `effb353c0a4d1bef26fa524ed38d3d3653f45eb8` and
  `bcc25d6ce8a9556f8471b67c8770a92ebd5123de..effb353c0a4d1bef26fa524ed38d3d3653f45eb8`.
- Ordered checkpoints:
  1. `5b1d486` — `fix(ui): bind stat roles and contain mode actions`; changed only
     `src/App.tsx`, `src/styles.css`, and `src/App.test.ts`.
  2. `effb353` — `fix(ui): reserve active arrow travel`; changed only
     `src/styles.css`.
- Every Classic, Race, and Puzzle statistic article now owns an explicit
  `data-stat-role`. Grid spans and dividers use only those roles; the direct App test
  freezes all three role sets and rejects `nth-child`, `nth-of-type`, `odd`, or `even`
  in every `.run-stats` selector.
- Desktop Puzzle keeps full-width level/objective around the placed/lines pair;
  compact Puzzle keeps the coherent 2 × 2 role grid. Classic and Race retain their
  accepted full-width final statistic on desktop and three-column compact band.
- The 844 × 390 mode grid now allocates an intrinsic action column. A separate 2 px
  inline-end capacity contains the accepted active-arrow travel without clipping or
  changing its motion, label, 1 px border, 9 px radius, or 44 px action height.
- No renderer/theme, Core, runtime/input/audio, `index.html`, dependency, evidence,
  coordinator-document, changelog, or `progress.md` path changed. `frontend-design`
  and `develop-web-game` were followed; the active allowlist routes progress here.

### Verification actually run

- Targeted `npm.cmd run test -- src/App.test.ts` passed after each source claim:
  1 file / 4 tests; jsdom printed only its known non-failing Canvas diagnostic.
- The first loaded matrix found the accepted arrow's 2 px transform in Marathon
  action `scrollWidth` (73/71), producing the explicit second checkpoint above. All
  earlier gate results were treated as pre-final and not reused.
- After `effb353`, exactly one final `npm.cmd run typecheck` passed; exactly one final
  `npm.cmd run test` passed (40 files: 39 passed / 1 skipped; 258 tests:
  256 passed / 2 skipped); exactly one final `npm.cmd run build` passed with
  739 transformed modules.
- Prescribed client command:
  `node 'C:\Users\Alex Chen\.codex\skills\develop-web-game\scripts\web_game_playwright_client.js' --url http://127.0.0.1:4173/ --actions-file 'C:\Users\Alex Chen\.codex\skills\develop-web-game\references\action_payloads.json' --click-selector '[data-testid="enter-marathon"]' --iterations 3 --pause-ms 250 --screenshot-dir '.local\slice-kr2-writer\final-action-client'`
  passed; final state was internal `marathon` / visible Classic, playing, score 98,
  placed pieces 3, active Z, Next L. `shot-2.png` was inspected at original detail.
- Fresh matrix commands `node .local\slice-kr2-writer\layout-preflight.mjs` and
  the same command after PowerShell `$env:BLOCK_FONTS = '1'` each passed
  5 home plus 15 game scenarios at 1440 × 900 DPR1, 2048 × 1152 DPR1,
  390 × 844 DPR3, 844 × 390 DPR3, and 360 × 800 DPR1.
- Loaded fonts resolved Space Grotesk and Noto Sans SC in 15/15 games. The blocked run
  intercepted the Google request in 15/15 games; its only console message was the
  expected aborted-resource `net::ERR_FAILED`, with no unexpected error.
- At 844 × 390 in both runs, mode button scroll/client widths were 712/712, 355/355,
  and 356/356; all three actions were 73/73 and 73 × 44, remained inside the button
  and shared surface, and showed the complete rounded arrow. All three game boards
  were 129 × 258 with one canvas, no overflow, and exact semantic role/divider maps.
- Loaded/fallback metrics are under ignored
  `.local/slice-kr2-writer/layout-preflight/`; both `metrics.json` files record zero
  failures. Existing contract captures inspected at original detail include both
  844 home conditions, desktop and compact three-mode statistics, blocked-font compact
  Puzzle, and the final action-client board. No extra screenshot was added.

### Handoff

- Blocker: none. Push: not performed.
- Next: independent read-only static/functional and visual/browser QA audits exact
  source range `bcc25d6..effb353`; the coordinator owns acceptance, changelog, and push.

## 2026-07-18 — DIVIDED COHESIVE FACETS CANDIDATE READY

- Task: `TETRIS-T5-MINERAL-DIVIDED-FACETS-013`.
- Branch/intake: clean `codex/tetris-recovery` at
  `028c1580cec7eff92013db614b40491fa4eac9d6`.
- Contract checkpoint: `423d2e3` — `docs(t5): define divided cohesive facets`;
  changed only `DESIGN.md` and `CURRENT_TASK.md`.
- Frozen product checkpoint: `acaf40589a2a4e802f0cfcd253f0c37161f3219d` —
  `feat(render): divide cohesive mineral facets`; changed only
  `src/game/render/TetrisRenderer.ts`, `presentation.ts`, `presentation.test.ts`,
  `theme.ts`, and `theme.test.ts`.
- The exact palette, layout, rules, copy, and `index.html` remain unchanged. Separate
  material components retain the larger board-well channel; each joined component now
  keeps every shared unit boundary as a narrower dark groove plus lower/right light
  lip over the continuous material base.
- Filled cells add a restrained inset top/left signal and bottom/right dark chamfer,
  while the joined component retains the stronger outer bevel. Active, locked, Next,
  Ghost, and fragmented groups reuse the same deterministic seam enumeration.

### Verification actually run

- Focused `npm.cmd run test -- src/game/render/presentation.test.ts
  src/game/render/theme.test.ts` passed 4 files / 17 tests. The seven canonical pieces
  expose exact seam counts `I=3`, `O=4`, and `T/S/Z/J/L=3`, with no duplicate seam;
  split-fragment coverage also passed.
- Final `npm.cmd run typecheck` passed. Final `npm.cmd run test` passed 40 files
  (39 passed / 1 skipped) and 258 tests (256 passed / 2 skipped). Final
  `npm.cmd run build` passed with 739 transformed modules.
- The prescribed client initially failed before product execution because the skill
  directory could not resolve package `playwright`. The environment issue was closed
  first by installing Playwright only under
  `C:\Users\Alex Chen\.codex\skills\develop-web-game` and installing its Chromium
  runtime; repository dependency files stayed unchanged. The same prescribed client
  then passed three iterations against Classic with no error artifact. Final text state
  was playing, 3 placed pieces, score 104, active Z, and Next L; `shot-0.png` and
  `shot-2.png` were opened at original detail under ignored
  `.local/slice-kr3-action/`.
- A visible-control all-level browser pass captured all fifteen Puzzle boards under
  ignored `.local/slice-kr3-visual/all-layouts/`: 15/15 captures, all seven materials
  in every board, and errors `[]`. The contact sheet and Level 8 board were inspected
  at original detail.
- The fresh exact-source matrix under ignored `.local/slice-kr3-final-matrix/` is tied
  to full source SHA `acaf40589a2a4e802f0cfcd253f0c37161f3219d`. It produced 23
  screenshots across 1440 × 900, 2048 × 1152, 390 × 844 DPR3, 844 × 390 DPR3, and
  360 × 800 with errors `[]`; loaded and blocked-font paths both passed.
- Original-detail review covered dense Level 8, three-lock portrait Puzzle, landscape
  Classic, narrow Level 15, and wide Race. Larger external board-well channels remain
  visibly dominant over the finer internal grooves; active, locked, Next, and Ghost
  retain readable unit divisions and one connected outer silhouette at every size.
  The matrix also passed three normal-gravity locks, Race top-out, Level 1 completion
  at 35 pieces / 22 lines, one canvas, zero DOM cells, exact 2:1 boards, 44 px controls,
  lifecycle teardown, and zero unexpected console/page errors.

### Handoff

- Blocker: none. Push: not performed.
- Next: independent read-only static/functional and visual/browser QA audit exact
  source range `423d2e3..acaf405`. If accepted, the coordinator regenerates formal T5
  evidence for the new source, records the changelog disposition, and decides push.
