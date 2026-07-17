# Current Task — T5 Rules Repair and Tetris Frontend Redesign

Branch: `codex/tetris-recovery`

Core/rule authority: `4c8582854088695ebac90467842dc2bc0cef3a20`

Current historical ancestor: `dd7e31ea3547c18a797b2308f04161310d1412ce`
(rejected T4 presentation candidate)

Preserved rejected follow-up: local branch
`codex/tetris-t4-rejected-preservation` at
`1362c664629b2a83f0659f836259b84c21750fee`

Status: **active — both prior T5 frontend presentations are rejected; light neo-tech
minimal replacement slice active**

## User-visible problems to resolve

1. Replace both rejected T5 frontends and block treatments with an original light
   cyan/light-blue, high-contrast, neo-tech minimal interface named only `Tetris`.
2. Add a dedicated entry page with separate Marathon, Race, and Puzzle entrances.
3. Make Race endless accelerating normal play. It has no line target and stops only
   through player exit or top-out.
4. Rebuild Puzzle as normal continuous play over harder authored starting boards:
   automatic gravity, replenishing seeded seven-bag input, no finite piece budget,
   every level unlocked, and at least two proven successful routes per level.
5. Keep all level layouts, copy, frontend composition, block language, and assets
   original. Similar games are abstract mechanics research only.
6. Remove the current engineering-dashboard vocabulary, oversized slogan, custom
   brand glyph, `青流方阵` name, grid/coordinate/route decoration, clipped corners,
   oversized level cards, rounded ceramic/jelly blocks, stepped mode bands, legacy
   `路线` copy, and bracket-style ghost cells.

## Baseline policy

- Do not reset or rewrite `dd7e31e`; it remains a historical ancestor.
- Do not merge the rejected T4 preservation branch into T5.
- Migrate the valid 44 px and real-UI QA requirements into T5, not the old T4 styling.
- Do not modify T3/T4 screenshots, manifests, fixtures, capture scripts, or logs.
- New fixtures, logs, and browser evidence use T5-specific paths.
- Frontend candidate `b480e7db93aa7b6f2b2a1feb160985f4aa42e493` and its evidence
  child `9b7e552e83426d5578d86010571a4cbce83616ac` are rejected visual history.
  They must not be pushed or described as the current frontend baseline.
- Frontend candidate `c9135f3252abfa3bd6d7e94c5eb2e11fc3c72a18` is the second
  presentation rejected by the user. It must not be accepted through local font or
  copy fixes and is not the visual baseline for the next writer.
- Preserve from `c9135f3` only the verified lifecycle, accessibility, input/rule
  behavior, and detached `structuredClone` QA snapshot regression. Its rounded mode
  bands, ceramic cell material, page composition, and copy are superseded.

## Slice A — T5 Core

Task ID: `TETRIS-T5-PUZZLE-NORMALPLAY-002`

The Race and leaderboard work in candidate `3bf170ec252cc971b1f65d73b4649fabb2500dbb`
remains eligible. Its finite authored Puzzle queues, budget failures, no-gravity rule,
and single-route fixtures are superseded. The uncommitted removal of the live
`replayScenario` state-injection surface is retained as part of this slice.

The core writer may change only:

- `src/game/core/constants.ts`, `engine.ts`, `puzzles.ts`, `types.ts`, `random.ts`, and
  `index.ts` if public exports require it;
- directly related tests under `src/game/core/*.test.ts`, including a new focused
  Puzzle-flow test if useful;
- `src/game/runtime/qaScenario.ts`, `qaScenario.test.ts`, `GameRuntime.ts`, and
  `GameRuntime.test.ts` to migrate obsolete finite-Puzzle QA and permanently remove
  live state-replacement/replay injection;
- `src/leaderboard.ts` and `src/leaderboard.test.ts` for endless-Race records;
- `src/puzzleProgress.test.ts` only to replace hard-coded old 3–5-piece completion
  fixtures; `src/puzzleProgress.ts` remains forbidden;
