# Current Task

## Completed slice: T2 — D4 Offset Drop accepted

Branch: `codex/tetris`

Baseline: `0a28a1f4efad72296e46b0a91d859c45cc300edf` (accepted and pushed T1)

Status: **independently accepted and integrated**. Product candidate `a7aca5f`, the
portable evidence-manifest correction through `9d704d9`, and QA-003 acceptance have
completed the T2 gate. This records a branch milestone, not a production deployment.

### Authorized scope

- Remove player Hold/暂存 from the deterministic core, renderer, input, controls,
  replay/hash coverage, and all player-facing UI.
- Preserve the completed Hold removal, Marathon/Race rules, and leaderboard work;
  finish a third, deterministic, clean-room Puzzle mode under the frozen `DESIGN.md`
  rules without adding a fourth mode.
- Implement the D4 Offset Drop UI from read-only design SHA
  `7fc81433736e3279f7a7075f0d9054ec31d5c67f`: the compact 1:2 game cluster, complete
  mode names, ready/playing/pause/mode-switch contracts, unique Next, and responsive
  desktop/portrait/landscape layouts.
- Version and harden local leaderboard persistence, mode-specific validation, sorting,
  and migration without putting storage into the core.
- Keep the accepted Pixi/React architecture, fast held soft drop, and responsive
  desktop/portrait/landscape composition intact. Do not create DOM board cells.
- Add final-candidate evidence for rules, ready surfaces, play, completion,
  leaderboard, pause, geometry, one canvas, zero DOM cells, and zero console errors.

### Frozen non-goals

- No gameplay changes outside the frozen three-mode rules and presentation shell.
- No render-architecture rewrite, DOM cell grid, multiplayer, accounts, backend, or
  online leaderboard.
- No copied commercial assets, music, fonts, logos, screens, level layouts, or exact
  trade dress.
- No work in `E:\Proj\Game-1-temple` and no interaction with
  `docs/screenshots/temple/`.

### Completed implementation evidence

The coordinator accepted the D4 development visual gate and the 001A mode-switch
preview-removal correction. The checked-in formal evidence under
`docs/qa/evidence/tetris-t2/` contains 16 real-runtime captures across 1440 × 900,
390 × 844 DPR3, and 844 × 390 DPR3; rules/replay proof; input proof; geometry; and
PNG/JSON SHA-256 records. It reports `result: "passed"`, one canvas, zero gameplay
DOM cells, no overflow, and zero console/page errors.

### Acceptance gate record

Independent QA reproduced a clean install, typecheck, the full 9-file / 47-test suite,
and build against `a7aca5f`; it also reviewed the rule and visual evidence. QA-003 then
verified the final checksum-only child `9d704d9`: all 18 evidence entries match their
canonical raw Git blobs with both `core.autocrlf=true` and `false`. The superseded
checkout-filtered QA-002 decision is not part of the integrated acceptance chain.
