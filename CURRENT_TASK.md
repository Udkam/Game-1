# Current Task — T6 Three Independent Mode Rules

Branch: `codex/tetris-recovery`

Core/rule authority: `4c8582854088695ebac90467842dc2bc0cef3a20`

Current historical ancestor: `dd7e31ea3547c18a797b2308f04161310d1412ce`
(rejected T4 presentation candidate)

Preserved rejected follow-up: local branch
`codex/tetris-t4-rejected-preservation` at
`1362c664629b2a83f0659f836259b84c21750fee`

Status: **ACTIVE — T5 remains accepted at product source `48176fe`; T6 changes only
Classic/Survival/Puzzle rule identity, Survival bedrock rendering, and matching
statistics/QA bindings**

## Slice L — three independent mode rules

Task ID: `TETRIS-T6-THREE-DISTINCT-MODES-017`

Contract base: accepted and pushed T5 coordinator tip
`c0340b1d3e30007473da6a7a4ec0fed72a22df38`.

User-visible outcome:

- Classic is fixed-speed chain-score survival: 48 ticks per automatic cell for the
  full run; consecutive clearing pieces build a visible `连消` counter and score
  bonus, while any non-clearing lock breaks the chain;
- Survival replaces player-facing Race: it uses Classic's fixed 48-tick gravity and
  raises one permanent, unbreakable bedrock row from the bottom for every five
  cumulative cleared lines;
- Puzzle shares Classic's fixed 48-tick speed but starts from one of fifteen authored
  legal endgames and wins only when the complete canonical board becomes empty.

Core writer boundary:

- `src/game/core/constants.ts`, `src/game/core/board.ts`,
  `src/game/core/engine.ts`, and `src/game/core/types.ts`;
- directly related tests under `src/game/core/*.test.ts`;
- `src/game/render/theme.ts`, `src/game/render/TetrisRenderer.ts`, and their directly
  related tests only for the minimum type-safe bedrock material/render binding;
- `docs/workstreams/tetris-t5-core/THREAD_LOG.md` after the source checkpoint.

Atomic boundary exception: canonical bedrock widens `BoardCell` from
`PieceType | null` to `PieceType | BedrockCell | null`. The same source checkpoint
must therefore bind a real bedrock material and renderer path; casting the sentinel to
`PieceType`, leaving an undefined material lookup, or committing a typechecking but
runtime-broken intermediate state is forbidden. This exact Core + renderer bridge is
pre-authorized despite crossing the normal subsystem boundary and remains within the
default ten-path checkpoint budget.

Core acceptance:

- Classic, Survival, and Puzzle remain at 48 ticks after any line or piece count;
- Classic and Survival use fixed base line-clear scores `40 / 100 / 300 / 1200`;
  Classic alone adds `50 × (combo - 1)` after the first consecutive clearing piece;
- Classic combo starts at `0`, becomes `1` on the first clearing piece, increments on
  every immediately consecutive clearing piece, and resets on a non-clearing lock;
  Survival and Puzzle remain at combo `0` and receive no combo bonus;
- Classic and Survival keep compatibility `state.level` exactly `0` and emit no
  `level-up`; Puzzle alone preserves its invisible accepted score/event serialization
  so the thirty frozen solution event digests and final hashes remain unchanged, but
  gravity, UI, and success never read that level;
- Survival's internal key remains `race`, but it has no speed curve or successful
  line-count terminal state;
- each crossed five-line threshold clears/scores first, then shifts the remaining
  board up and adds one full bedrock row; bedrock blocks pieces, never clears, and
  overflow from the top ends the run before the next spawn;
- restart reconstructs zero bedrock, while deterministic replay/hash includes the
  canonical bedrock state and height;
- Puzzle board-empty success and continuous seeded seven-bag input remain unchanged;
- focused Core tests and typecheck pass before an exact-path source checkpoint.

Frontend/renderer writer boundary after Core source is frozen:

- `src/App.tsx` and `src/App.test.ts`;
- `src/styles.css` only for the renamed semantic statistic role;
- `src/game/runtime/qaScenario.ts` and `src/game/runtime/qaScenario.test.ts` only to
  replace obsolete Race-speed evidence with real Survival bedrock evidence;
- `docs/workstreams/tetris-t5-frontend/THREAD_LOG.md` after the source checkpoint.

Frontend acceptance:

- Classic statistics are exactly score, cleared lines, and current `连消`;
- no player-facing or DEV text snapshot describes a Classic level; the detached text
  snapshot exposes the current combo instead;
- every visible `竞速` label becomes `生存`; Survival statistics are score, cleared
  lines, and bedrock height, with no speed-tier copy;
- bedrock renders as a restrained coherent mineral stratum compatible with the frozen
  palette, visibly distinct from all seven tetromino materials and retaining readable
  unit seams;
- Puzzle retains its existing level/placed/cleared objective statistics;
- no layout, ordinary tetromino theme/geometry, control, countdown, dependency, or
  `index.html` change is authorized;
- focused App tests, typecheck, and the prescribed browser action client pass.

After the two source checkpoints, the coordinator runs exactly one final typecheck,
complete test suite, build, and browser-evidence pass. Each source boundary receives
independent read-only cross-QA. Formal evidence, changelog integration, and push occur
only after both verdicts accept the exact combined source candidate.

## User-visible problems to resolve

