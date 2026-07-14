# Tetris T3 Mineral Shelf Frontend — Thread Log

- Workstream: `TETRIS-T3-V1`
- Coordinator thread: `019f4deb-7e83-7583-8cd5-8e6f075bc331`
- Base: `3bed71f8a84e4608beae4bbaf4479cfbed4e69ed` (`codex/tetris`); this detached
  implementation worktree is clean at that base before the slice.
- Scope: only the coordinator-authorized React/CSS/render/runtime/presentation paths,
  the local Puzzle-progress module, final T3 evidence, and this log. No core rules,
  authored campaign data, package/config, root docs, T2 evidence, or Temple path is
  part of the delta.

## Bounded implementation record

- Replaced the deprecated Offset Drop shell with the accepted light `浅岩台 / Mineral
  Shelf` surface: warm paper, a light 1:2 Pixi board, small complete wordmark, and
  shared ochre/blue-grey mineral feet for the board and five-command rail.
- Bound Puzzle select/play/result UI directly to the six compiled C1 definitions and
  canonical `puzzleQueueIndex`, goal, completion, and next-unlock fields. The shell
  contains no line-target progress bridge, fake result, solver, undo, or extra preview.
- Added versioned fail-closed presentation storage. Only canonical success can advance
  the selectable level through the core-reported next unlock; malformed, old-version,
  and unknown storage reset to level one only.
- Added public runtime Puzzle selection and extended the existing dev-only structured
  QA surface with public start/select/restart commands. The capture script drives
  public command/input paths rather than a production state override.
- Focused checks before the browser loop: `npm.cmd run typecheck` passed; the four
  affected Vitest files passed 12 tests. One lockfile install was necessary because
  this detached worktree had no `node_modules`.
- One bounded development browser loop passed after its single visual correction pass:
  14 desktop/portrait/landscape/Puzzle captures, no page overflow, one canvas, zero
  DOM cells, 1:2 frame, five 44px+ controls, canonical Puzzle select/play/results,
  and zero recorded console errors. Every generated preview was manually inspected.
- Final-evidence hardening added explicit title and touch-label bounds. It exposed the
  360x800 long Puzzle rail extending below the viewport; the narrow long-Puzzle tray
  now uses a 200x400 (1:2) board so all five controls and labels fit. The final runner
  resets only Playwright's hidden-container auto-scroll before each frame and rejects
  clipped titles, rails, or labels.

## Candidate handoff

- Final gates passed: `npm.cmd run typecheck`, the complete 12-file / 78-test suite,
  and `npm.cmd run build`.
- Final browser evidence passed all 16 captures: desktop ready/playing/paused/mode/
  Puzzle select/play/success/failure; portrait playing/paused/select/play; landscape
  playing/select; 360x800 long Puzzle values; and malformed-progress fail-closed.
  It records one canvas, zero gameplay DOM cells, no overflow/overlap, 1:2 board,
  44px+ rail, 12px+ copy, zero console/page errors, real keyboard release, touch,
  pause/restart/mode/selection actions, and canonical level-one unlock.
- A local-only candidate is ready for independent QA and coordinator integration. It
  has not been pushed, and this workstream makes no acceptance claim.

## Evidence integrity correction (R1)

- Pre-QA found only a checksum-domain mismatch: the two textual
  `browser-evidence.json` values had been hashed from checkout bytes affected by
  line-ending filters. PNG entries remained correct.
- `SHA256SUMS.txt` now defines the canonical domain as the raw candidate Git blob
  bytes streamed through `git show <candidate>:<path>` into `hashlib.sha256`; it is
  independent of `core.autocrlf` and worktree checkout bytes. No evidence JSON, PNG,
  product source, or browser/test/build artifact was regenerated.
