Original prompt: separate Tetris into E:\Proj\Game-1-tetris, diagnose the mixed Temple/Tetris history and local QA copies, then correct the tiny and overlapping Tetris presentation without changing accepted game rules.

## 2026-07-15

- Created standalone Tetris repository and retained QA clones under `.local/qa-archives`.
- Isolated stale pre-V1 `dist` outside the active repository.
- Confirmed `4c85828` is the last pure Tetris integration point; later commits are docs-only coordination changes.
- Confirmed the screenshots use the accepted V1 source, not an alternate version.
- Root cause: 718 px shell cap, 306 px board cap, 174 px three-mode rail, and five controls forced into 306 px.
- Implemented the bounded T4 desktop layout recovery: 380 × 760 at 1440 × 900,
  460 × 920 at 2048 × 1152, complete Chinese mode labels, stacked control
  glyphs/labels, and the corrected pause-height ratio.
- Final local gates passed once: typecheck, 36-file/234-test Vitest, build, and a
  19-capture browser matrix under `docs/qa/evidence/tetris-t4/`.
- Active TODO: independent QA, coordinator changelog integration, and one push.

## 2026-07-16 — T5 opened

- User rejected the T4 Mineral Shelf presentation and requested a full light cyan/light-blue rebuild with a dedicated three-mode entry page.
- Race changed from a 20-line finish to endless accelerating normal play; only explicit exit or top-out ends the run.
- Puzzle first changed to longer finite authored queues, then the user superseded that
  draft: current authority is normal automatic-gravity play on an authored starting
  board, a continuously replenishing deterministic seven-bag stream, no piece budget,
  and multiple valid solution routes per level.
- Root-cause audit found Puzzle soft drop can reach the floor but never lock because puzzle ticks return before grounded lock-delay handling.
- Preserved the rejected T4 follow-up on local branch `codex/tetris-t4-rejected-preservation` at `1362c664629b2a83f0659f836259b84c21750fee`, then returned to a clean `codex/tetris-recovery` tree.
- T5 uses the `4c85828` deterministic core/rule authority while retaining `dd7e31e` only as a historical ancestor.
- Core candidate `3bf170e` proved endless Race and repaired consecutive Puzzle locking,
  but independent QA rejected its live runtime replay-state injection. The injection
  deletion is retained uncommitted while the finite-queue Puzzle work is superseded.
- Revised Core candidate `630fb30` implements seeded normal play, twelve verified
  multi-route references, automatic gravity, continuous seven-bag input, and no budget
  terminal. Independent read-only QA accepted it after 22-file / 140-test focused
  verification and typecheck.
- Active TODO: implement and verify the original `青流方阵` Aqua Blueprint frontend,
  then one combined final gate/evidence pass and final QA.
- User removed `index.html` from the redesign scope; it remains unchanged as the Vite
  entry while page branding and accessibility copy are rebuilt under `src`.
- User clarified the product remains a browser HTML webpage, not a native app or PWA.
- Frontend candidate `b480e7d` and coordinator evidence child `9b7e552` passed the
  combined typecheck, 37-file / 237-test suite, build, five-viewport browser matrix,
  visible keyboard/touch scenarios, and visual review.
- Independent final QA rejected `9b7e552` on one fail-closed issue: DEV
  `__TETRIS_D4_QA__.collect()` exposes the runtime state object by reference. The
  bounded `TETRIS-T5-FINAL-QA-FIX-001` slice must return a detached snapshot, prove
  nested mutation isolation, and refresh final-SHA browser evidence before integration.

## 2026-07-17 — first T5 frontend rejected

- User rejected both the `青流方阵` name and the complete Aqua Blueprint page;
  candidate `b480e7d` and evidence child `9b7e552` remain local rejected history.
- The standalone snapshot-only fix was stopped before it changed any file. Its
  state-clone regression requirement moves into `TETRIS-T5-FRONTEND-REDESIGN-002`.
- Current frontend authority is plain-text `Tetris`, a clean light cyan/light-blue
  game interface, compact layered mode entrances, a non-overlapping Puzzle selector,
  one coherent game surface, and rounded ceramic cells. No commercial logo, font,
  product layout, or trade dress may be copied.

## 2026-07-17 — second T5 frontend rejected

- Candidate `c9135f3252abfa3bd6d7e94c5eb2e11fc3c72a18` completed typecheck,
  38 files / 238 tests, build, and bounded browser smoke, but the user rejected its
  full visual presentation rather than requesting a local polish pass.
- Independent review also found computed mobile statistic text at only 8–11 px and
  legacy player-facing `路线` copy. Those findings move into the replacement contract;
  the rejected rounded mode bands and ceramic cells are not repaired in place.
- Latest authority is light neo-tech minimal: one continuous 1+2 mode surface, precise
  thin edges, one cyan-to-blue phase seam, coherent Puzzle/game surfaces, and flat
  edge-lit plate cells. Grids, CAD/scanlines, decorative technical text, toy/glass
  styling, marketing heroes, settings lists, floating-card piles, and looping
  ornament are forbidden.
- The accepted endless Race, continuous seven-bag Puzzle, all-level access,
  lifecycle/accessibility behavior, and detached QA snapshot regression remain fixed.
- Next: commit the Slice E contract, authorize one bounded frontend writer, then route
  the exact candidate through independent QA before evidence, changelog, or push.

## 2026-07-17 — Slice E final evidence rejected with bounded fixes