1. Keep the page named only `Tetris`, preserve the accepted composition and divided
   facet geometry, and apply only the exact coordinated `雾昼矿物` light retone frozen
   in `DESIGN.md`.
2. Keep the dedicated entry page with separate Classic (`经典`), Race, and Puzzle
   entrances. The internal `marathon` key remains compatibility-only.
3. Make Race endless accelerating normal play. It has no line target and stops only
   through player exit or top-out.
4. Rebuild all fifteen Puzzle levels as difficult authored endgames generated from
   explicit legal tetromino stacking histories: automatic gravity, replenishing seeded
   seven-bag input, no finite piece budget, every level unlocked, exact source-piece
   colors, and at least two proven successful routes per level.
5. Keep all level layouts, copy, frontend composition, block language, and assets
   original. Similar games are abstract mechanics research only.
6. Remove the current engineering-dashboard vocabulary, oversized slogan, custom
   brand glyph, `青流方阵` name, grid/coordinate/route decoration, clipped corners,
   oversized level cards, rounded ceramic/jelly blocks, stepped mode bands, legacy
   `路线` copy, and bracket-style ghost cells.
7. Remove repeated descriptions of ordinary play. Visible copy is limited to names,
   controls, score/statistics, completion state, and the immediate objective; full
   ARIA labels remain available without duplicating prose visually.

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
- Local commit `e552b3c86e59b801f6d69045a94211e3f1c97e34` completed the rejected
  bright spectral surface immediately before the latest user review. It is a clean
  historical checkpoint only. It must not receive independent acceptance, formal
  evidence, changelog integration, or push.

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

Status: **PRODUCT ACCEPTED** at
`56288cde99f8121fd2bb6be51836385fb9d30883`; the old six-level formal evidence remains
rejected and is superseded by the later fifteen-level direction.

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

Independent read-only product QA accepted the exact two-path candidate: the complete
goal measured `clientWidth == scrollWidth` at 360/390/844, retained 18 px values and
44 px controls, and produced one canvas, zero DOM cells, no overflow, and no console
errors. Because the user then expanded the campaign, the coordinator does not
regenerate the obsolete six-level evidence. The final combined evidence must later:

- write generated JSON and checksum text with explicit LF bytes before hashing;
- regenerate the complete required first-viewport capture set against the accepted
  product SHA;
- prove every `SHA256SUMS.txt` entry against the exact commit's raw Git blobs;
- route the new evidence child through independent static, browser, and visual QA
  before changelog integration or push.

## Slice G — fifteen-level multi-color Puzzle core

Task ID: `TETRIS-T5-PUZZLE-CAMPAIGN-15-006`

Status: **CORE ACCEPTED** at
`48a229ef55b94d7b6e1de4ba88539bebb1909ec0`. Independent read-only QA accepted the
exact commit with a clean worktree and no blocking finding.

Product base: `56288cde99f8121fd2bb6be51836385fb9d30883`.

Writer base: `ef2d7472eeb2cf461c5408101f045207605334ec`.

The single Core writer may change only:

- `src/game/core/types.ts`;
- `src/game/core/puzzles.ts`;
- `src/game/core/puzzles.test.ts`;
- `src/game/core/puzzleCampaign.test.ts`;
- `src/game/core/puzzleFlow.test.ts`;
- `src/puzzleProgress.test.ts`;
- `docs/workstreams/tetris-t5-core/search-puzzles.mjs`;
- `docs/workstreams/tetris-t5-core/puzzle-references.json`;
- `docs/workstreams/tetris-t5-core/THREAD_LOG.md`;
- at most one new reference-builder helper under
  `docs/workstreams/tetris-t5-core/` when required.

The Core writer must not change `engine.ts`, `random.ts`, `puzzleProgress.ts`, React,
CSS, renderer/theme, runtime/input/audio, dependencies, `index.html`, coordinator
documents, changelog, or formal browser evidence.

Core acceptance:

- production exports exactly fifteen all-enabled definitions; the old six IDs, seeds,
  occupancy masks, and two route placement streams remain compatible;
- nine new definitions have original names, unique nonzero seeds, original occupancy
  masks, 9–12 occupied rows, six or more occupancy-row shapes, four density classes,
  covered cavities in five or more columns, and at least eight buried holes;
- every starting board is deterministically colorized with at least five piece types,
  and all seven types occur across the campaign; this salted color pass never consumes
  or changes the gameplay randomizer;
- geometry validation normalizes every occupied character before measuring topology,
  so colors cannot fake row-shape or cavity diversity;
- every seed still produces twelve consecutive complete seven-bags in the first 84
  pieces and replenishes indefinitely in production;
- every one of the fifteen levels has two same-seed 28–35-lock successful routes
  through production `createInitialState` and public `dispatch` only; each route uses
  all seven incoming types, six landing columns, six effective rotations, three setup
  locks, and three separated clear phases; paired routes have at least three semantic
  placement differences and an intermediate board-hash divergence;
- search may use at most two concurrent seed processes and unique ignored outputs;
  failed seeds/candidates are replaced rather than weakening route or topology gates;
- after the final Core source change, run one typecheck, one complete Vitest suite,
  one production build, and the complete 30-route verifier. Inspect exact generated
  references, log commands/results, create one Core candidate commit, and do not push.

Independent read-only Core QA must accept the exact Slice G candidate before Slice H
starts. A Core-only 15-level candidate is not releasable through the six-row frontend.

