# Tetris T2 D4 Production Acceptance Matrix

Result: **independently accepted** against baseline
`0a28a1f4efad72296e46b0a91d859c45cc300edf`. Product candidate `a7aca5f` and the
portable evidence-manifest chain through `9d704d9` passed QA. This is a branch
milestone, not a production deployment claim.

## Frozen deterministic rules

- Seven-bag, movement, collision, wall kicks, hard drop, lock, clear, scoring,
  pause, restart, top-out, and Race completion are renderer-independent.
- Hold/暂存 is absent from state, commands, events, inputs, renderer, controls, hash,
  replay, and tests.
- Marathon has no fixed terminal target; top-out ends the run. Lines raise the level
  and level selects gravity.
- Race targets 20 cleared lines, derives elapsed time only from fixed ticks, advances
  gravity every five locks, and caps at the final fixed gravity tier.
- A Race finishing clear immediately changes state to `finished`; it does not spawn a
  new piece. Failed or incomplete Race runs cannot become completion records.
- Mode, piece count, elapsed ticks, and completion state participate in deterministic
  hash/replay coverage.
- Puzzle is the sole third mode: three typed, validated clean-room definitions carry
  fixed board/queue/budget/target data in canonical state/hash/replay; it has no
  automatic gravity and terminates only by target completion or exhausted budget.

## Frozen interface and persistence requirements

- Formal game name is exactly `Tetris`; mode labels are always `马拉松模式`、`竞速模式`、
  `解谜模式`; other player-facing copy is concise Chinese.
- D4 Offset Drop uses warm ungridded paper, a deep-ink 1:2 board, one cinnabar title
  drop-band, and restrained cobalt/cinnabar edge offset—never `T.`, jade dashboard,
  cards, modal/glass framing, or fake telemetry.
- Ready is a board-led local start page with three flat mode lines, goal/end data,
  empty board+ghost, and one start. It has no live stats, `下一个方块`, or leaderboard.
- Playing has one `下一个方块`, appropriate three-field stats, and no Hold region.
- Pause scrim and ≤18%-board paper strip stay exactly inside the board. Mode switch
  freezes/dims the board with empty board inner text and keeps its mode list outside.
- Keyboard `C`/`Shift` and touch Hold/暂存 controls are absent. ArrowUp dispatches
  clockwise rotation; hidden Z/X compatibility is allowed but no visible help shows
  it. Five controls are ≥44 px: ←, →, ↑ 旋转, ↓ 快速下落, ⇣ 直接落底.
- Marathon records sort score desc, lines desc, pieces desc, fixed-tick time asc.
- Race completion records sort completion ticks asc, pieces asc, score desc,
  fixed-tick time asc.
- The versioned local schema validates and migrates fail-closed, caps each mode at
  eight records, and never enters the simulation core.

## Candidate browser evidence recorded

- Official local-candidate manifest and real PNGs cover both ready explanations,
  Marathon play, Race selection plus true first-lock state, true command/replay-built
  20-line completion, both leaderboards, explicit pause, and desktop/portrait/
  landscape contexts.
- 1440 × 900 DPR1, 390 × 844 DPR3, and 844 × 390 DPR3 retain the complete 10 × 20
  board with no horizontal overflow.
- Each geometry capture proves exactly one canvas, zero gameplay DOM cells, zero
  console errors, 1:2 board ratio, non-overlapping cluster bounds, board-contained
  pause strip, and touch zones ≥44 CSS px.
- Keyboard and touch soft drop prove quick repeated movement and immediate stop on
  release.
- The 16 visible candidate PNGs were manually reviewed where state-specific visual
  judgment matters; `browser-evidence.json` reports `result: "passed"`, zero
  console/page errors, and SHA-256 values matching every referenced PNG. The rules
  evidence and complete SHA-256 record are in `docs/qa/evidence/tetris-t2/`.

## Accepted gate record

- No dependency install was required because the dependency tree was present.
- Before the 001A correction: one full 47/47 Vitest run and one build passed.
- After the correction: `npm.cmd run typecheck` and the 2-file/5-test
  renderer/runtime delta suite passed.
- One formal browser-evidence pass completed with `result: "passed"`; its 16 PNG
  hashes match its JSON references. Do not rerun these gates in this worktree.
- Independent QA performed a clean install, typecheck, the complete 9-file / 47-test
  suite, build, rule review, and submitted visual-evidence review against `a7aca5f`.
- QA-003 independently streamed all 18 evidence files from the final candidate as raw
  Git blobs under both `core.autocrlf=true` and `false`; every SHA-256 matched the
  portable manifest in `9d704d9`.
- QA-002 commit `eabbcb6` is superseded and excluded from the accepted chain.