- `src/game/render/presentation.test.ts` only to replace hard-coded old Puzzle queue
  expectations; renderer/presentation production files remain forbidden;
- `docs/workstreams/tetris-t3-rules/tests/campaign.verifier.test.ts` only to decouple
  frozen T3 evidence from current T5 production definitions and verify the unchanged
  historical artifacts internally; T3 fixtures/logs remain forbidden and the test
  must stay in full Vitest discovery;
- new or revised `docs/workstreams/tetris-t5-core/**` authoring helpers, fixtures, and
  `THREAD_LOG.md`.

The core writer must not edit `src/App.tsx`, `src/styles.css`,
`src/puzzleProgress.ts`, `src/game/render/**`, T3/T4 evidence, coordinator docs,
changelog, or the frontend log.

Core acceptance:

- no Race line count produces `finished`;
- Race speed uses locked pieces plus cleared lines, grows monotonically, and reaches
  its safe cap;
- each Puzzle definition has one stable seed and an original 8–12-row board meeting
  the topology constraints in `DESIGN.md`; numeric difficulty and finite queues/budgets
  are removed from production authority;
- Puzzle shares Marathon automatic gravity, scoring, SRS, lock/entry/clear timing, and
  continuously replenishing deterministic seven-bag generation;
- sampling 84 pieces per level proves twelve full seven-bags without exhaustion;
- every level has two deterministic successful public-command routes for the same seed,
  each using 18–35 pieces and meeting the semantic route-diversity metrics in
  `DESIGN.md`; verifier execution uses 70 locks only as a non-product guard;
- canonical board empty is success; an unsolved board never fails because a queue or
  budget ended, and normal top-out remains the gameplay failure;
- restart produces the exact authored board, seed, randomizer, and hash;
- mounted runtime exposes no replay or canonical-state replacement hook;
- focused tests and the new T5 verifier pass;
- after the last Core source change, one typecheck, one complete Vitest suite, and one
  build pass without weakening or deleting historical evidence checks;
- candidate SHA and exact evidence are logged before independent read-only QA.

## Slice B — T5 Frontend

Task ID: `TETRIS-T5-FRONTEND-001`

Base SHA: `630fb30e115db9d0b4e6328e679987f9e8608939`

Core QA result: **ACCEPT** — focused 22 files / 140 tests, typecheck, and diff check
passed independently.

Frontend result: **REJECTED BY USER** at candidate `b480e7d`; coordinator evidence
child `9b7e552` is obsolete. The path list and acceptance bullets below are retained as
historical slice evidence only and do not authorize further Aqua Blueprint work.

The frontend writer may change only:

- `src/App.tsx`;
- `src/styles.css`;
- `src/puzzleProgress.ts` and `src/puzzleProgress.test.ts`;
- `src/game/render/theme.ts`;
- `src/game/render/TetrisRenderer.ts`;
- `src/game/render/presentation.ts` and its test when necessary;
- new components under `src/ui/**`;
- directly related frontend/presentation tests when required;
- new `docs/workstreams/tetris-t5-frontend/THREAD_LOG.md`.

The frontend writer must not change core rules, Puzzle definitions/fixtures, build
configuration, dependencies, T3/T4 evidence, changelog, or coordinator docs.

The rejected slice's detailed visual acceptance is archived in its workstream log.
Only its verified lifecycle, accessibility, progress, and mode-rule behavior may be
retained; its brand, page composition, CSS language, and cell renderer are forbidden
as the new visual baseline.

## Coordinator final integration

After both accepted slices and the last product change, run exactly one final:

1. `npm.cmd run typecheck`;
2. `npm.cmd run test`;
3. `npm.cmd run build`;
4. T5 browser-evidence pass at every required viewport.

Browser evidence must use visible UI, exercise at least three consecutive Puzzle locks
under automatic gravity, and compare visible level, placed-piece count, active piece,
and Next preview with canonical state. Internal state replacement is not valid setup
evidence.