## Slice H — `经典`, multi-color palette, and fifteen-level library

Task ID: `TETRIS-T5-FRONTEND-CAMPAIGN-15-007`

Status: **FUNCTIONAL CANDIDATE READY** at
`248ca89551ce1293abe88e651c9953e132c816be`, but **VISUALLY REJECTED / SUPERSEDED** by
the user's request for a more premium page and bright redesigned blocks. It is a clean
fallback, not a release candidate and not eligible for formal evidence or push.

Product base: independently accepted Slice G candidate
`48a229ef55b94d7b6e1de4ba88539bebb1909ec0`.

Writer base: the coordinator acknowledgement commit that opens Slice H.

The single frontend writer may change only:

- `src/App.tsx`;
- `src/App.test.ts`;
- `src/styles.css`;
- `src/game/render/theme.ts`;
- one new focused `src/game/render/theme.test.ts` if useful;
- `docs/workstreams/tetris-t5-frontend/THREAD_LOG.md`.

The frontend writer must not change Core/Puzzle definitions or references,
`puzzleProgress.ts`, renderer logic, presentation/runtime/input/audio, dependencies,
`index.html`, coordinator documents, changelog, or formal browser evidence.

Frontend acceptance:

- all player-facing mode copy and accessibility labels say `经典`; no visible
  `马拉松` remains. Internal `marathon`, `enter-marathon`, and CSS mode keys remain
  unchanged for deterministic compatibility;
- Board and Next use the exact seven-piece mineral-signal palette frozen in
  `DESIGN.md`; it is more varied than the rejected blue-only set and does not use the
  standard commercial piece-color mapping or a toy-rainbow treatment;
- the canonical multi-color starting board is visible in gameplay. Any library
  silhouette groups canonical cells into a bounded number of SVG paths by piece type,
  not a DOM cell grid and not a copied decorative layout;
- every `六关`/`六个` hard-code is removed. Copy and aria derive the exact count from
  `CAMPAIGN_LEVELS.length`;
- desktop and 844 × 390 show one continuous 3 × 5 all-enabled level matrix beside the
  selected detail/start region, with all fifteen rows/buttons inside the first
  viewport at 844 × 390; 360/390 use a two-column matrix and a separate in-flow detail
  region, with normal library scrolling allowed;
- all fifteen entries stay mounted, enabled, keyboard/touch reachable, and carry the
  existing `level-row`, `data-level-id`, `aria-pressed`, and stable start selectors;
- real UI proves selection/start for the first, middle, and fifteenth levels and
  matches canonical `puzzleId`, name, active piece, Next, and multi-color locked cells;
- preserve the accepted 1+2 home, phase seam, complete 360 px goal, 44 px controls,
  12/14/18 px type floors, one-canvas lifecycle, accessibility, reduced motion,
  continuous Puzzle, and endless Race;
- after the final frontend source change, run one typecheck, one complete Vitest
  suite, one production build, and the five-viewport browser matrix. Inspect actual
  captures, log exact values, create one frontend candidate commit, and do not push.

Slice H's functional and responsive results carry into Slice I, but its visual QA was
stopped when the user rejected the finish. No Slice H formal evidence is regenerated.

## Slice I — premium spectral surface and bright precision blocks

Task ID: `TETRIS-T5-PREMIUM-BRIGHT-BLOCKS-008`

Status: **REJECTED BY USER** at local commit
`e552b3c86e59b801f6d69045a94211e3f1c97e34`. It is unpushed and is not eligible
for QA or evidence. The path list and acceptance bullets below are historical only and
grant no further Slice I authority.

Product base: rejected-as-final but functionally complete candidate
`248ca89551ce1293abe88e651c9953e132c816be`.

Writer base: the coordinator contract commit that opens Slice I.

The single frontend/render writer may change only:

- `src/App.tsx`;
- `src/App.test.ts`;
- `src/styles.css`;
- `src/game/render/theme.ts`;
- `src/game/render/theme.test.ts`;
- `src/game/render/TetrisRenderer.ts`;
- at most one new focused test under `src/game/render/`;
- `docs/workstreams/tetris-t5-frontend/THREAD_LOG.md`.

The writer must not change Core/Puzzle definitions, references or routes,
`puzzleProgress.ts`, presentation/runtime/input/audio, dependencies, `index.html`,
coordinator documents, changelog, or formal evidence.

Slice I acceptance:

- all 28 piece material values exactly match the bright luminous-spectrum table in
  `DESIGN.md`; no muted material from `248ca89` remains;
- Board and Next share one precision-slab renderer primitive with 1.25–2.5 px radius,
  one fine same-hue dark edge, no permanent inner perimeter, no detached unit shadow,
  and no candy/ceramic/mineral bevel. Active uses only a low-intensity light-color
  aura; locked is flat; Ghost is a full fine outline with at most 3% fill;
- canonical silhouettes use the same bright mapping, at most one path per present
  piece type, and no DOM gameplay grid;
- page refinement uses the exact `spectral glass light` tokens in `DESIGN.md`: ice
  base, near-white translucent surfaces, cyan/cobalt/violet state families, and coral
  only as a small Puzzle/selection signal. It replaces template-like flatness with
  controlled depth, tighter type/spacing hierarchy, and the single three-stop spectral
  rail. It does not add a dark neon theme, uncontrolled rainbow, decorative telemetry,
  repeating page grid, marketing hero, external font/asset, or copied trade dress;