- Neo-tech minimal candidate `f66c118` and compact-layout fix `f277c2a` passed writer
  gates and independent product QA. Coordinator evidence child `221c821` contains 16
  first-viewport captures and passed the final 38-file / 238-test suite and build.
- Final visual QA found one product defect: at 360 × 800 the Puzzle goal is visibly
  ellipsized as `清空完整棋...` instead of `清空完整棋盘`.
- Final static QA found one evidence-integrity defect: Windows CRLF bytes were hashed
  before Git normalized `browser-evidence.json` to LF, so raw Git-blob verification
  matched 17/18 entries even though the local working tree matched 18/18.
- All other reviewed visuals, five-viewport geometry, 44 px controls, 12/14/18 px
  type floors, lifecycle teardown, detached snapshots, normal-gravity Puzzle locks,
  public-keyboard success, endless Race, and evidence scope passed.
- Next: one CSS/log writer fixes only the narrow Puzzle statistic allocation; after
  independent product QA, the coordinator regenerates all formal evidence with
  explicit LF output and repeats final exact-commit QA before changelog or push.

## 2026-07-17 — fifteen-level multi-color direction opened

- Slice F candidate `56288cd` fixed the 360 × 800 Puzzle goal using only a 40/60
  narrow statistic-column allocation plus the frontend log. Independent browser QA
  accepted the exact SHA at 360/390/844: complete `清空完整棋盘`, 18 px value text,
  44 px controls, one canvas, zero DOM cells, no overflow, and no console errors.
- The user then extended the product target before release: player-facing `马拉松`
  becomes `经典`; pieces use a more varied original multi-hue palette; Puzzle grows
  from six to at least fifteen all-enabled levels; and every prefilled board uses
  multiple piece colors.
- Public descriptions of comparable falling-block products informed only the abstract
  split between continuous classic play and a larger level library. No external level
  mask, name, palette mapping, interface, or trade dress is copied.
- Core preflight confirmed that normal gravity, continuous seven-bag replenishment,
  board-empty success, top-out, and progress derivation are already level-count
  independent. Slice G therefore owns fifteen definitions, deterministic multi-color
  canonical boards, nine new original masks/seeds, and thirty public-dispatch route
  proofs without changing engine/random/runtime/frontend code.
- After independent Core QA, Slice H owns visible `经典` copy, the frozen original
  mineral-signal seven-color theme, and a responsive fifteen-entry library. Formal
  evidence and raw-blob LF correction are deferred until both new slices pass QA.
- No push is eligible from the rejected six-level evidence chain.

## 2026-07-17 — Slice G fifteen-level Core accepted

- Core candidate `48a229e` extends the production library to exactly fifteen levels,
  retains the first six IDs, seeds, normalized occupancy masks, and two placement
  streams, and adds nine original seeds/masks with thirty total production
  `createInitialState` plus public-`dispatch` solution routes.
- Every authored starting board now uses all seven piece types through a deterministic
  salted color pass that is independent from gameplay randomization. Independent QA
  confirmed the first 84 pieces remain twelve complete seven-bags for all fifteen
  seeds and that generation continues beyond that horizon.
- Independent Core QA accepted the exact candidate: new levels each use 10 occupied
  rows, 10 normalized row shapes, 4 density classes, 5–9 covered-cavity columns, and
  11–14 buried holes; pairwise new-mask Hamming distance is at least 24; routes use
  29–35 locks and every route pair diverges in an intermediate canonical board hash.
- Writer gates passed: typecheck, 38 files / 248 tests, 739-module production build,
  and the explicit 15-level / 30-route verifier. QA reran only bounded target tests,
  verified reference SHA-256
  `F1A05DB8CA31B6833FCF09F096A5C726E29D5B95274897A2A7E0259A5ED7696C`, and left the
  worktree clean.
- Slice H is now the sole active writer boundary: visible `经典`, the frozen original
  seven-color mineral-signal theme, and the responsive fifteen-entry level library.
  Core definitions, routes, engine, randomizer, `index.html`, and formal evidence stay
  read-only until frontend QA accepts its exact candidate.

## 2026-07-17 — Slice H functional candidate visually superseded

- Slice H candidate `248ca89` completed `经典`, dynamic fifteen-level binding, 3 × 5
  desktop/844 and two-column mobile selectors, canonical first/eighth/fifteenth UI
  starts, and seven-color Board/Next/silhouettes. Writer gates passed after its last
  source fix: typecheck, 40 files / 252 tests with one intentional skipped helper,
  739-module build, and the five-viewport browser matrix.
- The user rejected this finish before independent acceptance: the page must look more
  premium, the current blocks are specifically ugly, and every piece must use bright
  color. `248ca89` remains a clean fallback only; no evidence or push may use it.
- Read-only visual diagnosis found the ordinary feel came from table-wall repetition,
  empty detail space, repeated rounded HUD cards, generic segmented controls, and the
  muted double-outlined minos reading as plastic/candy at mobile scale.
- Slice I now owns one bounded frontend/render replacement. It preserves all accepted
  behavior and responsive geometry while introducing the exact bright luminous-spectrum
  mapping, a flat precision-slab Pixi primitive, tighter premium hierarchy, coherent
  HUD/control surfaces, and a filled final mobile grid row. Core, dependencies,
  `index.html`, coordinator docs after this contract, and formal evidence remain
  read-only for the writer.
- The user then broadened the page palette itself: premium technology color is not
  restricted to light blue/green. Slice I therefore uses an ice-light spectral-glass
  system with controlled cyan, cobalt, violet, and small coral state accents while
  keeping the separate seven-piece bright mapping and avoiding a dark/random rainbow.