The coordinator routes the exact combined candidate to independent read-only QA,
resolves findings with newly bounded writer slices, updates
`docs/logs/CHANGELOG.md`, commits the documentation delta, and decides whether to push.

## Slice C — final QA snapshot isolation fix

Task ID: `TETRIS-T5-FINAL-QA-FIX-001`

Base SHA: `9b7e552e83426d5578d86010571a4cbce83616ac`

Independent final QA result on the base: **REJECT** with one blocker. The DEV-only
`window.__TETRIS_D4_QA__.collect()` surface returns the object from
`GameRuntime.getState()` directly, so page script can mutate canonical state through
the returned reference. All other audited areas passed, including the visual review,
evidence checksums, `index.html` boundary, typecheck, and targeted tests.

Status: **superseded as a standalone slice**. The exact state-isolation requirement is
carried into Slice D so no work continues against the rejected visual candidate.

The frontend fix writer may change only:

- `src/App.tsx`;
- one directly related frontend test file under `src/**` when needed;
- `docs/workstreams/tetris-t5-frontend/THREAD_LOG.md`.

The writer must not change `GameRuntime`, core rules, renderer, styles, Puzzle data,
dependencies, `index.html`, coordinator documents, changelog, or any committed browser
evidence. The implementation must make `collect().state` a detached structured clone
without adding any state setter, replay injector, or replacement hook. A regression
test must mutate nested fields of the returned snapshot and prove the source canonical
state is unchanged.

After the fix candidate is independently accepted, the coordinator regenerates the
T5 browser evidence against the exact new product SHA, reruns the final gates required
after the last source change, and routes the exact evidence child to independent QA
before changelog integration or push.

## Slice D — clean light `Tetris` frontend replacement

Task ID: `TETRIS-T5-FRONTEND-REDESIGN-002`

Result: **REJECTED BY USER** at candidate
`c9135f3252abfa3bd6d7e94c5eb2e11fc3c72a18`. Independent review additionally found
8–11 px mobile statistic text and legacy `路线` copy. The slice below is historical
evidence only and grants no further write authority.

Base SHA: coordinator documentation child of
`1ec551ef902bd331b411cee95e35d2f8e879eb51`.

The frontend writer may change only:

- `src/App.tsx` and `src/styles.css`;
- `src/game/render/theme.ts` and `src/game/render/TetrisRenderer.ts`;
- `src/ui/ActionSheet.tsx`;
- new or directly related frontend/renderer tests under `src/**`;
- `docs/workstreams/tetris-t5-frontend/THREAD_LOG.md`.

The writer must not change `index.html`, dependencies, Vite/build configuration,
`src/game/core/**`, Puzzle definitions/references, `GameRuntime`, input/audio/storage
semantics, `puzzleProgress.ts`, `presentation.ts`, coordinator documents, changelog,
historical T3/T4 evidence, or committed T5 browser evidence.

Implementation requirements:

- preserve the existing conditional `home → puzzle-library → game` lifecycle, the
  `GameSession` key, async mount disposal guard, media-query cleanup, pointer capture,
  and exact one-runtime/one-canvas teardown behavior;
- use plain text `Tetris` for visible branding, the canvas label, and startup live
  message; remove `青流方阵`, its glyph, English brand subtitle, blueprint labels,
  coordinates, route decoration, page grid, diagonal band, ticks, cut corners, and
  giant marketing copy;
- home: compact introduction plus three 96–112 px rounded horizontal mode bands,
  lightly stepped on desktop and all visible without scroll at 390 × 844;
- Puzzle: compact six-row selector plus selected details; desktop uses list/detail
  columns, mobile expands the selected row in place; no sticky overlay may cover a row;
- game: one coherent rounded surface with a dominant board and one right information
  rail on desktop, compact information above the board on mobile, and controls aligned
  with that surface; retain existing test IDs and DOM geometry anchors;
- renderer: rounded ceramic cells with same-hue lower edge and restrained top
  highlight; active/locked/ghost remain distinguishable; ghost is a complete rounded
  outline; Board and Next reuse the primitive; remove cut corners, universal thick
  outline, bracket ghost, blueprint ticks, and Pixi `NEXT` text duplication;