- the 15-level matrix remains continuous. Selected state is unmistakable without
  becoming a floating card; repetitive cell copy is shortened without hiding names;
  at 360/390 the fifteenth odd item spans the two-column row instead of leaving an
  empty half-cell, and the selected detail remains outside/after the list;
- HUD, Next, statistics, and the five-action control deck read as one coherent game
  instrument rather than repeated rounded cards. All existing selectors, action order,
  labels, 44 px controls, 12/14/18 px floors, complete goal, and accessibility remain;
- visible `经典`, endless Race, continuous Puzzle, exact 15 all-enabled levels,
  first/eighth/fifteenth canonical bindings, seven locked colors, 1+2 mode home,
  reduced motion, and one-canvas/zero-DOM-cell lifecycle do not regress;
- the writer runs targeted theme/renderer/App tests while iterating and the prescribed
  real Playwright action client after each meaningful visual change. After the final
  product source change, run one typecheck, one complete suite, one production build,
  and one five-viewport browser matrix; inspect every library, home, and gameplay PNG,
  create one candidate commit, and do not push.

Independent read-only functional and visual QA must accept the exact Slice I candidate
before the coordinator regenerates explicit-LF formal evidence, updates the changelog,
or decides whether to push.

## Slice J — legal authored Puzzle endgames

Task ID: `TETRIS-T5-PUZZLE-AUTHORED-ENDGAMES-009`

Status: **ACCEPTED** at Core checkpoints `ee0d996` and `2d282b6`, with final frozen
product/source SHA `26ef004dc4ab11de8caeee6605bbe21044c5d950` after Slice J-R.
Independent read-only QA accepted the contiguous range
`50be21d70abab887051b85d412a102f0b77eb9d2..676d804c2be74b107d429c61639ecc03e70e6509`.

Product base: rejected visual checkpoint
`e552b3c86e59b801f6d69045a94211e3f1c97e34`; its accepted mode/runtime behavior
remains the deterministic base, but its visual result is not accepted.

Writer base: the coordinator documentation commit that opens Slice J directly above
the product base.

The single Core writer may change only:

- `src/game/core/puzzles.ts`;
- `src/game/core/puzzles.test.ts`;
- `src/game/core/puzzleCampaign.test.ts`;
- `docs/workstreams/tetris-t5-core/search-puzzles.mjs`;
- `docs/workstreams/tetris-t5-core/build-puzzle-references.test.ts`;
- `docs/workstreams/tetris-t5-core/puzzle-references.json`;
- at most one new directly related authoring/reference helper under
  `docs/workstreams/tetris-t5-core/`;
- `docs/workstreams/tetris-t5-core/THREAD_LOG.md`.

The Core writer must not change `engine.ts`, `random.ts`, `pieces.ts`, `board.ts`,
runtime/input/audio/render/frontend paths, `puzzleProgress.ts`, dependencies/build
configuration, `index.html`, coordinator documents, changelog, or formal browser
evidence.

Slice J acceptance:

- remove `BOARD_COLOR_SALT`, `colorizeBoardRows`, random hole excavation as production
  authority, and every per-cell color draw;
- keep the fifteen IDs, names, order, and gameplay seeds, but replace all masks and
  all thirty route/reference streams;
- each definition owns a separate setup seed and 16–22 explicit
  `{ type, rotation, x }` placements. Type must match the setup seed's next seven-bag
  draw; landing `y` is derived by ordinary hard drop and is never authored/injected;
- public-command setup replay starts from an empty Marathon board, uses rotation,
  horizontal movement, and hard drop only, produces zero line clears/top-out/hidden
  occupancy, and byte-matches the production Puzzle board;
- every source owner remains exactly four cells matching its canonical tetromino
  rotation and material type. Same-type source pieces do not share an orthogonal edge,
  so every visible same-color component is one recognizable tetromino;
- every endgame occupies 8–12 rows, uses all seven types, has at least seven row
  shapes, four density classes, five covered-cavity columns, and eight buried holes;
  masks are pairwise unique with Hamming distance at least 20;
- every level retains automatic gravity and the indefinitely replenishing gameplay
  seven-bag, and has two public-dispatch successful routes of 30–42 locks meeting the
  strengthened diversity thresholds in `DESIGN.md`;
- the reference verifier proves all thirty routes, the fifteen setup replays, and the
  first 84 gameplay pieces as twelve complete seven-bags. Search uses at most two
  concurrent processes; failed candidates are replaced rather than weakening gates;
- after the last Core source change, run one typecheck, one complete Vitest suite, one
  production build, and the complete setup/route verifier. Inspect the exact reference
  JSON, log paths/commands/results, create one candidate commit, and do not push.

Independent read-only Core QA must accept the exact Slice J candidate before Slice K
opens. The old random-color masks, state hashes, reference SHA, screenshots, and
routes are rejected evidence and may not be reused.

## Slice J-R — migrate the stale Puzzle browser-QA route

Task ID: `TETRIS-T5-QA-ROUTE-MIGRATION-009R`

Status: **ACCEPTED** at source checkpoint
`26ef004dc4ab11de8caeee6605bbe21044c5d950`; runtime log checkpoint `aab0dc9` and
Core final-gate log checkpoint `676d804` are accepted read-only records.

