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