- DEV `__TETRIS_D4_QA__.collect().state` is a detached structured clone. Direct tests
  mutate snapshot `status`, `active.x`, `queue[0]`, and a nested board cell and prove
  canonical runtime state and nested identities remain isolated;
- visible mobile body copy is at least 12 px, statistics at least 14 px, touch labels
  at least 11 px; every button remains at least 44 × 44 CSS px;
- retain reduced-motion, accessible action-sheet, keyboard/touch, mode rule, all-level
  availability, continuous Puzzle stream, and endless Race behavior unchanged.

Writer validation order: targeted frontend tests while editing, then after the final
source change one typecheck, one complete Vitest suite, one production build, and a
writer browser smoke at desktop plus 390 × 844 and 360 × 800. Record exact paths,
commands, screenshots inspected, and candidate SHA; do not push.

After the writer candidate, independent read-only visual/functional QA must accept the
exact SHA before the coordinator replaces all obsolete T5 browser evidence across the
five required viewports. Only the final evidence child may proceed to changelog and
push.

## Slice E — light neo-tech minimal `Tetris` frontend

Task ID: `TETRIS-T5-FRONTEND-TECH-MINIMAL-003`

Product source baseline:
`c9135f3252abfa3bd6d7e94c5eb2e11fc3c72a18`

Writer base: the coordinator documentation commit that introduces this Slice E
directly above the product baseline.

The single frontend writer may change only:

- `src/App.tsx`;
- `src/App.test.ts`;
- `src/styles.css`;
- `src/game/render/theme.ts`;
- `src/game/render/TetrisRenderer.ts`;
- `src/ui/ActionSheet.tsx`;
- one new directly related renderer test under `src/game/render/**` if required,
  excluding `presentation.ts` and `presentation.test.ts`;
- `docs/workstreams/tetris-t5-frontend/THREAD_LOG.md`.

The writer must not change:

- `index.html`;
- `package.json`, `package-lock.json`, `vite.config.*`, or `tsconfig*.json`;
- `src/main.tsx`;
- `src/game/core/**`, `src/game/runtime/**`, `src/game/input/**`, or
  `src/game/audio/**`;
- `src/game/render/presentation.ts` or `presentation.test.ts`;
- `src/puzzleProgress.ts`, `src/puzzleProgress.test.ts`, `src/leaderboard.ts`, or
  `src/leaderboard.test.ts`;
- `DESIGN.md`, `CURRENT_TASK.md`, `progress.md`, or `docs/logs/CHANGELOG.md`;
- `docs/qa/evidence/**`, historical T3/T4 workstreams/evidence, or existing committed
  T5 evidence.

Implementation requirements:

- preserve the conditional `home → puzzle-library → game` lifecycle, `GameSession`
  key, asynchronous mount disposal guard, media-query cleanup, pointer capture, and
  exact one-runtime/one-canvas teardown behavior;
- preserve the detached `collect().state` structured clone and the direct regression
  that mutates `status`, `active.x`, `queue[0]`, and one nested board cell without
  changing canonical state or nested identities;
- keep home and Puzzle library at zero runtimes and zero canvases; gameplay mounts
  exactly one Pixi runtime/canvas and never creates a DOM gameplay cell grid;
- use plain-text `Tetris`, the frozen light neo-tech minimal tokens, a single 1+2 mode
  surface, and the one-shot `phase seam`; do not reintroduce grids, CAD, scanlines,
  technical English decoration, badges, toy/glass styling, marketing hero copy,
  settings rows, floating card piles, or stepped rounded bands;
- the small selected-mode visual, if present, uses an original four-cell edge-lit
  plate composition and remains functional/subordinate rather than a brand mark;
- Puzzle stays one coherent all-enabled selection surface. `App.tsx` may read-only
  import the existing `CAMPAIGN_LEVELS` initial boards to derive one SVG/path
  silhouette, but it must not copy, mutate, or redefine canonical Puzzle data;