Trigger: the post-source full suite passed 39 files / 251 tests and failed only
`src/game/runtime/qaScenario.test.ts` because `PUZZLE_CHALLENGE_QA_ROUTE` still owns
the rejected pre-Slice-J first-level placements. The new first level retains the same
35-lock / 22-line public-command completion contract.

The runtime-QA fixture writer may change only:

- `src/game/runtime/qaScenario.ts`;
- `src/game/runtime/qaScenario.test.ts` only if a direct assertion must change;
- `docs/workstreams/tetris-t5-runtime/THREAD_LOG.md`.

Slice J-R acceptance:

- replace only the frozen `PUZZLE_CHALLENGE_QA_ROUTE` placement stream with the new
  signed first-level route; do not import the large reference JSON into production
  source and do not alter Race fixtures;
- preserve `replayPuzzleChallenge` as public `start` / rotate / move / hard-drop /
  tick dispatch only, with 35 locks, 22 lines, deterministic hash, finished status,
  completed `t3r-shaft-01`, and next level `t3r-shaft-02`;
- do not change Core, engine, timing, rendering, frontend, input/audio/storage,
  dependencies, `index.html`, coordinator documents, changelog, or evidence;
- run the focused `qaScenario.test.ts`, explicit-path stage/diff checks, create one
  bounded runtime-QA source checkpoint, and do not push.

After Slice J-R is green, the Core writer runs the still-pending single final build and
complete 15-setup / 30-route verifier; the already completed final typecheck and full
suite attempt remain recorded, but acceptance requires one green complete suite after
the fixture migration. Independent QA reviews the contiguous Slice J + J-R range.

## Slice K — `暮海矿物` theme and minimal visible copy

Task ID: `TETRIS-T5-DEEP-MINERAL-MINIMAL-010`

Status: **REJECTED BY INDEPENDENT QA** at log candidate `9c128ab`; frozen product
source `1b1bfdbf150afa6708859b81cf12cd876b77d320` remains the repair base only.

Product base: independently accepted Slice J + J-R candidate
`676d804c2be74b107d429c61639ecc03e70e6509`.

Writer base: the coordinator documentation checkpoint that opens Slice K directly
after the accepted product base.

Commit-policy plan: use bounded linear source checkpoints rather than one opaque UI
commit. Theme/renderer, visible App composition/copy, and CSS surface/responsive finish
are separate reviewable claims when their hand-authored range would otherwise exceed
500 lines. Each checkpoint keeps its direct tests green; the expensive final gates and
browser matrix run once after the last product-source change.

The single frontend/render writer may change only:

- `src/App.tsx`;
- `src/App.test.ts`;
- `src/styles.css`;
- `src/game/render/theme.ts`;
- `src/game/render/theme.test.ts`;
- `src/game/render/TetrisRenderer.ts`;
- at most one new focused renderer test under `src/game/render/`;
- `docs/workstreams/tetris-t5-frontend/THREAD_LOG.md`.

The frontend writer must not change Core/Puzzle definitions, setup histories,
references/routes, `puzzleProgress.ts`, presentation/runtime/input/audio, dependencies,
`index.html`, coordinator documents, changelog, or formal evidence.

Slice K acceptance:

- implement the exact `暮海矿物` page tokens and seven-piece four-value table in
  `DESIGN.md`; page and pieces form one natural, coordinated deep spectrum with no
  fluorescent, candy-rainbow, or clashing complementary accents;
- replace the blurred luminous material with the frozen matte anodized primitive:
  135-degree low-delta fill, 1.25–1.75 px radius, one 0.75–1 px dark edge, no locked
  shadow/inner ring/highlight, active using one signal edge and no BlurFilter, zero-fill
  Ghost with one 1 px signal outline, and Board/Next sharing the primitive;
- use solid page/control surfaces. The phase seam is the only page gradient; remove
  backdrop blur, ambient color blobs, gradient CTA, glow shadow, and plastic/glass
  styling. Preserve measured AA and at least 3:1 board-cell contrast endpoints;
- home visibly contains only `Tetris`, one `选择模式`, the three names, their terse
  statistic/objective lines, and `开始` / `选关`; remove the standalone selected-mode
  preview copy and every banned explanatory string in `DESIGN.md`;
- Puzzle rows contain only ordinal, name, and optional completion. Selected detail
  contains silhouette, `目标  清空棋盘`, and `开始`; remove repeated objectives and
  seven-bag/rule explanations;
- game retains mode/level, back, pause, score/statistics, `清空棋盘`, Next, keyboard
  controls, and five touch actions, while removing `本局数据`, long mode-rule copy,
  and explanatory pause/exit paragraphs. ARIA remains complete;
- preserve all stable selectors, internal `marathon`, exact fifteen enabled entries,
  first/eighth/fifteenth canonical binding, 44 px controls, 12/14/18 px floors,
  reduced motion, one-canvas/zero-DOM-cell lifecycle, endless Race, and continuous
  Puzzle behavior;
- run targeted App/theme/renderer tests while editing. After the final source change,
  run one typecheck, one complete suite, one build, the prescribed action client, and
  one five-viewport home/library/game browser matrix; inspect every PNG, log exact
  evidence, create bounded linear source checkpoints plus a log-only checkpoint, and
  do not push.

Independent read-only functional and visual QA must accept the exact Slice K candidate
before the coordinator regenerates explicit-LF formal evidence, updates the changelog,
or decides whether to push.

## Slice K-R — Google typography, coherent dividers, and QA motion repair

Task ID: `TETRIS-T5-MINERAL-TYPE-DIVIDER-011`

Status: **SUPERSEDED — the K-R candidate was repaired and accepted only through
Slice K-R2**.

Product base: rejected-as-final Slice K candidate
`9c128abae1c3ddb3e1de2e783be0b1c37210fc9c`; all accepted Core behavior and the
coordinated mineral palette/material remain fixed.

The repair writer may change only:

- `src/App.tsx` only for canonical silhouette cohesion;
- `src/styles.css`;
- `src/App.test.ts` only for direct visible-copy/structure regression coverage;
- `src/game/render/theme.ts`;
- `src/game/render/theme.test.ts`;
- `src/game/render/TetrisRenderer.ts`;
- `src/game/render/presentation.ts`;
- `src/game/render/presentation.test.ts`;
- `docs/workstreams/tetris-t5-frontend/THREAD_LOG.md`.

Slice K-R acceptance:

- import the exact `Space Grotesk` + `Noto Sans SC` Google Fonts CSS v2 request frozen
  in `DESIGN.md` as the first CSS statement, with `display=swap` and the complete
  system fallback. Do not edit `index.html`, add a dependency, imitate a logo, or
  require the network for legibility/layout correctness;
- apply the pairing consistently to title/UI/numerals, then verify both successful
  font loading and a blocked-font fallback at the five required viewports. No font
  swap may clip names, controls, statistics, or the complete `清空棋盘` goal;
- replace the generic statistic odd/even borders with explicit Classic/Race/Puzzle
  geometry. Puzzle level and objective span full rows on the desktop dock, placed and
  cleared share one middle row, and no viewport contains the reported half divider,
  stray vertical segment, or empty fake quadrant;
- restore visible `Next` and the compact keyboard map at 390 × 844, 360 × 800, and
  844 × 390 without shrinking below 12 px, breaking the board's 1:2 geometry,
  clipping the goal, or adding gameplay scroll;
- reduce `surface-in` to at most 4 px over 180 ms. Cap the ordinary line-clear tonal
  sweep to nine 60 Hz presentation ticks (150 ms) without changing Core clear delay;
  reduced motion must show no positional or sweep transition;
- replace isolated cell plates with cohesive tetromino components. Orthogonally
  adjacent same-material cells bridge the old gap and do not retain full internal
  outlines; any seam stays at or below 0.35 px / 22% alpha. Active, Next, Ghost, and
  locked-board rendering use the same grouping logic, while the canonical silhouette
  substantially closes its per-cell gaps without exceeding one path per piece type;
- add only the frozen directional mineral relief: a 0.75–1.25 px low-alpha signal
  bevel on exposed top/left edges and the material dark edge on exposed bottom/right
  edges. Preserve the exact 28 colors and prohibit white highlight bars, inner rings,
  double outlines, glow, blur, glass, detached shadows, or plastic/candy gloss;
- test the grouping helper with canonical I/O/T/S/Z/J/L cells, proving internal edges
  are suppressed and the Ghost perimeter has no internal cell boxes. Visually inspect
  active, locked, Next, all fifteen authored boards, and post-line-clear fragments at
  desktop and mobile sizes;
- preserve the exact palette/material values, concise copy, `经典`, stable selectors,
  fifteen enabled levels, first/eighth/fifteenth binding, 44 px controls, 12/14/18 px
  floors, one canvas/zero DOM cells, lifecycle, endless Race, and continuous Puzzle;
- run focused App/presentation/renderer tests while editing. After the final product
  source change, run one typecheck, one complete suite, one production build, the
  prescribed action client, and a fresh five-viewport home/library/game matrix with
  original-detail inspection. Use bounded linear source checkpoints if the cohesive
  renderer and typography/layout claims together exceed 500 hand-authored modified
  lines, plus a log-only checkpoint; do not push.

Independent static/functional and visual/browser QA must accept the exact K-R source
checkpoint before formal evidence, changelog integration, or push.

## Slice K-R2 — Semantic statistic roles and landscape action containment

Task ID: `TETRIS-T5-MINERAL-SEMANTIC-REPAIR-012`

Status: **ACCEPTED — source `effb353`, candidate tip `ba5d387`, formal evidence
`c0832e4`**.

Product base: rejected-as-final Slice K-R candidate
`f4fcbb582ac5dfd8fce6fa4a2e3e7cc91e0f4102`; frozen product source
`e38c55c4631beb68eecb648b84d205e4376245b0` remains the implementation base.
Independent static QA rejected generic `nth-child(odd)` inference in the compact
Puzzle statistic grid. Independent visual QA additionally proved every 844 × 390
DPR3 home action cluster is clipped at the shared surface's right boundary in both
loaded-font and blocked-font conditions. All other K-R source and browser gates remain
accepted inputs to this bounded repair, not final release acceptance.

The repair writer may change only:

- `src/App.tsx` only to add explicit statistic-role hooks;
- `src/styles.css` only to replace statistic positional selectors and contain the
  landscape mode actions;
- `src/App.test.ts` only for direct semantic-role/structure regressions;
- `docs/workstreams/tetris-t5-frontend/THREAD_LOG.md` only after source is frozen.

Slice K-R2 acceptance:

- every Classic, Race, and Puzzle statistic article exposes an explicit semantic role;
  all statistic spans and dividers select those roles. No statistic geometry may use
  `nth-child`, `nth-of-type`, `odd`, or `even`;
- preserve the exact desktop and compact row topology already accepted visually:
  Puzzle level/objective full-width on desktop, placed/cleared in the middle, and a
  coherent 2 × 2 compact grid with no half line, dangling segment, doubled edge, or
  fake empty quadrant;
- at 844 × 390 DPR3, all three home entrances show their complete action label and
  rounded arrow border. Each mode button and `.mode-gate__action` must have
  `scrollWidth <= clientWidth`; keep each action at least 44 × 44 px and preserve the
  one-surface 1+2 composition;
- preserve the exact typography, palette/material values, cohesive Pixi grouping,
  concise copy, visible Next/keyboard map, 4 px entrance, nine-tick clear sweep,
  fifteen enabled levels, 2:1 board, 44 px controls, and one-canvas lifecycle from
  frozen source `e38c55c`;
- run focused App tests while editing. After the final source change, run one
  typecheck, one complete suite, one production build, the prescribed action client,
  and one fresh five-viewport loaded-font/blocked-font home/library/game matrix with
  original-detail inspection. Create one bounded source checkpoint and one log-only
  checkpoint; do not push.

Independent static/functional and visual/browser QA must accept the exact K-R2 source
checkpoint before formal evidence, changelog integration, or push.

Disposition: independent static/functional and visual/browser QA accepted exact source
range `bcc25d6..effb353`. The post-source candidate tip `ba5d387` changes only the
frontend workstream log. Formal generator `4d2733b` produced 23 screenshots and
evidence child `c0832e4`; independent evidence QA accepted 23/23 original-detail
captures and reproduced all 25/25 raw-Git-blob SHA-256 entries with zero CRLF in the
JSON and checksum manifest.

## Slice K-R3 — divided cohesive facets and stronger mineral depth

Task ID: `TETRIS-T5-MINERAL-DIVIDED-FACETS-013`

Status: **ACCEPTED AS PART OF FINAL SOURCE `48176fe`**. Source checkpoint `acaf405`
remains the frozen geometry/facet baseline and independent frontend cross-QA accepted
it together with K-R5/K-R6.

Branch base: `028c1580cec7eff92013db614b40491fa4eac9d6`; frozen behavior/layout source is
`effb353c0a4d1bef26fa524ed38d3d3653f45eb8`. The previously accepted evidence is a
historical baseline and must be regenerated after this renderer change.

The renderer writer may change only:

- `src/game/render/theme.ts` and `src/game/render/theme.test.ts`;
- `src/game/render/presentation.ts` and `src/game/render/presentation.test.ts`;
- `src/game/render/TetrisRenderer.ts`;
- `docs/workstreams/tetris-t5-frontend/THREAD_LOG.md` after source is frozen.

Slice K-R3 acceptance:

- preserve the exact seven-piece palette and one connected outer silhouette for every
  orthogonally joined same-material component; same-piece neighbours never expose the
  board well or regain four detached shadows/outer boxes;
- keep the board-well channel between separate material components at least 1.6 times
  the perceived internal groove width. The larger outer gap and finer inner seam must
  make whole-piece grouping readable without changing board geometry;
- draw every shared cell boundary exactly once as the frozen dark groove plus
  lower/right light lip, so all four canonical units remain visible in active, locked,
  Next, and Ghost pieces;
- give each filled unit one restrained inset top/left light and bottom/right dark
  facet while keeping the stronger joined outer bevel. The result must read more
  dimensional without white gloss, plastic, candy, glass, blur, glow, or detached
  depth;
- add deterministic seam enumeration tests for I/O/T/S/Z/J/L, including exact shared
  boundary counts, no duplicate seams, complete outer perimeter, and split fragments;
- preserve typography, statistic dividers, visible Next/keyboard map, concise copy,
  `经典`, fifteen enabled legal残局, endless Race, responsive geometry, 44 px controls,
  reduced motion, one canvas, zero DOM cells, lifecycle, and `index.html` unchanged;
- run focused presentation/theme tests while editing. After the final source change,
  run one typecheck, one complete suite, one production build, the prescribed action
  client, and a fresh five-viewport browser pass with original-detail inspection of
  active, locked, Next, Ghost, and dense Puzzle stacks. Create bounded source and
  log-only checkpoints; do not push before independent static and visual QA accept the
  exact candidate.

## Slice K-R4 — shorter grounded lock window

Task ID: `TETRIS-T5-SHORT-LOCK-WINDOW-014`

Status: **ACCEPTED**. Source `f0ec47c`; log `4fed07c`; independent Core cross-QA
accepted the exact source with no finding.

Writer base: the contract checkpoint created from log candidate `400916c`. The writer
may change only:

- `src/game/core/constants.ts`;
- `src/game/core/core.test.ts` for the direct exact-duration regression;
- `docs/workstreams/tetris-t5-core/THREAD_LOG.md` after source is frozen.

K-R4 acceptance:

- change `LOCK_DELAY_TICKS` from 30 to exactly 18 (about 300 ms at 60 Hz); preserve
  `MAX_LOCK_RESETS`, move/rotation reset rules, hard drop, entry/clear delays, gravity,
  scoring, hashes, and every other Core constant;