- the game stays one coherent surface with a flat information dock and one integrated
  five-action control deck;
- renderer cells use the 3–4 px edge-lit plate primitive in both Board and Next, with
  no white highlight bar, thick lower lip, ceramic/jelly bevel, detached unit shadow,
  universal dark outline, cut corner, or bracket ghost;
- remove player-visible legacy `路线` copy. Use `解法`, `本局`, or `对局` only when
  semantically correct;
- at 390 × 844 and 360 × 800 all three mode entrances are completely visible. At
  844 × 390 there is no clipped copy, overlap, horizontal overflow, or accidental page
  scroll;
- computed mobile body/touch copy is at least 12 px, statistic labels at least 14 px,
  statistic values at least 18 px, and every button at least 44 × 44 CSS px;
- preserve reduced motion, accessible action sheets, keyboard/touch controls,
  all-level Puzzle availability, continuous deterministic Puzzle play, and endless
  Race behavior unchanged.

Writer validation order: targeted frontend tests while editing, then after the final
source change one typecheck, one complete Vitest suite, one production build, and one
browser smoke covering 1440 × 900, 2048 × 1152, 390 × 844, 360 × 800, and 844 × 390.
The writer must inspect the actual captures, record computed text/button sizes and
exact changed paths in the workstream log, create one candidate commit, and not push.

After the candidate, independent read-only visual and functional QA must accept the
exact SHA before the coordinator regenerates T5 evidence or updates the changelog.

## Slice F — narrow Puzzle goal and portable evidence correction

Task ID: `TETRIS-T5-FRONTEND-NARROW-COPY-FIX-005`

Base SHA: coordinator contract child of rejected evidence commit
`221c8218b338abeaae6be4e3d73d24fb74550c76`.

Status: **active — final QA rejected the first formal Slice E evidence child with two
bounded findings**.

Independent visual QA found that `narrow-puzzle-360x800.png` ellipsizes the essential
Puzzle goal to `清空完整棋...`. Independent static QA also found that the evidence
generator hashed the Windows CRLF working-tree bytes of `browser-evidence.json`, while
Git stored the normalized LF blob; exact-commit verification therefore matched only
17 of 18 listed evidence files. All other visual, interaction, scope, and evidence
checks passed.

The single frontend fix writer may change only:

- `src/styles.css`;
- `docs/workstreams/tetris-t5-frontend/THREAD_LOG.md`.

The writer must not change `App.tsx`, renderer/theme, tests, Core/runtime/Puzzle data,
`index.html`, dependencies/build configuration, coordinator documents, changelog, or
any evidence path.

Product acceptance:

- at 360 × 800 Puzzle gameplay shows the complete `清空完整棋盘` value with no
  ellipsis or clipping and computed `scrollWidth <= clientWidth`;
- statistic labels remain at least 14 px, values remain at least 18 px, touch labels
  remain at least 12 px, and all visible buttons remain at least 44 × 44 CSS px;
- the fix redistributes narrow Puzzle statistic space rather than hiding copy,
  scaling the page, or changing gameplay content;
- 390 × 844 Puzzle, 844 × 390 gameplay, all mode-home layouts, Board/Next geometry,
  one-canvas/zero-DOM-cell behavior, and all accepted rules remain unchanged;
- after the final source change, run one typecheck, one complete Vitest suite, one
  production build, and a bounded 360/390/844 browser comparison; inspect the actual
  captures, log exact computed values, create one candidate commit, and do not push.

After independent read-only product QA accepts the exact fix candidate, the
coordinator may change only `docs/qa/evidence/tetris-t5/**` to:

- write generated JSON and checksum text with explicit LF bytes before hashing;
- regenerate all 16 first-viewport captures against the accepted product SHA;
- prove every `SHA256SUMS.txt` entry against the exact commit's raw Git blobs;
- route the new evidence child through independent static, browser, and visual QA
  before changelog integration or push.