- prove a grounded piece remains movable and unlocked through tick 17 and locks on
  tick 18 in Classic, while existing shared-delay tests continue to prove the same
  constant drives Race and Puzzle behavior;
- run the focused Core tests, typecheck, exact-path staging, and one bounded source
  checkpoint. Do not change renderer/UI/Puzzle data/references, dependencies,
  `index.html`, coordinator docs, formal evidence, or push.

## Slice K-R5 — brighter `雾昼矿物` retone

Task ID: `TETRIS-T5-BRIGHT-MINERAL-RETONE-015`

Status: **ACCEPTED**. Source `fd5f901`; log `1e7e5e3`; independent frontend cross-QA
accepted the exact retone and frozen renderer geometry with no finding.

Writer base: the same contract checkpoint. The writer may change only:

- `src/styles.css`;
- `src/game/render/theme.ts` and `src/game/render/theme.test.ts`;
- `docs/workstreams/tetris-t5-frontend/THREAD_LOG.md` after source is frozen.

K-R5 acceptance:

- replace only page/state/piece color values, shadow, action-ink handling, and
  `color-scheme` with the exact `雾昼矿物` table in `DESIGN.md`; retain the existing
  layout, type scale, spacing, semantic dividers, controls, copy, and phase motion;
- preserve K-R3's joined outer silhouette, larger external gap, narrower internal
  groove, raised unit facets, Ghost guides, and every geometry token unchanged;
- keep the board well deep while page and panels become visibly brighter. Technology
  remains in structural precision, typography, focus, and feedback; add no grid,
  neon, glow, ambient blob, decorative telemetry, new component, or marketing copy;
- freeze exact CSS and Pixi tokens in direct tests and retain AA text/action contrast
  plus at least 3:1 contrast for every piece fill endpoint against the board well;
- run focused theme/App tests and the prescribed action client while editing, then
  create one bounded source checkpoint. Do not change Core/runtime/Puzzle data,
  renderer geometry, dependencies, `index.html`, coordinator docs, formal evidence,
  or push.

After both source checkpoints, the coordinator runs one combined final typecheck,
complete suite, build, and five-viewport browser matrix. Independent cross-QA must
accept the exact combined candidate before formal evidence, changelog integration, or
push.

## Slice K-R6 — input-gated entry countdown

Task ID: `TETRIS-T5-ENTRY-COUNTDOWN-016`

Status: **ACCEPTED AFTER REPAIR**. Initial source `7f0b766`; gate repair `48176fe`;
final log tip `d292b15`. Independent frontend cross-QA rejected the first candidate's
DEV-QA reset/selection bypass, then accepted repaired source `48176fe` with no open
finding.

Writer base: the combined K-R4 + K-R5 log candidate. One writer may change only:

- `src/App.tsx` and `src/App.test.ts`;
- `src/game/runtime/GameRuntime.ts` and `src/game/runtime/GameRuntime.test.ts`;
- `src/styles.css` for the countdown overlay only;
- `docs/workstreams/tetris-t5-frontend/THREAD_LOG.md` after source is frozen.

K-R6 acceptance:

- Classic/Race mode start and the selected Puzzle start show the existing game shell
  with centered `3`, `2`, `1`, each for exactly 1000 ms; after `1`, remove the overlay,
  enable input, call the public runtime start path exactly once, and focus the canvas;
- keep the canonical game state `ready` for all three seconds. Keyboard, touch, QA,
  gravity, ticks, scoring, audio events, and pause cannot start or mutate the run early;
- expose an explicit runtime input gate with a direct regression test. Keep the gate
  disabled only for the entry countdown and clear held input whenever it changes;
- restarting/replaying an existing run starts immediately under current behavior and
  must not create another countdown. Reduced-motion removes visual interpolation only;
- style one restrained board-local countdown layer using existing palette/type tokens;
  add no new card, copy, neon, glow, telemetry, layout change, or renderer primitive;
- run focused App/runtime tests and the prescribed browser client, then create bounded
  source and log-only checkpoints. Do not change Core rules, Puzzle definitions,
  renderer geometry, dependencies, `index.html`, coordinator evidence/changelog, or
  push.

The coordinator runs the single final typecheck, full suite, build, and five-viewport
matrix only after K-R6 is source-frozen. Cross-QA acceptance of the exact combined
candidate is required before evidence integration or push.

Disposition: **ACCEPTED**. Final product source
`48176fe3d23cbc450fe39b38310c8a6b6eb71945` retains the mature layout and divided
cohesive facet renderer, applies the exact light `雾昼矿物` palette, shortens the shared
grounded lock delay to 18 ticks, and adds one input-gated three-second entry countdown.
Final post-repair gates passed typecheck; 40 test files with 39 passed / 1 skipped;
262 tests with 260 passed / 2 skipped; the 739-module production build; the prescribed
action client; and an exact-source five-viewport matrix. Independent Core QA accepted
K-R4 and independent frontend/browser QA accepted K-R3/K-R5/K-R6 after repair.
Evidence commit `7d374188b8672cef32b5d90023db4f677421d178` contains 24 captures tied to source
`48176fe` and candidate tip `d292b15`, 26/26 matching SHA-256 entries, a visible digit-3
countdown proof, canonical immutability under QA start/reset/selection/action attempts,
one canvas, zero DOM cells, and zero unexpected browser errors. `index.html`,
dependencies, Puzzle definitions/references, and separate game repositories were not
changed by these refinements.
